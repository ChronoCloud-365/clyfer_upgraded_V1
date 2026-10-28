# Ecommerce administration

Sign in at `/admin/login`. The setup workflow is:

1. **Departments** (`/admin/departments`): optionally create departments.
2. **Categories** (`/admin/categories`): create categories and subcategories, assign departments, and configure item-code prefixes. The reference footwear/accessory categories are preloaded on migration.
3. **Item Profiles** (`/admin/items`): create the parent name, initial purchase cost, initial selling price, description and up to five images. Selling price initially copies purchase cost and can be changed.
4. **Generate variants**: choose any of Color, Size and Model, select/add values, and generate their combinations. With no attributes, the item gets a standard child. The maximum is 500 children per item. Preview rows can be removed before saving. Each row has a name, purchase/selling rate, child barcode and reorder level. Saved children retain their identity and stock history.
5. **Inventory** (`/admin/inventory`): receive, issue or physically count quantities for each child. A reason/reference is required. Item profiles and newly generated children start at zero stock.
6. **Catalog** (`/admin/catalog`): select profiles for the website, mark featured items and configure percentage offers with optional start/end dates. Only selected item profiles appear in the storefront.

## Codes and identities

The subcategory's configurable prefix plus five digits forms the automatic parent code, for example `CAL00001`. A sequence is shared by records using the same prefix, and existing manual codes are skipped. A manually entered parent code is also supported.

Default child barcodes use `parent-code-001`, `parent-code-002`, etc. Custom child barcodes are checked for uniqueness. Children are linked to the parent by its internal ID. The parent code cannot change after children have been saved. Classification names and assignments can be updated without changing existing codes. Category and department URL slugs stay stable when labels are renamed.

Stock identity is **item + color + size + model**. Variant names default to parent name + color + model + size. Child rates and reorder levels are copied from the profile when generated; use **Apply initial prices / reorder level to all** to update every row deliberately.

## Stock, values and checkout

Inventory cost is the sum of each child balance multiplied by its purchase rate. Selling value uses its selling rate. Balances can be negative when the parent profile explicitly permits negative sales; otherwise manual issues and checkout cannot oversell. Negative balances must be reconciled before disabling that permission. Values use integer cents and signed net stock balances.

Checkout rechecks the selected child and its current offer-adjusted price. Orders, every stock deduction and the audit movements commit in one transaction. Failed carts roll back completely. Unique checkout/request IDs prevent duplicate changes when requests are retried. Delivery is calculated on the server and charged once across the cart. Order lines preserve child identity, model, barcode and unit price/cost snapshots.

Order flow is pending → confirmed → shipped → delivered. Cancelling a pending or confirmed order restores its stock once. Shipped/delivered returns are recorded as separate receipt movements after goods return. Orders and Shipping are separate admin menus.

The shop, product detail, navigation and inventory refresh relevant data every ten seconds. Purchase rates remain private to admin/database records.

## Website configuration

- Navigation is generated from the live taxonomy. Assigned categories appear under their department; independent categories appear at the top level. The Navbar editor changes appearance only (classic, minimal, bold).
- Featured Categories allows at most three home-page categories. Catalog featured items and the existing configurable featured sections are both supported.
- Hero slides retain images, badges, text, calls to action, statistics and carousel controls, with original cinematic, image-first split and minimal framed layouts.
- Footer, Store Locator and Legal editors retain their existing fields and functionality.
- Settings now persist locally alongside inventory, so CMS editing works without Supabase credentials. Existing Supabase CMS values remain a read fallback until a setting is saved locally. Supabase customer authentication and existing remote orders retain their existing integration.

## Images

Upload still JPG, PNG, WebP or AVIF files through the item-profile form. The server enforces **five images per profile** and **1 MiB (1,048,576 bytes) per uploaded file**, validates actual image content, and converts accepted files to WebP with a maximum 1600-pixel dimension. Cards and previews request smaller 160/480/960-pixel derivatives, with immutable caching. Existing profile image URLs remain readable for compatibility.

## Persistence and deployment

Use Node **22.13 or later** (development uses Node 24). SQLite lives at `.data/inventory.sqlite`; uploaded media lives at `.data/item-images`. Both are excluded from Git. `INVENTORY_DB_PATH` and `INVENTORY_MEDIA_PATH` can configure absolute paths on persistent storage. Keep both outside deployment release directories and back them up. A local database backup was created under `.data/backups` during this update.

Schema upgrades preserve existing item IDs, variant IDs, stock balances, orders and movement references. Existing color/size stock is upgraded with child names, model fields, prices and barcodes.

Admin cookies are signed using `ADMIN_SESSION_SECRET`, with a seven-day expiry. Configure the production secret and admin password in environment settings.

For serverless or multiple application instances, connect a shared ERP/database and shared media storage before deployment. The current implementation runs on one persistent server. Legacy Supabase product records are preserved in that database; storefront publication is now controlled by item profiles and Catalog.

Validation: `npm run test:inventory`, TypeScript, ESLint and `npm run build`. Backend tests cover migration, codes, variants, images, pricing, orders, offers, negative stock, retries and cancellation.
