-- Coco 3D: private order records, written only by the existing ETERNA Worker.
create table if not exists public.coco_shop_orders (
 id uuid primary key,
 access_hash text not null check (access_hash ~ '^[a-f0-9]{64}$'),
 buyer_name text not null,
 email text not null,
 phone text not null,
 address jsonb not null default '{}'::jsonb,
 notes text not null default '',
 items jsonb not null check (jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 24),
 subtotal integer not null check (subtotal>0),
 delivery text not null check (delivery in ('pickup','shipping')),
 shipping_amount integer check (shipping_amount between 0 and 50000),
 total_amount integer,
 status text not null check (status in ('awaiting_quote','awaiting_payment','paid','preparing','ready','shipped','completed','cancelled','refunded','review')),
 quote_note text not null default '',
 terms text not null,
 checkout_id text unique,
 checkout_attempt integer not null default 0,
 payment_intent text unique,
 paid_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint coco_shop_total check ((shipping_amount is null and total_amount is null) or (shipping_amount is not null and total_amount=subtotal+shipping_amount)),
 constraint coco_shop_pickup check (delivery<>'pickup' or shipping_amount=0)
);
alter table public.coco_shop_orders enable row level security;
revoke all on public.coco_shop_orders from public,anon,authenticated;
grant select,insert,update,delete on public.coco_shop_orders to service_role;
create index if not exists coco_shop_orders_created_at_idx on public.coco_shop_orders(created_at desc);
comment on table public.coco_shop_orders is 'Coco 3D orders. No direct browser access; opaque customer key or master authorization verified in ETERNA Worker.';
