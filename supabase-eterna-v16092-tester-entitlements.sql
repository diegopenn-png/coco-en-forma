-- COCO EN FORMA 160.92.0 · ETERNA · Entitlements internos de auditoría
-- Migración aditiva. No modifica perfiles, roles, pagos, suscripciones ni uso.
begin;

create table if not exists public.eterna_test_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.eterna_test_entitlements is
  'Acceso ilimitado interno de ETERNA para auditorías autorizadas; solo lectura desde el Worker.';

alter table public.eterna_test_entitlements enable row level security;
revoke all on table public.eterna_test_entitlements from anon, authenticated;
grant select on table public.eterna_test_entitlements to service_role;

commit;
