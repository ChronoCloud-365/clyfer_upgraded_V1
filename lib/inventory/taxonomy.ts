import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { categoryId, taxonomyCommandSchema } from "./model";
import type { TaxonomySnapshot } from "./model";
import { InventoryError } from "./errors";

export function readTaxonomy(db: DatabaseSync): TaxonomySnapshot {
  return {
    departments: db.prepare("SELECT * FROM item_departments ORDER BY name COLLATE NOCASE").all(),
    categories: db.prepare("SELECT * FROM item_categories ORDER BY name COLLATE NOCASE").all(),
    subcategories: db.prepare("SELECT * FROM item_subcategories ORDER BY name COLLATE NOCASE").all(),
  } as unknown as TaxonomySnapshot;
}

export function resolveItemCategory(db: DatabaseSync, category: string, subcategory: string) {
  const parent = db.prepare("SELECT * FROM item_categories WHERE id=?").get(category) ?? db.prepare("SELECT * FROM item_categories WHERE name=? COLLATE NOCASE").get(category);
  const child = parent && (db.prepare("SELECT * FROM item_subcategories WHERE category_id=? AND id=?").get(String(parent.id), subcategory) ?? db.prepare("SELECT * FROM item_subcategories WHERE category_id=? AND name=? COLLATE NOCASE").get(String(parent.id), subcategory));
  if (!parent || !child) throw new InventoryError("Create and select a category and its subcategory first.");
  return { category: parent, subcategory: child };
}

export function executeTaxonomyCommand(db: DatabaseSync, input: unknown) {
  const parsed = taxonomyCommandSchema.safeParse(input);
  if (!parsed.success) throw new InventoryError("Check the name, department, category and code prefix.");
  const command = parsed.data;
  db.exec("BEGIN IMMEDIATE");
  try {
    if (command.action === "delete") {
      const tables = { department: "item_departments", category: "item_categories", subcategory: "item_subcategories" };
      if (command.entity === "department" && db.prepare("SELECT id FROM item_categories WHERE department_id=? LIMIT 1").get(command.id)) throw new InventoryError("Unassign this department's categories before deleting it.", 409);
      if (command.entity === "category" && (db.prepare("SELECT id FROM item_subcategories WHERE category_id=? LIMIT 1").get(command.id) || db.prepare("SELECT id FROM inventory_items WHERE category_id=? LIMIT 1").get(command.id))) throw new InventoryError("Remove or move this category's subcategories and items first.", 409);
      if (command.entity === "subcategory" && db.prepare("SELECT id FROM inventory_items WHERE subcategory_id=? LIMIT 1").get(command.id)) throw new InventoryError("This subcategory is used by item profiles.", 409);
      if (!db.prepare(`DELETE FROM ${tables[command.entity]} WHERE id=?`).run(command.id).changes) throw new InventoryError("Record not found.", 404);
    } else {
      const id = command.id ?? randomUUID();
      const slug = categoryId(command.name) || `group-${id.slice(0, 8)}`;
      if (command.action === "save_department") {
        if (command.id) {
          if (!db.prepare("UPDATE item_departments SET name=? WHERE id=?").run(command.name, id).changes) throw new InventoryError("Department not found.", 404);
        } else db.prepare("INSERT INTO item_departments VALUES(?,?,?)").run(id, command.name, slug);
      } else if (command.action === "save_category") {
        if (command.department_id && !db.prepare("SELECT id FROM item_departments WHERE id=?").get(command.department_id)) throw new InventoryError("Department not found.");
        if (command.id) {
          if (!db.prepare("UPDATE item_categories SET name=?,department_id=?,code=? WHERE id=?").run(command.name, command.department_id, command.code, id).changes) throw new InventoryError("Category not found.", 404);
          db.prepare("UPDATE inventory_items SET category=? WHERE category_id=?").run(command.name, id);
        } else db.prepare("INSERT INTO item_categories VALUES(?,?,?,?,?)").run(id, command.name, slug, command.department_id, command.code);
      } else {
        if (!db.prepare("SELECT id FROM item_categories WHERE id=?").get(command.category_id)) throw new InventoryError("Category not found.");
        if (command.id) {
          const current = db.prepare("SELECT * FROM item_subcategories WHERE id=?").get(id);
          if (!current) throw new InventoryError("Subcategory not found.", 404);
          if (current.category_id !== command.category_id && db.prepare("SELECT id FROM inventory_items WHERE subcategory_id=? LIMIT 1").get(id)) throw new InventoryError("A subcategory with items cannot be moved to another category.", 409);
          db.prepare("UPDATE item_subcategories SET name=?,category_id=?,code_prefix=? WHERE id=?").run(command.name, command.category_id, command.code_prefix, id);
          db.prepare("UPDATE inventory_items SET subcategory=? WHERE subcategory_id=?").run(command.name, id);
        } else db.prepare("INSERT INTO item_subcategories VALUES(?,?,?,?,?)").run(id, command.category_id, command.name, slug, command.code_prefix);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    if (error instanceof InventoryError) throw error;
    throw new InventoryError("This name, slug or code prefix is already used, or the record is still in use.", 409);
  }
}

export function dynamicCatalog(db: DatabaseSync) {
  const taxonomy = readTaxonomy(db);
  return {
    departments: taxonomy.departments,
    categories: taxonomy.categories.map((category) => ({
      id: category.slug, label: category.name, href: `/shop?category=${category.slug}${category.department_id ? `&department=${taxonomy.departments.find((department) => department.id === category.department_id)?.slug}` : ""}`,
      departmentId: taxonomy.departments.find((department) => department.id === category.department_id)?.slug ?? null,
      subcategories: taxonomy.subcategories.filter((subcategory) => subcategory.category_id === category.id).map((subcategory) => ({
        id: subcategory.slug, label: subcategory.name, href: `/shop?category=${category.slug}&subcategory=${subcategory.slug}${category.department_id ? `&department=${taxonomy.departments.find((department) => department.id === category.department_id)?.slug}` : ""}`, desc: "",
      })),
    })),
  };
}
