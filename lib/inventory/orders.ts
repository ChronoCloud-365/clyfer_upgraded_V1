import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Order, OrderStatus } from "../../types";
import { inventoryCheckoutSchema, stockAfter, effectivePrice } from "./model";
import { InventoryError } from "./database";

export function readInventoryOrders(db: DatabaseSync): Order[] {
  return db.prepare(`SELECT id,customer_name,phone,address,city,product_id,product_name,size,color,
    quantity,total_price,status,notes,created_at,model,barcode FROM inventory_orders ORDER BY created_at DESC`).all() as unknown as Order[];
}

export function placeInventoryCheckout(db: DatabaseSync, input: unknown, shippingCents: number): Order[] {
  const parsed = inventoryCheckoutSchema.safeParse(input);
  if (!parsed.success) throw new InventoryError("Check your contact details, selected variants and quantities.");
  if (!Number.isSafeInteger(shippingCents) || shippingCents < 0) throw new InventoryError("Delivery pricing is unavailable.", 503);
  const command = parsed.data;
  const requestJson = JSON.stringify(command);
  db.exec("BEGIN IMMEDIATE");
  try {
    const previous = db.prepare("SELECT request_json FROM inventory_checkouts WHERE request_id=?").get(command.request_id);
    if (previous) {
      if (previous.request_json !== requestJson) throw new InventoryError("This checkout reference was already used. Refresh before ordering again.", 409);
    } else {
      const now = new Date().toISOString();
      db.prepare("INSERT INTO inventory_checkouts VALUES (?, ?, ?)").run(command.request_id, requestJson, now);
      const seen = new Set<string>();
      command.items.forEach((line, index) => {
        const selection = line.variant_id ? "v.id=?" : "v.color=? AND v.size=? AND v.model=?";
        const row = db.prepare(`SELECT v.id AS variant_id,v.quantity,i.id AS item_id,v.name,v.barcode,v.cost_cents,
          v.sale_price_cents,i.is_published,i.allow_negative_stock,i.offer_percent,i.offer_start,i.offer_end,v.color,v.size,v.model FROM inventory_variants v
          JOIN inventory_items i ON i.id=v.item_id WHERE i.id=? AND ${selection}`).get(line.product_id, ...(line.variant_id ? [line.variant_id] : [line.color, line.size, line.model]));
        if (!row || !row.is_published) throw new InventoryError("An item in your cart is no longer available.", 409);
        const variantId = String(row.variant_id);
        if (seen.has(variantId)) throw new InventoryError("Combine duplicate color and size selections before ordering.");
        seen.add(variantId);
        const priceCents = Math.round(effectivePrice(Number(row.sale_price_cents) / 100, { offer_percent: Number(row.offer_percent), offer_start: row.offer_start as string | null, offer_end: row.offer_end as string | null }) * 100);
        if (priceCents !== Math.round(line.expected_price * 100)) {
          throw new InventoryError(`The price of ${row.name} changed. Refresh its page and update your cart.`, 409);
        }
        const before = Number(row.quantity);
        if (!row.allow_negative_stock && before < line.quantity) throw new InventoryError(`Only ${before} units of ${row.name} (${row.color}, ${row.size}) are available.`, 409);
        const after = stockAfter(before, "issue", line.quantity, Boolean(row.allow_negative_stock));
        const orderId = randomUUID();
        const shippingShare = Math.floor(shippingCents / command.items.length) + (index < shippingCents % command.items.length ? 1 : 0);
        const total = (priceCents * line.quantity + shippingShare) / 100;
        db.prepare(`INSERT INTO inventory_orders
          (id,checkout_id,variant_id,customer_name,phone,address,city,product_id,product_name,size,color,
          quantity,total_price,unit_cost_cents,unit_price_cents,status,notes,created_at,model,barcode)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,?,?)`).run(
          orderId, command.request_id, variantId, command.customer_name, command.phone, command.address, command.city,
          String(row.item_id), String(row.name), String(row.size), String(row.color), line.quantity, total,
          Number(row.cost_cents), priceCents, command.notes, now, String(row.model), String(row.barcode));
        db.prepare("UPDATE inventory_variants SET quantity=? WHERE id=?").run(after, variantId);
        db.prepare("INSERT INTO inventory_movements VALUES (?,?,'issue',?,?,?,?,?,NULL)").run(
          randomUUID(), variantId, -line.quantity, before, after, `Order ${orderId}`, now);
      });
    }
    const orders = db.prepare(`SELECT id,customer_name,phone,address,city,product_id,product_name,size,color,
      quantity,total_price,status,notes,created_at,model,barcode FROM inventory_orders WHERE checkout_id=?`).all(command.request_id) as unknown as Order[];
    db.exec("COMMIT");
    return orders;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function updateInventoryOrderStatus(db: DatabaseSync, id: string, status: OrderStatus) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const order = db.prepare("SELECT * FROM inventory_orders WHERE id=?").get(id);
    if (!order) throw new InventoryError("Order not found.", 404);
    const current = order.status as OrderStatus;
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"], confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"], delivered: [], cancelled: [],
    };
    if (current !== status) {
      if (!transitions[current].includes(status)) throw new InventoryError(`Cannot change a ${current} order to ${status}.`, 409);
      if (status === "cancelled") {
        const variant = db.prepare("SELECT quantity FROM inventory_variants WHERE id=?").get(String(order.variant_id));
        if (!variant) throw new InventoryError("Order variant not found.", 404);
        const before = Number(variant.quantity);
        const item = db.prepare("SELECT allow_negative_stock FROM inventory_items WHERE id=?").get(String(order.product_id));
        const after = stockAfter(before, "receive", Number(order.quantity), Boolean(item?.allow_negative_stock));
        db.prepare("UPDATE inventory_variants SET quantity=? WHERE id=?").run(after, String(order.variant_id));
        db.prepare("INSERT INTO inventory_movements VALUES (?,?,'receive',?,?,?,?,?,NULL)").run(
          randomUUID(), String(order.variant_id), Number(order.quantity), before, after, `Cancelled order ${id}`, new Date().toISOString());
      }
      db.prepare("UPDATE inventory_orders SET status=? WHERE id=?").run(status, id);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
