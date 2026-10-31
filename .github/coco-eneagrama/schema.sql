create table public.coco_eneagrama_orders (
 checkout_id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 payment_intent text not null unique,
 status text not null default 'paid' check (status in ('paid','revoked')),
 created_at timestamptz not null default now(),
 run_id uuid unique,
 fingerprint text,
 used_at timestamptz,
 check ((run_id is null and fingerprint is null and used_at is null) or (run_id is not null and fingerprint ~ '^[a-f0-9]{64}$' and used_at is not null))
);
create index coco_eneagrama_orders_user on public.coco_eneagrama_orders(user_id,status);
alter table public.coco_eneagrama_orders enable row level security;
revoke all on public.coco_eneagrama_orders from public,anon,authenticated;
grant all on public.coco_eneagrama_orders to service_role;
comment on table public.coco_eneagrama_orders is 'Server-only payment receipts and single-use report entitlements. No birth dates, answers or reports.';
create function public.coco_eneagrama_claim_report(p_user uuid,p_run uuid,p_fingerprint text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior public.coco_eneagrama_orders; credit text;
begin
 if p_run is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then return jsonb_build_object('ok',false,'reason','invalid'); end if;
 if exists(select 1 from public.perfiles where id=p_user and rol='propietario') then return jsonb_build_object('ok',true,'master',true); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into prior from public.coco_eneagrama_orders where run_id=p_run;
 if found then return jsonb_build_object('ok',prior.user_id=p_user and prior.status='paid' and prior.fingerprint=p_fingerprint,'replay',true); end if;
 select checkout_id into credit from public.coco_eneagrama_orders where user_id=p_user and status='paid' and run_id is null order by created_at limit 1 for update;
 if credit is null then return jsonb_build_object('ok',false,'reason','payment_required'); end if;
 update public.coco_eneagrama_orders set run_id=p_run,fingerprint=p_fingerprint,used_at=now() where checkout_id=credit;
 return jsonb_build_object('ok',true,'replay',false);
end $$;
revoke all on function public.coco_eneagrama_claim_report(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.coco_eneagrama_claim_report(uuid,uuid,text) to service_role;
