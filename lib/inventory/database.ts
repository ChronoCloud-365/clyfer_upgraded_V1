import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { inventoryCommandSchema, validateCategory, stockAfter } from "./model";
import type { InventoryItem, InventorySnapshot, InventoryVariant } from "./model";

export class InventoryError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function initializeDatabase(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT NOT NULL UNIQUE COLLATE NOCASE,
      category TEXT NOT NULL, subcategory TEXT NOT NULL,
      low_stock_threshold INTEGER NOT NULL CHECK(low_stock_threshold BETWEEN 0 AND 1000000),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory_variants (
      id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES inventory_items(id),
      color TEXT NOT NULL COLLATE NOCASE, size TEXT NOT NULL COLLATE NOCASE,
      quantity INTEGER NOT NULL CHECK(quantity BETWEEN 0 AND 1000000),
      UNIQUE(item_id, color, size)
    );
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY, variant_id TEXT NOT NULL REFERENCES inventory_variants(id),
      kind TEXT NOT NULL CHECK(kind IN ('opening','receive','issue','count')),
      delta INTEGER NOT NULL, before_quantity INTEGER NOT NULL, after_quantity INTEGER NOT NULL,
      reason TEXT NOT NULL, created_at TEXT NOT NULL, request_id TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS inventory_movements_variant ON inventory_movements(variant_id);
    CREATE TABLE IF NOT EXISTS inventory_checkouts (
      request_id TEXT PRIMARY KEY, request_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory_orders (
      id TEXT PRIMARY KEY, checkout_id TEXT NOT NULL REFERENCES inventory_checkouts(request_id),
      variant_id TEXT NOT NULL REFERENCES inventory_variants(id),
      customer_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL,
      product_id TEXT NOT NULL, product_name TEXT NOT NULL, size TEXT NOT NULL, color TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0), total_price REAL NOT NULL,
      unit_cost_cents INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending','confirmed','shipped','delivered','cancelled')),
      notes TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
  db.exec("BEGIN IMMEDIATE");
  try {
    const columns = db.prepare("PRAGMA table_info(inventory_items)").all().map((column) => column.name);
    for (const [name, definition] of [
      ["cost_cents", "INTEGER NOT NULL DEFAULT 0 CHECK(cost_cents >= 0)"],
      ["sale_price_cents", "INTEGER NOT NULL DEFAULT 0 CHECK(sale_price_cents >= 0)"],
      ["description", "TEXT NOT NULL DEFAULT ''"],
      ["images_json", "TEXT NOT NULL DEFAULT '[]'"],
      ["is_published", "INTEGER NOT NULL DEFAULT 0 CHECK(is_published IN (0,1))"],
    ]) {
      if (!columns.includes(name)) db.exec(`ALTER TABLE inventory_items ADD COLUMN ${name} ${definition}`);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function openInventoryDatabase(filename: string) {
  if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  initializeDatabase(db);
  return db;
}

const inventoryGlobal = globalThis as typeof globalThis & { inventoryDatabase?: DatabaseSync; inventorySchemaVersion?: number };
export function getInventoryDatabase() {
  inventoryGlobal.inventoryDatabase ??= openInventoryDatabase(
    resolve(/* turbopackIgnore: true */ process.env.INVENTORY_DB_PATH || ".data/inventory.sqlite")
  );
  if (inventoryGlobal.inventorySchemaVersion !== 2) {
    initializeDatabase(inventoryGlobal.inventoryDatabase);
    inventoryGlobal.inventorySchemaVersion = 2;
  }
  return inventoryGlobal.inventoryDatabase;
}

export function readInventoryItems(db: DatabaseSync): InventoryItem[] {
  return db.prepare("SELECT * FROM inventory_items ORDER BY name COLLATE NOCASE").all().map((row) => ({
    id: row.id, name: row.name, sku: row.sku, category: row.category, subcategory: row.subcategory,
    low_stock_threshold: row.low_stock_threshold, created_at: row.created_at,
    cost_price: Number(row.cost_cents) / 100, sale_price: Number(row.sale_price_cents) / 100,
    description: row.description, images: JSON.parse(String(row.images_json)), is_published: Boolean(row.is_published),
  })) as InventoryItem[];
}

export function readInventory(db: DatabaseSync): InventorySnapshot {
  return {
    items: readInventoryItems(db),
    variants: db.prepare("SELECT * FROM inventory_variants ORDER BY color COLLATE NOCASE, size COLLATE NOCASE").all(),
    movements: db.prepare(`SELECT m.*, i.name AS item_name, i.sku, v.color, v.size
      FROM inventory_movements m JOIN inventory_variants v ON v.id=m.variant_id
      JOIN inventory_items i ON i.id=v.item_id ORDER BY m.created_at DESC, m.rowid DESC LIMIT 200`).all(),
  } as unknown as InventorySnapshot;
}

export function executeInventoryCommand(db: DatabaseSync, input: unknown) {
  const parsed = inventoryCommandSchema.safeParse(input);
  if (!parsed.success) throw new InventoryError(parsed.error.issues.map((issue) => issue.message).join(" "));
  const command = parsed.data;
  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    if (command.action === "create_item" || command.action === "update_item") {
      validateCategory(command.category, command.subcategory);
      if (command.is_published && command.sale_price <= 0) throw new InventoryError("Set a selling price before publishing this item.");
      if (command.action === "create_item") {
        db.prepare(`INSERT INTO inventory_items
          (id,name,sku,category,subcategory,low_stock_threshold,created_at,cost_cents,sale_price_cents,description,images_json,is_published)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          randomUUID(), command.name, command.sku, command.category, command.subcategory, command.low_stock_threshold, now,
          Math.round(command.cost_price * 100), Math.round(command.sale_price * 100), command.description, JSON.stringify(command.images), Number(command.is_published));
      } else {
        const result = db.prepare(`UPDATE inventory_items SET name=?, sku=?, category=?, subcategory=?,
          low_stock_threshold=?,cost_cents=?,sale_price_cents=?,description=?,images_json=?,is_published=? WHERE id=?`).run(command.name, command.sku, command.category,
          command.subcategory, command.low_stock_threshold, Math.round(command.cost_price * 100), Math.round(command.sale_price * 100),
          command.description, JSON.stringify(command.images), Number(command.is_published), command.id);
        if (!result.changes) throw new InventoryError("Item no longer exists.", 404);
      }
    } else if (command.action === "add_variant") {
      if (!db.prepare("SELECT id FROM inventory_items WHERE id=?").get(command.item_id)) {
        throw new InventoryError("Item no longer exists.", 404);
      }
      const id = randomUUID();
      db.prepare("INSERT INTO inventory_variants VALUES (?, ?, ?, ?, ?)").run(
        id, command.item_id, command.color, command.size, command.quantity);
      db.prepare("INSERT INTO inventory_movements VALUES (?, ?, 'opening', ?, 0, ?, ?, ?, NULL)").run(
        randomUUID(), id, command.quantity, command.quantity, "Opening stock", now);
    } else {
      const previous = db.prepare("SELECT * FROM inventory_movements WHERE request_id=?").get(command.request_id);
      if (previous) {
        const matches = previous.variant_id === command.variant_id && previous.kind === command.kind
          && previous.reason === command.reason
          && (command.kind !== "count" || previous.before_quantity === command.expected_quantity)
          && (command.kind === "count" ? previous.after_quantity === command.quantity
            : Math.abs(Number(previous.delta)) === command.quantity);
        if (!matches) throw new InventoryError("This request ID was already used for another movement.", 409);
      } else {
        const variant = db.prepare("SELECT * FROM inventory_variants WHERE id=?").get(command.variant_id) as unknown as InventoryVariant | undefined;
        if (!variant) throw new InventoryError("Variant no longer exists.", 404);
        if (command.kind === "count" && variant.quantity !== command.expected_quantity) {
          throw new InventoryError("Stock changed since you opened this form. Refresh and recount.", 409);
        }
        const after = stockAfter(variant.quantity, command.kind, command.quantity);
        db.prepare("UPDATE inventory_variants SET quantity=? WHERE id=?").run(after, variant.id);
        db.prepare("INSERT INTO inventory_movements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          randomUUID(), variant.id, command.kind, after - variant.quantity, variant.quantity, after,
          command.reason, now, command.request_id);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    if (error instanceof InventoryError) throw error;
    const message = error instanceof Error ? error.message : "Inventory update failed.";
    if (message.includes("UNIQUE constraint failed: inventory_items")) throw new InventoryError("An item with this SKU already exists.", 409);
    if (message.includes("UNIQUE constraint failed: inventory_variants")) throw new InventoryError("This color and size already exists for the item.", 409);
    throw new InventoryError(message);
  }
}
