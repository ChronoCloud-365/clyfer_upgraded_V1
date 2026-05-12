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
