-- ================================================================
-- Clyfer Database Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- ================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── site_config ──────────────────────────────────────────────────
-- Single-row-per-key CMS config for navbar, hero, footer, featured
create table if not exists public.site_config (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger site_config_updated_at
  before update on public.site_config
  for each row execute procedure public.set_updated_at();

-- Seed default navbar config
insert into public.site_config (key, value) values (
  'navbar',
  '{
    "categories": [
      {
        "id": "shop",
        "label": "Shop",
        "href": "/shop",
        "subcategories": [
          {"label": "Running", "href": "/shop/running", "desc": "Performance on every track"},
          {"label": "Casual", "href": "/shop/casual", "desc": "Everyday comfort & style"},
          {"label": "Formal", "href": "/shop/formal", "desc": "Elegance for every occasion"},
          {"label": "Sports", "href": "/shop/sports", "desc": "Engineered for athletes"},
          {"label": "Limited Edition", "href": "/shop/limited", "desc": "Exclusive drops"}
        ]
      }
    ],
    "links": [
      {"label": "New Arrivals", "href": "/shop?filter=new"},
      {"label": "Sale", "href": "/shop?filter=sale"},
      {"label": "About", "href": "/about"}
    ]
  }'::jsonb
) on conflict (key) do nothing;

-- Seed default hero config
insert into public.site_config (key, value) values (
  'hero',
  '{
    "slides": [
      {
        "id": "slide-1",
        "badge": "New Season Drop",
        "title": "Step Into",
        "titleHighlight": "Your Era.",
        "subtitle": "Discover footwear crafted for those who move forward. Premium materials, iconic silhouettes, built for the relentless.",
        "ctaPrimary": {"label": "Shop Now", "href": "/shop"},
        "ctaSecondary": {"label": "Explore Collection", "href": "/shop/limited"},
        "imageUrl": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90",
        "stats": [
          {"value": "50K+", "label": "Happy customers"},
          {"value": "200+", "label": "Shoe styles"},
          {"value": "4.9★", "label": "Average rating"}
        ]
      },
      {
        "id": "slide-2",
        "badge": "Limited Edition",
        "title": "Built For",
        "titleHighlight": "Champions.",
        "subtitle": "Exclusive drops for those who demand the best. Carbon fibre soles, premium leather, zero compromise.",
        "ctaPrimary": {"label": "Get Yours", "href": "/shop/limited"},
        "ctaSecondary": {"label": "View All", "href": "/shop"},
        "imageUrl": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=90",
        "stats": [
          {"value": "12", "label": "Exclusive styles"},
          {"value": "100%", "label": "Premium leather"},
          {"value": "5★", "label": "Rated"}
        ]
      }
    ]
  }'::jsonb
) on conflict (key) do nothing;

-- Seed default featured config
insert into public.site_config (key, value) values (
  'featured',
  '{
    "title": "This Season'\''s Picks",
    "subtitle": "Featured",
    "description": "Handpicked by our style team"
  }'::jsonb
) on conflict (key) do nothing;

-- Seed default footer config
insert into public.site_config (key, value) values (
  'footer',
  '{
    "tagline": "Premium footwear for those who move forward. Quality crafted, style-first.",
    "columns": [
      {
        "heading": "Shop",
        "links": [
          {"label": "All Shoes", "href": "/shop"},
          {"label": "Running", "href": "/shop/running"},
          {"label": "Casual", "href": "/shop/casual"},
          {"label": "Limited Edition", "href": "/shop/limited"},
          {"label": "Sale", "href": "/shop?filter=sale"}
        ]
      },
      {
        "heading": "Company",
        "links": [
          {"label": "About Us", "href": "/about"},
          {"label": "Blog", "href": "/blog"},
          {"label": "Careers", "href": "/careers"},
          {"label": "Press", "href": "/press"}
        ]
      },
      {
        "heading": "Support",
        "links": [
          {"label": "Help Center", "href": "/help"},
          {"label": "Size Guide", "href": "/size-guide"},
          {"label": "Returns", "href": "/returns"},
          {"label": "Track Order", "href": "/track"}
        ]
      }
    ],
    "socialLinks": [
      {"label": "Instagram", "href": "#"},
      {"label": "Facebook", "href": "#"},
      {"label": "YouTube", "href": "#"}
    ]
  }'::jsonb
) on conflict (key) do nothing;

-- ── products ──────────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  brand           text not null default 'Clyfer',
  price           numeric(10,2) not null,
  original_price  numeric(10,2),
  description     text not null default '',
  images          text[] not null default '{}',
  category        text not null default 'casual',
  sizes           int[] not null default '{}',
  colors          jsonb[] not null default '{}',
  tags            text[] not null default '{}',
  rating          numeric(3,1) not null default 5.0,
  review_count    int not null default 0,
  in_stock        boolean not null default true,
  is_featured     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- Seed sample products
insert into public.products (name, slug, brand, price, original_price, description, images, category, sizes, colors, tags, rating, review_count, in_stock, is_featured) values
  ('Air Clyfer Pro', 'air-clyfer-pro', 'Clyfer', 8500, 11000, 'Performance sneaker with responsive cushioning and breathable mesh upper. Ideal for daily running and training sessions.', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'], 'running', ARRAY[40,41,42,43,44,45], ARRAY['{"name":"Red","hex":"#ef4444"}'::jsonb], ARRAY['featured','new'], 4.9, 312, true, true),
  ('Urban Stride X', 'urban-stride-x', 'Clyfer', 6800, null, 'Everyday casual with premium suede finish. Minimalist design that pairs with everything.', ARRAY['https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80'], 'casual', ARRAY[40,41,42,43,44], ARRAY['{"name":"White","hex":"#ffffff"}'::jsonb], ARRAY['bestseller'], 4.7, 198, true, true),
  ('Phantom Elite', 'phantom-elite', 'Clyfer', 12000, null, 'Limited edition sports shoe with carbon fiber sole. Built for serious athletes who demand perfection.', ARRAY['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80'], 'limited', ARRAY[41,42,43,44], ARRAY['{"name":"Black","hex":"#000000"}'::jsonb], ARRAY['limited','exclusive'], 5.0, 54, true, true),
  ('Swift Runner V2', 'swift-runner-v2', 'Clyfer', 7200, 9000, 'Track-ready runner with breathable mesh upper and cushioned midsole.', ARRAY['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80'], 'sports', ARRAY[39,40,41,42,43,44,45], ARRAY['{"name":"Blue","hex":"#3b82f6"}'::jsonb], ARRAY['sale','popular'], 4.8, 427, true, true)
on conflict (slug) do nothing;

-- ── orders ────────────────────────────────────────────────────────
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone         text not null,
  address       text not null,
  city          text not null default '',
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  size          int,
  color         text,
  quantity      int not null default 1,
  total_price   numeric(10,2) not null,
  status        text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  notes         text default '',
  created_at    timestamptz not null default now()
);

-- ── RLS Policies (enable RLS, use service role for admin writes) ──
alter table public.site_config enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Public reads for site_config and products
create policy "public_read_site_config" on public.site_config for select using (true);
create policy "public_read_products"    on public.products    for select using (true);

-- Service role can do everything (admin API routes use service role)
create policy "service_all_site_config" on public.site_config for all using (auth.role() = 'service_role');
create policy "service_all_products"    on public.products    for all using (auth.role() = 'service_role');
create policy "service_all_orders"      on public.orders      for all using (auth.role() = 'service_role');

-- Allow anon to insert orders (checkout form)
create policy "anon_insert_orders" on public.orders for insert with check (true);
