import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { INVENTORY_CATEGORIES, categoryId, variantName } from "./model";

export function upgradeInventorySchema(db: DatabaseSync) {
  db.exec("CREATE TABLE IF NOT EXISTS inventory_migrations(version INTEGER PRIMARY KEY)");
  if (db.prepare("SELECT version FROM inventory_migrations WHERE version=3").get()) return;
  db.exec("PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE");
  try {
    // Another process may have completed the migration while this connection waited.
    if (db.prepare("SELECT version FROM inventory_migrations WHERE version=3").get()) { db.exec("COMMIT"); return; }
    db.exec(`
      CREATE TABLE item_departments(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE COLLATE NOCASE,slug TEXT NOT NULL UNIQUE);
      CREATE TABLE item_categories(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE COLLATE NOCASE,slug TEXT NOT NULL UNIQUE,
        department_id TEXT REFERENCES item_departments(id),code TEXT NOT NULL);
      CREATE TABLE item_subcategories(id TEXT PRIMARY KEY,category_id TEXT NOT NULL REFERENCES item_categories(id),
        name TEXT NOT NULL COLLATE NOCASE,slug TEXT NOT NULL,code_prefix TEXT NOT NULL,
        UNIQUE(category_id,name),UNIQUE(category_id,slug));
      CREATE TABLE item_code_sequences(prefix TEXT PRIMARY KEY,next_number INTEGER NOT NULL);
      CREATE TABLE local_site_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE item_attribute_values(attribute TEXT NOT NULL,value TEXT NOT NULL COLLATE NOCASE,PRIMARY KEY(attribute,value));
      ALTER TABLE inventory_items ADD COLUMN category_id TEXT REFERENCES item_categories(id);
      ALTER TABLE inventory_items ADD COLUMN subcategory_id TEXT REFERENCES item_subcategories(id);
      ALTER TABLE inventory_items ADD COLUMN allow_negative_stock INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE inventory_items ADD COLUMN attributes_json TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE inventory_items ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE inventory_items ADD COLUMN offer_percent REAL NOT NULL DEFAULT 0;
      ALTER TABLE inventory_items ADD COLUMN offer_start TEXT;
      ALTER TABLE inventory_items ADD COLUMN offer_end TEXT;
      CREATE TABLE inventory_variants_v3(
        id TEXT PRIMARY KEY,item_id TEXT NOT NULL REFERENCES inventory_items(id),
        color TEXT NOT NULL COLLATE NOCASE,size TEXT NOT NULL COLLATE NOCASE,model TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
        quantity INTEGER NOT NULL CHECK(quantity BETWEEN -1000000 AND 1000000),
        name TEXT NOT NULL,barcode TEXT NOT NULL UNIQUE COLLATE NOCASE,
        cost_cents INTEGER NOT NULL CHECK(cost_cents>=0),sale_price_cents INTEGER NOT NULL CHECK(sale_price_cents>=0),
        low_stock_threshold INTEGER NOT NULL CHECK(low_stock_threshold>=0),UNIQUE(item_id,color,size,model)
      );
      ALTER TABLE inventory_orders ADD COLUMN model TEXT NOT NULL DEFAULT '';
      ALTER TABLE inventory_orders ADD COLUMN barcode TEXT NOT NULL DEFAULT '';
    `);
    for (const seed of INVENTORY_CATEGORIES) {
      const id = randomUUID();
      const code = seed.name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
      db.prepare("INSERT INTO item_categories VALUES(?,?,?,?,?)").run(id, seed.name, categoryId(seed.name), null, code);
      for (const name of seed.subcategories) db.prepare("INSERT INTO item_subcategories VALUES(?,?,?,?,?)").run(randomUUID(), id, name, categoryId(name), code + name[0].toUpperCase());
    }
    for (const item of db.prepare("SELECT * FROM inventory_items").all()) {
      let category = db.prepare("SELECT * FROM item_categories WHERE name=? COLLATE NOCASE").get(String(item.category));
      if (!category) {
        const id = randomUUID();
        db.prepare("INSERT INTO item_categories VALUES(?,?,?,?,?)").run(id, String(item.category), categoryId(String(item.category)) || id, null, "IT");
        category = db.prepare("SELECT * FROM item_categories WHERE id=?").get(id)!;
      }
      let subcategory = db.prepare("SELECT * FROM item_subcategories WHERE category_id=? AND name=? COLLATE NOCASE").get(String(category.id), String(item.subcategory));
      if (!subcategory) {
        const id = randomUUID();
        db.prepare("INSERT INTO item_subcategories VALUES(?,?,?,?,?)").run(id, String(category.id), String(item.subcategory), categoryId(String(item.subcategory)) || id, String(category.code) + "X");
        subcategory = db.prepare("SELECT * FROM item_subcategories WHERE id=?").get(id)!;
      }
      db.prepare("UPDATE inventory_items SET category_id=?,subcategory_id=?,attributes_json='[\"Color\",\"Size\"]' WHERE id=?").run(String(category.id), String(subcategory.id), String(item.id));
      const variants = db.prepare("SELECT * FROM inventory_variants WHERE item_id=? ORDER BY rowid").all(String(item.id));
      variants.forEach((variant, index) => {
        db.prepare("INSERT INTO inventory_variants_v3 VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(
          String(variant.id), String(item.id), String(variant.color), String(variant.size), "", Number(variant.quantity),
          variantName(String(item.name), { color: String(variant.color), size: String(variant.size) }),
          `${item.sku}-${String(index + 1).padStart(3, "0")}`, Number(item.cost_cents), Number(item.sale_price_cents), Number(item.low_stock_threshold));
      });
    }
    db.exec("DROP TABLE inventory_variants; ALTER TABLE inventory_variants_v3 RENAME TO inventory_variants;");
    for (const attribute of ["Color", "Size", "Model"]) {
      const key = attribute.toLowerCase();
      db.exec(`INSERT OR IGNORE INTO item_attribute_values SELECT '${attribute}',${key} FROM inventory_variants WHERE ${key} NOT IN ('','Default','One Size')`);
    }
    if (db.prepare("PRAGMA foreign_key_check").all().length) throw new Error("Inventory migration found broken references.");
    db.exec("INSERT INTO inventory_migrations VALUES(3); COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  finally { db.exec("PRAGMA foreign_keys=ON"); }
}
