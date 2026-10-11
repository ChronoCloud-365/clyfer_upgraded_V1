import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import ts from "typescript";
import { DatabaseSync } from "node:sqlite";

// Compile the actual backend with the project's TypeScript dependency.
const directory = mkdtempSync(join(tmpdir(), "clyfar-inventory-test-"));
const require = createRequire(import.meta.url);
for (const name of ["model", "database", "products", "orders"]) {
  const compiled = ts.transpileModule(readFileSync(resolve(`lib/inventory/${name}.ts`), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText.replaceAll('require("./model")', 'require("./model.cjs")')
    .replaceAll('require("./database")', 'require("./database.cjs")')
    .replace('require("zod")', `require(${JSON.stringify(require.resolve("zod"))})`);
  writeFileSync(join(directory, `${name}.cjs`), compiled);
}
const fixtureRequire = createRequire(join(directory, "database.cjs"));
const { openInventoryDatabase, readInventory, executeInventoryCommand } = fixtureRequire("./database.cjs");
const { inventoryValue } = fixtureRequire("./model.cjs");
const { inventoryProducts } = fixtureRequire("./products.cjs");
const { placeInventoryCheckout, readInventoryOrders, updateInventoryOrderStatus } = fixtureRequire("./orders.cjs");
after(() => rmSync(directory, { recursive: true, force: true }));

function setup(filename = ":memory:", fields = {}) {
  const db = openInventoryDatabase(filename);
  executeInventoryCommand(db, { action: "create_item", name: "Oxford", sku: "oxf-01", category: "Formal Shoes", subcategory: "Oxford", low_stock_threshold: 5, ...fields });
  const item = readInventory(db).items[0];
  executeInventoryCommand(db, { action: "add_variant", item_id: item.id, color: "Red", size: "42", quantity: 6 });
  return { db, item, variant: readInventory(db).variants[0] };
}
const stock = (variant, fields = {}) => ({ action: "stock", variant_id: variant.id, kind: "issue", quantity: 1, expected_quantity: variant.quantity, reason: "Sale SO-001", request_id: randomUUID(), ...fields });

test("sale reduces only the selected color and size and records the balance", () => {
  const { db, item, variant } = setup();
  try {
    executeInventoryCommand(db, { action: "add_variant", item_id: item.id, color: "Red", size: "38", quantity: 10 });
    executeInventoryCommand(db, stock(variant));
    const state = readInventory(db);
    assert.equal(state.variants.find((entry) => entry.size === "42").quantity, 5);
    assert.equal(state.variants.find((entry) => entry.size === "38").quantity, 10);
    assert.deepEqual([state.movements[0].before_quantity, state.movements[0].after_quantity, state.movements[0].delta], [6, 5, -1]);
  } finally { db.close(); }
});
test("insufficient stock rolls back quantity and movement together", () => {
  const { db, variant } = setup();
  try {
    assert.throws(() => executeInventoryCommand(db, stock(variant, { quantity: 7 })), /Insufficient stock/);
    assert.equal(readInventory(db).variants[0].quantity, 6);
    assert.equal(readInventory(db).movements.length, 1);
  } finally { db.close(); }
});
test("case-insensitive duplicate SKU and color/size pairs are rejected", () => {
  const { db, item } = setup();
  try {
    assert.throws(() => executeInventoryCommand(db, { action: "create_item", ...item, sku: "oxf-01" }), /SKU already exists/);
    assert.throws(() => executeInventoryCommand(db, { action: "add_variant", item_id: item.id, color: " red ", size: "42", quantity: 9 }), /color and size already exists/);
    assert.equal(readInventory(db).variants.length, 1);
  } finally { db.close(); }
});
test("subcategory relationship and fractional or negative stock are rejected", () => {
  const { db, variant } = setup();
  try {
    assert.throws(() => executeInventoryCommand(db, { action: "create_item", name: "Invalid", sku: "invalid", category: "Formal Shoes", subcategory: "Wallets", low_stock_threshold: 5 }), /subcategory/);
    for (const quantity of [-1, 0, 1.5]) assert.throws(() => executeInventoryCommand(db, stock(variant, { quantity })));
    assert.equal(readInventory(db).variants[0].quantity, 6);
  } finally { db.close(); }
});
test("retrying a stock request applies it exactly once", () => {
  const { db, variant } = setup();
  try {
    const command = stock(variant);
    executeInventoryCommand(db, command);
    executeInventoryCommand(db, command);
    assert.equal(readInventory(db).variants[0].quantity, 5);
    assert.equal(readInventory(db).movements.length, 2);
    assert.throws(() => executeInventoryCommand(db, { ...command, quantity: 2 }), /already used/);
  } finally { db.close(); }
});
test("physical count rejects a stale balance and supports counting to zero", () => {
  const { db, variant } = setup();
  try {
    executeInventoryCommand(db, stock(variant));
    assert.throws(() => executeInventoryCommand(db, stock(variant, { kind: "count", quantity: 0 })), /Stock changed/);
    executeInventoryCommand(db, stock(variant, { kind: "count", quantity: 0, expected_quantity: 5 }));
    assert.equal(readInventory(db).variants[0].quantity, 0);
  } finally { db.close(); }
});
test("two database connections cannot oversell the same balance", () => {
  const filename = join(directory, "concurrent.sqlite");
  const { db, variant } = setup(filename);
  const second = openInventoryDatabase(filename);
  try {
    executeInventoryCommand(db, stock(variant, { quantity: 4 }));
    assert.throws(() => executeInventoryCommand(second, stock(variant, { quantity: 4 })), /Insufficient stock/);
    assert.equal(readInventory(second).variants[0].quantity, 2);
  } finally { second.close(); db.close(); }
});
test("inventory survives reopening the database and supports One Size", () => {
  const filename = join(directory, "persistent.sqlite");
  const { db, item } = setup(filename);
  executeInventoryCommand(db, { action: "add_variant", item_id: item.id, color: "Black", size: "One Size", quantity: 8 });
  db.close();
  const reopened = openInventoryDatabase(filename);
  try {
    assert.equal(readInventory(reopened).variants.find((entry) => entry.size === "One Size").quantity, 8);
    assert.equal(readInventory(reopened).items[0].sku, "OXF-01");
  } finally { reopened.close(); }
});

function checkout(item, fields = {}) {
  return { request_id: randomUUID(), customer_name: "Test Customer", phone: "01700000000", address: "Test address",
    city: "Dhaka", notes: "", shipping_area: "inside",
    items: [{ product_id: item.id, color: "Red", size: "42", quantity: 2, expected_price: item.sale_price }], ...fields };
}

test("inventory valuation uses unit purchase and selling prices with decimal precision", () => {
  const { db } = setup(":memory:", { cost_price: 1500.25, sale_price: 2500.75 });
  try {
    const state = readInventory(db);
    assert.deepEqual(inventoryValue(state.items, state.variants), { cost: 9001.5, selling: 15004.5 });
    assert.throws(() => executeInventoryCommand(db, { action: "update_item", ...state.items[0], cost_price: 1.123 }), /decimal/);
  } finally { db.close(); }
});
test("public products hide purchase cost, omit drafts, and show exact variant quantities", () => {
  const { db, item } = setup(":memory:", { cost_price: 1500, sale_price: 2500 });
  try {
    let state = readInventory(db);
    assert.deepEqual(inventoryProducts(state.items, state.variants), []);
    executeInventoryCommand(db, { action: "update_item", ...item, is_published: true });
    state = readInventory(db);
    const product = inventoryProducts(state.items, state.variants)[0];
    assert.equal(product.price, 2500);
    assert.equal(product.variants[0].quantity, 6);
    assert.equal(product.sizes[0], "42");
    assert.ok(!JSON.stringify(product).includes("cost"));
    assert.equal(product.images[0], "/product-placeholder.svg");
  } finally { db.close(); }
});
test("checkout atomically creates the order, uses server prices, and deducts stock once", () => {
  const { db, item } = setup(":memory:", { cost_price: 1500, sale_price: 2500, is_published: true });
  try {
    const command = checkout(item, { total_price: 1 });
    const orders = placeInventoryCheckout(db, command, 8000);
    assert.equal(orders[0].total_price, 5080);
    assert.equal(readInventory(db).variants[0].quantity, 4);
    const retry = placeInventoryCheckout(db, command, 8000);
    assert.equal(retry[0].id, orders[0].id);
    assert.equal(readInventoryOrders(db).length, 1);
    assert.equal(readInventory(db).variants[0].quantity, 4);
    assert.throws(() => placeInventoryCheckout(db, { ...command, customer_name: "Another customer" }, 8000), /already used/);
    const state = readInventory(db);
    assert.equal(inventoryProducts(state.items, state.variants)[0].variants[0].quantity, 4);
    assert.equal(inventoryValue(state.items, state.variants).cost, 6000);
  } finally { db.close(); }
});
test("a cart with insufficient stock rolls back all orders and all deductions", () => {
  const { db, item } = setup(":memory:", { sale_price: 2500, is_published: true });
  try {
    executeInventoryCommand(db, { action: "add_variant", item_id: item.id, color: "Red", size: "38", quantity: 1 });
    const command = checkout(item);
    command.items.push({ ...command.items[0], size: "38", quantity: 2 });
    assert.throws(() => placeInventoryCheckout(db, command, 8000), /Only 1 units/);
    assert.equal(readInventory(db).variants.find((entry) => entry.size === "42").quantity, 6);
    assert.equal(readInventoryOrders(db).length, 0);
    assert.equal(db.prepare("SELECT count(*) AS count FROM inventory_checkouts").get().count, 0);
  } finally { db.close(); }
});
test("checkout rejects drafts and stale selling prices", () => {
  const { db, item } = setup(":memory:", { sale_price: 2500 });
  try {
    assert.throws(() => placeInventoryCheckout(db, checkout(item), 8000), /no longer available/);
    executeInventoryCommand(db, { action: "update_item", ...item, is_published: true });
    const command = checkout(item);
    command.items[0].expected_price = 100;
    assert.throws(() => placeInventoryCheckout(db, command, 8000), /price.*changed/);
    assert.equal(readInventoryOrders(db).length, 0);
  } finally { db.close(); }
});
test("order cancellation restores stock once and cannot reactivate a cancelled order", () => {
  const { db, item } = setup(":memory:", { sale_price: 2500, is_published: true });
  try {
    const order = placeInventoryCheckout(db, checkout(item), 8000)[0];
    updateInventoryOrderStatus(db, order.id, "cancelled");
    updateInventoryOrderStatus(db, order.id, "cancelled");
    assert.equal(readInventory(db).variants[0].quantity, 6);
    assert.equal(readInventory(db).movements.filter((entry) => entry.kind === "receive").length, 1);
    assert.throws(() => updateInventoryOrderStatus(db, order.id, "pending"), /Cannot change/);
  } finally { db.close(); }
});
test("multi-line checkout allocates shipping exactly and delivered orders cannot be cancelled", () => {
  const { db, item } = setup(":memory:", { sale_price: 2500.25, is_published: true });
  try {
    executeInventoryCommand(db, { action: "add_variant", item_id: item.id, color: "Black", size: "One Size", quantity: 5 });
    const command = checkout(item);
    command.items.push({ ...command.items[0], color: "Black", size: "One Size", quantity: 1 });
    const orders = placeInventoryCheckout(db, command, 8001);
    assert.equal(Math.round(orders.reduce((sum, order) => sum + order.total_price, 0) * 100), 758076);
    for (const status of ["confirmed", "shipped", "delivered"]) {
      updateInventoryOrderStatus(db, orders[0].id, status);
      if (status === "shipped") assert.throws(() => updateInventoryOrderStatus(db, orders[0].id, "cancelled"), /Cannot change/);
    }
    assert.throws(() => updateInventoryOrderStatus(db, orders[0].id, "cancelled"), /Cannot change/);
  } finally { db.close(); }
});
test("schema migration preserves existing item and variant records", () => {
  const filename = join(directory, "old-schema.sqlite");
  const old = new DatabaseSync(filename);
  old.exec("CREATE TABLE inventory_items (id TEXT PRIMARY KEY,name TEXT NOT NULL,sku TEXT NOT NULL UNIQUE,category TEXT NOT NULL,subcategory TEXT NOT NULL,low_stock_threshold INTEGER NOT NULL,created_at TEXT NOT NULL)");
  const id = randomUUID();
  old.prepare("INSERT INTO inventory_items VALUES(?,?,?,?,?,?,?)").run(id, "Existing item", "OLD-001", "Formal Shoes", "Oxford", 5, new Date().toISOString());
  old.close();
  const upgraded = openInventoryDatabase(filename);
  try {
    const item = readInventory(upgraded).items[0];
    assert.equal(item.id, id);
    assert.equal(item.cost_price, 0);
    assert.equal(item.is_published, false);
  } finally { upgraded.close(); }
});
