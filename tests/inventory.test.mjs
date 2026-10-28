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
for (const name of ["model", "database", "products", "orders", "schema", "taxonomy", "errors", "images"]) {
  const compiled = ts.transpileModule(readFileSync(resolve(`lib/inventory/${name}.ts`), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText.replace(/require\("\.\/(\w+)"\)/g, 'require("./$1.cjs")')
    .replace('require("zod")', `require(${JSON.stringify(require.resolve("zod"))})`);
  const resolved = compiled.replace('require("sharp")', `require(${JSON.stringify(require.resolve("sharp"))})`);
  writeFileSync(join(directory, `${name}.cjs`), resolved);
}
const fixtureRequire = createRequire(join(directory, "database.cjs"));
const { openInventoryDatabase, readInventory, executeInventoryCommand } = fixtureRequire("./database.cjs");
const { inventoryValue } = fixtureRequire("./model.cjs");
const { generateVariantDrafts, effectivePrice } = fixtureRequire("./model.cjs");
const { executeTaxonomyCommand, readTaxonomy, dynamicCatalog } = fixtureRequire("./taxonomy.cjs");
const { compressItemImage, MAX_IMAGE_BYTES } = fixtureRequire("./images.cjs");
const sharp = require("sharp");
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
    assert.throws(() => executeInventoryCommand(db, { action: "add_variant", item_id: item.id, color: " red ", size: "42", quantity: 9 }), /combination already exists/);
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

test("departments and custom category/subcategory records drive the public hierarchy", () => {
  const db = openInventoryDatabase(":memory:");
  try {
    executeTaxonomyCommand(db, { action: "save_department", name: "Men" });
    const department = readTaxonomy(db).departments[0];
    executeTaxonomyCommand(db, { action: "save_category", name: "Casual", code: "CA", department_id: department.id });
    const category = readTaxonomy(db).categories.find((entry) => entry.name === "Casual");
    executeTaxonomyCommand(db, { action: "save_subcategory", name: "Lofer", category_id: category.id, code_prefix: "CAL" });
    const subcategory = readTaxonomy(db).subcategories.find((entry) => entry.category_id === category.id);
    executeInventoryCommand(db, { action: "create_item", name: "Moccasin", category: category.id, subcategory: subcategory.id, low_stock_threshold: 5, cost_price: 1200 });
    const item = readInventory(db).items[0];
    assert.equal(item.sku, "CAL00001"); assert.equal(item.sale_price, 1200);
    assert.equal(item.department_slug, "men");
    const publicCategory = dynamicCatalog(db).categories.find((entry) => entry.id === "casual");
    assert.equal(publicCategory.departmentId, "men"); assert.ok(publicCategory.href.includes("department=men"));
    executeTaxonomyCommand(db, { action: "save_department", id: department.id, name: "Menswear" });
    assert.equal(readInventory(db).items[0].department_slug, "men");
    assert.throws(() => executeTaxonomyCommand(db, { action: "delete", entity: "subcategory", id: subcategory.id }), /used by item/);
    assert.throws(() => executeTaxonomyCommand(db, { action: "delete", entity: "department", id: department.id }), /Unassign/);
  } finally { db.close(); }
});
test("automatic codes skip manual codes and failed creation does not consume a sequence", () => {
  const db = openInventoryDatabase(":memory:");
  try {
    const taxonomy = readTaxonomy(db), category = taxonomy.categories.find((entry) => entry.name === "Formal Shoes"), subcategory = taxonomy.subcategories.find((entry) => entry.category_id === category.id && entry.name === "Oxford");
    const fields = { action: "create_item", name: "Oxford", category: category.id, subcategory: subcategory.id, low_stock_threshold: 5 };
    executeInventoryCommand(db, { ...fields, sku: `${subcategory.code_prefix}00001` });
    const duplicate = [{ color: "Red", size: "42", model: "" }, { color: "red", size: "42", model: "" }];
    assert.throws(() => executeInventoryCommand(db, { ...fields, variants: duplicate }), /combination/);
    executeInventoryCommand(db, fields);
    assert.deepEqual(readInventory(db).items.map((item) => item.sku).sort(), [`${subcategory.code_prefix}00001`, `${subcategory.code_prefix}00002`]);
  } finally { db.close(); }
});
test("attribute generation creates every color/size/model combination with child barcodes and editable rates", () => {
  const db = openInventoryDatabase(":memory:");
  try {
    const drafts = generateVariantDrafts("Moccasin", { Color: ["Red", "Green"], Size: ["38", "39", "40", "44"], Model: ["Classic", "Premium"] }, 1200, 2000);
    assert.equal(drafts.length, 16); assert.equal(drafts[0].name, "Moccasin-Red-Classic-38");
    drafts[1].sale_price = 2200;
    executeInventoryCommand(db, { action: "create_item", name: "Moccasin", sku: "CAL00001", category: "Casual Shoes", subcategory: "Moccasin", cost_price: 1200, sale_price: 2000, low_stock_threshold: 5, attributes: ["Color", "Size", "Model"], variants: drafts });
    const state = readInventory(db);
    assert.equal(state.variants.length, 16); assert.equal(new Set(state.variants.map((variant) => variant.barcode)).size, 16);
    assert.ok(state.variants.every((variant) => variant.barcode.startsWith("CAL00001-") && variant.quantity === 0));
    assert.equal(state.variants.find((variant) => variant.name === drafts[1].name).sale_price, 2200);
    assert.throws(() => generateVariantDrafts("Huge", { Color: Array.from({ length: 501 }, (_, i) => String(i)) }, 0, 0), /at most 500/);
  } finally { db.close(); }
});
test("catalog selection and timed offers apply to child prices without exposing costs", () => {
  const { db, item } = setup(":memory:", { sale_price: 2500 });
  try {
    executeInventoryCommand(db, { action: "set_listing", id: item.id, is_published: true, is_featured: true, offer_percent: 20, offer_start: null, offer_end: null });
    let state = readInventory(db), product = inventoryProducts(state.items, state.variants)[0];
    assert.equal(product.price, 2000); assert.equal(product.original_price, 2500); assert.equal(product.variants[0].price, 2000); assert.equal(product.is_featured, true);
    const command = checkout(item); command.items[0].expected_price = 2000;
    assert.equal(placeInventoryCheckout(db, command, 8000)[0].total_price, 4080);
    executeInventoryCommand(db, { action: "set_listing", id: item.id, is_published: false, is_featured: true, offer_percent: 0, offer_start: null, offer_end: null });
    state = readInventory(db); assert.equal(inventoryProducts(state.items, state.variants).length, 0);
    assert.equal(effectivePrice(100, { offer_percent: 20, offer_start: "2030-01-01T00:00:00Z", offer_end: null }, new Date("2026-01-01")), 100);
    assert.throws(() => executeInventoryCommand(db, { action: "set_listing", id: item.id, is_published: false, is_featured: false, offer_percent: 20, offer_start: "2030-02-01T00:00:00Z", offer_end: "2030-01-01T00:00:00Z" }), /after/);
  } finally { db.close(); }
});
test("negative stock requires item permission and cancellation can restore a negative balance", () => {
  const { db, item, variant } = setup(":memory:", { cost_price: 1200, sale_price: 2000, is_published: true, allow_negative_stock: true });
  try {
    const command = checkout(item); command.items[0].quantity = 8;
    const order = placeInventoryCheckout(db, command, 8000)[0]; assert.equal(readInventory(db).variants[0].quantity, -2);
    assert.throws(() => executeInventoryCommand(db, { action: "update_item", ...item, allow_negative_stock: false }), /reconcile negative/);
    executeInventoryCommand(db, stock(variant, { quantity: 2, expected_quantity: -2 }));
    assert.equal(readInventory(db).variants[0].quantity, -4);
    updateInventoryOrderStatus(db, order.id, "cancelled"); assert.equal(readInventory(db).variants[0].quantity, 4);
    executeInventoryCommand(db, { action: "update_item", ...item, allow_negative_stock: false });
    assert.throws(() => placeInventoryCheckout(db, { ...command, request_id: randomUUID() }, 8000), /Only 4 units/);
  } finally { db.close(); }
});
test("model selections are distinct stock identities and checkout uses the selected child's price", () => {
  const db = openInventoryDatabase(":memory:");
  try {
    const drafts = generateVariantDrafts("Oxford", { Color: ["Black"], Size: ["42"], Model: ["Classic", "Premium"] }, 1000, 2000);
    drafts[1].sale_price = 3000;
    executeInventoryCommand(db, { action: "create_item", name: "Oxford", sku: "MOD-001", category: "Formal Shoes", subcategory: "Oxford", low_stock_threshold: 5, cost_price: 1000, sale_price: 2000, is_published: true, attributes: ["Color", "Size", "Model"], variants: drafts });
    let state = readInventory(db); const item = state.items[0], premium = state.variants.find((variant) => variant.model === "Premium"), classic = state.variants.find((variant) => variant.model === "Classic");
    executeInventoryCommand(db, stock(premium, { kind: "receive", quantity: 3, expected_quantity: 0 }));
    const command = checkout(item); command.items = [{ product_id: item.id, variant_id: premium.id, color: "Black", size: "42", model: "Premium", quantity: 2, expected_price: 3000 }];
    const order = placeInventoryCheckout(db, command, 8000)[0];
    assert.equal(order.total_price, 6080); assert.equal(order.model, "Premium"); assert.equal(order.barcode, premium.barcode);
    state = readInventory(db); assert.equal(state.variants.find((variant) => variant.id === classic.id).quantity, 0); assert.equal(state.variants.find((variant) => variant.id === premium.id).quantity, 1);
  } finally { db.close(); }
});
test("uploaded images are compressed, resized and restricted to 1 MB and supported formats", async () => {
  const original = await sharp({ create: { width: 2000, height: 1800, channels: 3, background: "red" } }).png().toBuffer();
  const compressed = await compressItemImage(original), metadata = await sharp(compressed).metadata();
  assert.equal(metadata.format, "webp"); assert.equal(metadata.width, 1600); assert.ok(compressed.length <= MAX_IMAGE_BYTES);
  await assert.rejects(() => compressItemImage(new Uint8Array(MAX_IMAGE_BYTES + 1)), /1 MB/);
  await assert.rejects(() => compressItemImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>')), /still JPG/);
  await assert.rejects(() => compressItemImage(Buffer.from("not an image")), /valid supported/);
  const avif = await sharp({ create: { width: 20, height: 20, channels: 3, background: "red" } }).avif().toBuffer();
  assert.equal((await sharp(await compressItemImage(avif)).metadata()).format, "webp");
});

test("migration retains existing stock, order and movement foreign keys", () => {
  const filename = join(directory, "legacy-stock.sqlite"), legacy = new DatabaseSync(filename);
  legacy.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE inventory_items(id TEXT PRIMARY KEY,name TEXT NOT NULL,sku TEXT NOT NULL UNIQUE COLLATE NOCASE,category TEXT NOT NULL,subcategory TEXT NOT NULL,low_stock_threshold INTEGER NOT NULL,created_at TEXT NOT NULL,cost_cents INTEGER NOT NULL,sale_price_cents INTEGER NOT NULL,description TEXT NOT NULL,images_json TEXT NOT NULL,is_published INTEGER NOT NULL);
    CREATE TABLE inventory_variants(id TEXT PRIMARY KEY,item_id TEXT NOT NULL REFERENCES inventory_items(id),color TEXT NOT NULL COLLATE NOCASE,size TEXT NOT NULL COLLATE NOCASE,quantity INTEGER NOT NULL CHECK(quantity>=0),UNIQUE(item_id,color,size));
    CREATE TABLE inventory_movements(id TEXT PRIMARY KEY,variant_id TEXT NOT NULL REFERENCES inventory_variants(id),kind TEXT NOT NULL,delta INTEGER NOT NULL,before_quantity INTEGER NOT NULL,after_quantity INTEGER NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL,request_id TEXT UNIQUE);
    CREATE TABLE inventory_checkouts(request_id TEXT PRIMARY KEY,request_json TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE inventory_orders(id TEXT PRIMARY KEY,checkout_id TEXT NOT NULL REFERENCES inventory_checkouts(request_id),variant_id TEXT NOT NULL REFERENCES inventory_variants(id),customer_name TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,city TEXT NOT NULL,product_id TEXT NOT NULL,product_name TEXT NOT NULL,size TEXT NOT NULL,color TEXT NOT NULL,quantity INTEGER NOT NULL,total_price REAL NOT NULL,unit_cost_cents INTEGER NOT NULL,unit_price_cents INTEGER NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL,created_at TEXT NOT NULL);
  `);
  const itemId = randomUUID(), variantId = randomUUID(), orderId = randomUUID(), checkoutId = randomUUID(), now = new Date().toISOString();
  legacy.prepare("INSERT INTO inventory_items VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run(itemId, "Existing Oxford", "OLD-001", "Formal Shoes", "Oxford", 5, now, 100000, 200000, "", "[]", 1);
  legacy.prepare("INSERT INTO inventory_variants VALUES(?,?,?,?,?)").run(variantId, itemId, "Black", "42", 9);
  legacy.prepare("INSERT INTO inventory_movements VALUES(?,?,?,?,?,?,?,?,?)").run(randomUUID(), variantId, "opening", 10, 0, 10, "Opening stock", now, null);
  legacy.prepare("INSERT INTO inventory_checkouts VALUES(?,?,?)").run(checkoutId, "{}", now);
  legacy.prepare("INSERT INTO inventory_orders VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(orderId, checkoutId, variantId, "Test", "01700000000", "Address", "Dhaka", itemId, "Existing Oxford", "42", "Black", 1, 2080, 100000, 200000, "pending", "", now);
  legacy.close(); const db = openInventoryDatabase(filename);
  try {
    const state = readInventory(db); assert.equal(state.items[0].id, itemId); assert.equal(state.variants[0].id, variantId); assert.equal(state.variants[0].quantity, 9); assert.equal(state.variants[0].barcode, "OLD-001-001");
    assert.equal(readInventoryOrders(db)[0].id, orderId); assert.equal(state.movements[0].variant_id, variantId); assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    updateInventoryOrderStatus(db, orderId, "cancelled"); assert.equal(readInventory(db).variants[0].quantity, 10);
  } finally { db.close(); }
});

test("profile edits cannot hide dimensions needed to select saved variants", () => {
  const { db, item } = setup(":memory:", { sale_price: 2500 });
  try {
    executeInventoryCommand(db, { action: "update_item", ...item, attributes: [], is_published: true });
    const state = readInventory(db);
    assert.deepEqual(state.items[0].attributes, ["Color", "Size"]);
    assert.deepEqual(inventoryProducts(state.items, state.variants)[0].attributes, ["Color", "Size"]);
  } finally { db.close(); }
});
