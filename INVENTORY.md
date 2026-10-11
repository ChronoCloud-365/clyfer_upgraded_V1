# Inventory module

Open `/admin/inventory` after signing into the admin panel.

1. Create an item profile with a unique SKU, category, subcategory, unit purchase cost, selling price, description, photos and low-stock threshold.
2. Add each color and size combination and its opening quantity. Sizes are labels, so footwear numbers, belt sizes and `One Size` are supported.
3. Use **Update stock** to receive units, issue units for sales/damage, or record a physical count. A reason/reference is required.
4. Review stock and the latest 200 movements. Item totals are calculated from their variants.
5. Enable **Publish on website** to show the item in the shop. **View on website** opens its product page. Photos can be provided as HTTP/HTTPS URLs; an item without photos uses a placeholder.

The dashboard calculates **inventory cost = quantity × current profile purchase cost** and **selling value = quantity × current selling price**. Values are calculated in integer cents. Changing a profile's purchase cost recalculates the value of its remaining stock; every order preserves the unit cost and selling price at the time it was placed.

Published items display their selling price and availability for each color/size combination. The shop, product page and admin inventory refresh inventory every 10 seconds and when the browser window receives focus. Checkout always rechecks the current price and exact stock before accepting an order. Purchase cost is only exposed through the authenticated admin inventory API.

The seven agreed categories and their subcategories are in `lib/inventory/model.ts`. Selecting a category limits the available subcategories. Item identity is its SKU; stock identity is item + color + size. Names and SKU can be edited without losing movement history.

## Storage and deployment

This module uses Node's built-in SQLite database and requires Node **22.13 or later**. The current development environment uses Node 24. No additional database package is required.

The database is created automatically at `.data/inventory.sqlite`. It is excluded from Git. To move it, set `INVENTORY_DB_PATH` to an absolute file path in `.env.local` and restart the server. All quantities and movement records persist across server restarts.

Admin sessions now use signed cookies with a seven-day expiry. A random `ADMIN_SESSION_SECRET` is configured locally; configure a private secret on deployment as well. Existing fixed-value cookies are invalidated, so sign in again after updating.

Stock writes and audit records commit in one transaction. Negative stock, duplicate SKUs, duplicate variants and invalid category relationships are rejected. Physical counts use the balance seen when the form opened to detect conflicting updates. Stock requests carry unique request IDs so a retry cannot apply the same movement twice.

Checkout for inventory profiles writes orders, deducts every selected variant and records stock movements in one database transaction. If any cart line is unavailable, the entire checkout rolls back. A unique checkout reference prevents duplicate orders when the same request is retried. Delivery is calculated on the server and applied once across the cart.

Orders appear in `/admin/orders` and the customer tracking page. The order flow is pending → confirmed → shipped → delivered. Cancelling a pending or confirmed order restores its quantities exactly once. Shipped and delivered orders require a separate stock-return movement when goods actually return.

Existing Supabase product and order records remain supported. Inventory profiles and their orders currently use the local SQLite database; an ERP connection is still to be configured. If a cart contains both legacy Supabase products and inventory profiles, the customer must check out the two groups separately because they use different databases.

For local development or a single server, use a persistent writable disk and back up SQLite with its backup tooling. For a serverless or multi-instance deployment, connect the ERP database or migrate this storage layer to a shared database first; ephemeral hosting disks do not preserve this file.

Run backend checks with `npm run test:inventory`.
