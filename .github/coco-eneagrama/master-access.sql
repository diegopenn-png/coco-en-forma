-- Account entitlements are server-owned; player profiles keep their existing role.
create table public.coco_master_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.coco_master_accounts enable row level security;
revoke all on public.coco_master_accounts from public,anon,authenticated;
grant all on public.coco_master_accounts to service_role;
comment on table public.coco_master_accounts is 'Server-managed free master access. Never writable through client profiles or user metadata.';
insert into public.coco_master_accounts(user_id)
-- Supply the verified account email privately when provisioning another environment.
select id from auth.users where lower(email)=lower(current_setting('app.coco_master_email',true));
create function public.coco_eneagrama_is_master(p_user uuid)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.coco_master_accounts where user_id=p_user)
     or exists(select 1 from public.perfiles where id=p_user and rol='propietario');
$$;
revoke all on function public.coco_eneagrama_is_master(uuid) from public,anon,authenticated;
grant execute on function public.coco_eneagrama_is_master(uuid) to service_role;

create or replace function public.coco_eneagrama_claim_report(p_user uuid,p_run uuid,p_fingerprint text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior public.coco_eneagrama_orders; credit text;
begin
 if p_run is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then return jsonb_build_object('ok',false,'reason','invalid'); end if;
 if public.coco_eneagrama_is_master(p_user) then return jsonb_build_object('ok',true,'master',true); end if;
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
