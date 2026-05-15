# Clyfer Storefront + Admin Fixes

## Status
- Completed

## Planned Work
- Customer auth
  - Replace the placeholder login with Supabase Auth sign-in.
  - Add a real register flow.
  - Keep admin auth separate and cookie-based.

- Navbar search
  - Make the search icon open a real search dialog.
  - Route searches into `/shop?search=...`.
  - Keep shop filters synced to the URL.

- Checkout and orders
  - Allow removing items from the checkout summary.
  - Make the order insert path RLS-safe.
  - Keep cart totals and shipping recalculation in sync.

- Admin protection and catalog structure
  - Protect all `/api/admin/*` routes.
  - Move category creation into a dedicated catalog manager.
  - Let navbar selection only use existing catalog categories.
  - Make products read from the shared catalog source of truth.

- Branding and footer system
  - Use `public/logo.jpeg` for the public navbar and footer.
  - Support mixed footer content: text, links, icons, and images.
  - Add a live footer preview in the admin panel.

## Done Log
- Added working customer auth pages and shared auth state.
- Rebuilt navbar search so it opens a modal and updates the URL.
- Switched checkout orders to a service-role-backed insert path.
- Added item removal inside checkout.
- Protected admin APIs with session checks.
- Added a shared catalog manager and linked navbar/product selection to it.
- Refactored footer config/editor/preview to support mixed content.
- Added the public `/about`, `/contact`, and `/track` pages used by admin link pickers.
- Wired the logo asset into the public navbar and footer.
