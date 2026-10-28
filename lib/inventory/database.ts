import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ATTRIBUTE_NAMES, inventoryCommandSchema, stockAfter, variantName } from "./model";
import { readTaxonomy, resolveItemCategory } from "./taxonomy";
import { upgradeInventorySchema } from "./schema";
import { InventoryError } from "./errors";
export { InventoryError } from "./errors";
import type { InventoryItem, InventorySnapshot, InventoryVariant } from "./model";

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
  upgradeInventorySchema(db);
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
  if (inventoryGlobal.inventorySchemaVersion !== 3) {
    initializeDatabase(inventoryGlobal.inventoryDatabase);
    inventoryGlobal.inventorySchemaVersion = 3;
  }
  return inventoryGlobal.inventoryDatabase;
}

export function readInventoryItems(db: DatabaseSync): InventoryItem[] {
  return db.prepare(`SELECT i.*,c.name AS category_name,c.slug AS category_slug,c.department_id,
    s.name AS subcategory_name,s.slug AS subcategory_slug,d.slug AS department_slug
    FROM inventory_items i LEFT JOIN item_categories c ON c.id=i.category_id
    LEFT JOIN item_subcategories s ON s.id=i.subcategory_id LEFT JOIN item_departments d ON d.id=c.department_id
    ORDER BY i.name COLLATE NOCASE`).all().map((row) => ({
    id: row.id, name: row.name, sku: row.sku, category: row.category_name ?? row.category, subcategory: row.subcategory_name ?? row.subcategory,
    low_stock_threshold: row.low_stock_threshold, created_at: row.created_at,
    cost_price: Number(row.cost_cents) / 100, sale_price: Number(row.sale_price_cents) / 100,
    description: row.description, images: JSON.parse(String(row.images_json)), is_published: Boolean(row.is_published),
    category_id: row.category_id, subcategory_id: row.subcategory_id, category_slug: row.category_slug,
    subcategory_slug: row.subcategory_slug, department_id: row.department_id, department_slug: row.department_slug,
    allow_negative_stock: Boolean(row.allow_negative_stock), attributes: JSON.parse(String(row.attributes_json)),
    is_featured: Boolean(row.is_featured), offer_percent: Number(row.offer_percent), offer_start: row.offer_start, offer_end: row.offer_end,
  })) as InventoryItem[];
}

export function readInventory(db: DatabaseSync): InventorySnapshot {
  return {
    items: readInventoryItems(db),
    variants: readInventoryVariants(db),
    taxonomy: readTaxonomy(db),
    movements: db.prepare(`SELECT m.*, i.name AS item_name, i.sku, v.color, v.size,v.model,v.barcode
      FROM inventory_movements m JOIN inventory_variants v ON v.id=m.variant_id
      JOIN inventory_items i ON i.id=v.item_id ORDER BY m.created_at DESC, m.rowid DESC LIMIT 200`).all(),
  } as unknown as InventorySnapshot;
}

export function readInventoryVariants(db: DatabaseSync): InventoryVariant[] {
  return db.prepare("SELECT * FROM inventory_variants ORDER BY color COLLATE NOCASE,size COLLATE NOCASE,model COLLATE NOCASE").all().map((row) => ({
    id: row.id, item_id: row.item_id, color: row.color, size: row.size, model: row.model, quantity: row.quantity,
    name: row.name, barcode: row.barcode, cost_price: Number(row.cost_cents) / 100,
    sale_price: Number(row.sale_price_cents) / 100, low_stock_threshold: row.low_stock_threshold,
  })) as InventoryVariant[];
}

function nextItemCode(db: DatabaseSync, prefix: string) {
  db.prepare("INSERT OR IGNORE INTO item_code_sequences VALUES(?,1)").run(prefix);
  let number = Number(db.prepare("SELECT next_number FROM item_code_sequences WHERE prefix=?").get(prefix)!.next_number);
  let code: string;
  do {
    if (number > 99999) throw new InventoryError("This code prefix has used all five-digit item numbers.");
    code = `${prefix}${String(number++).padStart(5, "0")}`;
  } while (db.prepare("SELECT id FROM inventory_items WHERE sku=?").get(code) || db.prepare("SELECT id FROM inventory_variants WHERE barcode=?").get(code));
  db.prepare("UPDATE item_code_sequences SET next_number=? WHERE prefix=?").run(number, prefix);
  return code;
}

function syncVariantAttributes(db: DatabaseSync, id: string, selected?: string[]) {
  const item = db.prepare("SELECT attributes_json FROM inventory_items WHERE id=?").get(id)!;
  const attributes = new Set(selected ?? JSON.parse(String(item.attributes_json)) as string[]);
  for (const variant of db.prepare("SELECT color,size,model FROM inventory_variants WHERE item_id=?").all(id)) {
    if (variant.color !== "Default") attributes.add("Color");
    if (variant.size !== "One Size") attributes.add("Size");
    if (variant.model) attributes.add("Model");
  }
  db.prepare("UPDATE inventory_items SET attributes_json=? WHERE id=?").run(JSON.stringify(ATTRIBUTE_NAMES.filter((attribute) => attributes.has(attribute))), id);
}

function insertVariant(db: DatabaseSync, item: Record<string, unknown>, draft: { color: string; size: string; model?: string; name?: string; barcode?: string; cost_price?: number; sale_price?: number; low_stock_threshold?: number }, quantity: number, now: string) {
  const id = randomUUID();
  let number = Number(db.prepare("SELECT count(*) AS total FROM inventory_variants WHERE item_id=?").get(String(item.id))!.total) + 1;
  let barcode = draft.barcode?.trim();
  if (!barcode) {
    do { barcode = `${item.sku}-${String(number++).padStart(3, "0")}`; }
    while (db.prepare("SELECT id FROM inventory_variants WHERE barcode=?").get(barcode) || db.prepare("SELECT id FROM inventory_items WHERE sku=?").get(barcode));
  } else if (db.prepare("SELECT id FROM inventory_items WHERE sku=?").get(barcode)) throw new InventoryError("A child barcode cannot use an existing main item code.", 409);
  const color = draft.color || "Default", size = draft.size || "One Size", model = draft.model || "";
  db.prepare(`INSERT INTO inventory_variants(id,item_id,color,size,model,quantity,name,barcode,cost_cents,sale_price_cents,low_stock_threshold)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(id, String(item.id), color, size, model, quantity,
    draft.name?.trim() || variantName(String(item.name), { color, size, model }), barcode,
    draft.cost_price === undefined ? Number(item.cost_cents) : Math.round(draft.cost_price * 100),
    draft.sale_price === undefined ? Number(item.sale_price_cents) : Math.round(draft.sale_price * 100), draft.low_stock_threshold ?? Number(item.low_stock_threshold));
  for (const [attribute, value] of [["Color", color], ["Size", size], ["Model", model]]) {
    if (value && value !== "Default" && value !== "One Size") db.prepare("INSERT OR IGNORE INTO item_attribute_values VALUES(?,?)").run(attribute, value);
  }
  db.prepare("INSERT INTO inventory_movements VALUES(?,?,'opening',?,0,?,?,?,NULL)").run(randomUUID(), id, quantity, quantity, "Opening stock", now);
}

export function executeInventoryCommand(db: DatabaseSync, input: unknown) {
  const parsed = inventoryCommandSchema.safeParse(input);
  if (!parsed.success) throw new InventoryError(parsed.error.issues.map((issue) => issue.message).join(" "));
  const command = parsed.data;
  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    if (command.action === "create_item" || command.action === "update_item") {
      const taxonomy = resolveItemCategory(db, command.category, command.subcategory);
      const salePrice = command.sale_price ?? command.cost_price;
      if (command.is_published && salePrice <= 0) throw new InventoryError("Set a selling price before publishing this item.");
      let itemId: string;
      if (command.action === "create_item") {
        itemId = randomUUID();
        const sku = command.sku || nextItemCode(db, String(taxonomy.subcategory.code_prefix));
        if (db.prepare("SELECT id FROM inventory_variants WHERE barcode=?").get(sku)) throw new InventoryError("This code is already a child barcode.", 409);
        db.prepare(`INSERT INTO inventory_items
          (id,name,sku,category,subcategory,low_stock_threshold,created_at,cost_cents,sale_price_cents,description,images_json,is_published,category_id,subcategory_id,allow_negative_stock,attributes_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          itemId, command.name, sku, String(taxonomy.category.name), String(taxonomy.subcategory.name), command.low_stock_threshold, now,
          Math.round(command.cost_price * 100), Math.round(salePrice * 100), command.description, JSON.stringify(command.images), Number(command.is_published),
          String(taxonomy.category.id), String(taxonomy.subcategory.id), Number(command.allow_negative_stock), JSON.stringify(command.attributes));
      } else {
        itemId = command.id;
        const current = db.prepare("SELECT * FROM inventory_items WHERE id=?").get(itemId);
        if (!current) throw new InventoryError("Item no longer exists.", 404);
        const sku = command.sku || String(current.sku);
        if (sku !== current.sku && db.prepare("SELECT id FROM inventory_variants WHERE barcode=?").get(sku)) throw new InventoryError("This code is already a child barcode.", 409);
        if (sku !== current.sku && db.prepare("SELECT id FROM inventory_variants WHERE item_id=? LIMIT 1").get(itemId)) throw new InventoryError("The main item code cannot change after child barcodes have been generated.", 409);
        if (!command.allow_negative_stock && db.prepare("SELECT id FROM inventory_variants WHERE item_id=? AND quantity<0 LIMIT 1").get(itemId)) throw new InventoryError("Receive or reconcile negative quantities before disabling negative sales.", 409);
        const result = db.prepare(`UPDATE inventory_items SET name=?, sku=?, category=?, subcategory=?,
          low_stock_threshold=?,cost_cents=?,sale_price_cents=?,description=?,images_json=?,is_published=?,category_id=?,subcategory_id=?,allow_negative_stock=?,attributes_json=? WHERE id=?`).run(command.name, sku, String(taxonomy.category.name),
          String(taxonomy.subcategory.name), command.low_stock_threshold, Math.round(command.cost_price * 100), Math.round(salePrice * 100),
          command.description, JSON.stringify(command.images), Number(command.is_published), String(taxonomy.category.id), String(taxonomy.subcategory.id), Number(command.allow_negative_stock), JSON.stringify(command.attributes), itemId);
        if (!result.changes) throw new InventoryError("Item no longer exists.", 404);
      }
      const item = db.prepare("SELECT * FROM inventory_items WHERE id=?").get(itemId)!;
      if (command.variants) {
        const ids = command.variants.map((draft) => draft.id).filter(Boolean);
        if (new Set(ids).size !== ids.length) throw new InventoryError("Each existing child item must appear only once.");
        if (command.is_published && command.variants.some((draft) => (draft.sale_price ?? salePrice) <= 0)) throw new InventoryError("Published variants need a selling price.");
        for (const draft of command.variants) {
          if (!draft.id) insertVariant(db, item, draft, 0, now);
          else {
            const old = db.prepare("SELECT * FROM inventory_variants WHERE id=? AND item_id=?").get(draft.id, itemId);
            if (!old) throw new InventoryError("Variant no longer belongs to this item.");
            if (String(old.color).toLowerCase() !== (draft.color || "Default").toLowerCase() || String(old.size).toLowerCase() !== (draft.size || "One Size").toLowerCase() || String(old.model).toLowerCase() !== draft.model.toLowerCase()) throw new InventoryError("Existing variant attributes cannot be changed. Create a new variant instead.");
            const barcode = draft.barcode?.trim() || String(old.barcode);
            if (db.prepare("SELECT id FROM inventory_items WHERE sku=?").get(barcode)) throw new InventoryError("A child barcode cannot use a main item code.", 409);
            db.prepare("UPDATE inventory_variants SET name=?,barcode=?,cost_cents=?,sale_price_cents=?,low_stock_threshold=? WHERE id=?").run(
              draft.name?.trim() || variantName(command.name, draft), barcode,
              Math.round((draft.cost_price ?? command.cost_price) * 100), Math.round((draft.sale_price ?? salePrice) * 100), draft.low_stock_threshold ?? command.low_stock_threshold, draft.id);
          }
        }
        if (Number(db.prepare("SELECT count(*) AS total FROM inventory_variants WHERE item_id=?").get(itemId)!.total) > 500) throw new InventoryError("An item can have at most 500 variants.");
      }
      syncVariantAttributes(db, itemId, command.attributes);
    } else if (command.action === "set_listing") {
      const item = db.prepare("SELECT * FROM inventory_items WHERE id=?").get(command.id);
      if (!item) throw new InventoryError("Item not found.", 404);
      if (command.is_published && (Number(item.sale_price_cents) <= 0 || db.prepare("SELECT id FROM inventory_variants WHERE item_id=? AND sale_price_cents<=0 LIMIT 1").get(command.id))) throw new InventoryError("Set selling prices before publishing this item.");
      db.prepare("UPDATE inventory_items SET is_published=?,is_featured=?,offer_percent=?,offer_start=?,offer_end=? WHERE id=?").run(Number(command.is_published), Number(command.is_featured), command.offer_percent, command.offer_start, command.offer_end, command.id);
    } else if (command.action === "add_variant") {
      const item = db.prepare("SELECT * FROM inventory_items WHERE id=?").get(command.item_id);
      if (!item) {
        throw new InventoryError("Item no longer exists.", 404);
      }
      insertVariant(db, item, command, command.quantity, now);
      syncVariantAttributes(db, command.item_id);
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
        const item = db.prepare("SELECT allow_negative_stock FROM inventory_items WHERE id=?").get(variant.item_id)!;
        const after = stockAfter(variant.quantity, command.kind, command.quantity, Boolean(item.allow_negative_stock));
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
    if (message.includes("UNIQUE constraint failed: inventory_variants.barcode")) throw new InventoryError("This child barcode already exists.", 409);
    if (message.includes("UNIQUE constraint failed: inventory_variants")) throw new InventoryError("This color and size / model combination already exists for the item.", 409);
    throw new InventoryError(message);
  }
}
