-- COCO EN FORMA · ETERNA · Refuerzo del techo duro de 2 EUR/mes
-- Idempotente y aditiva. Aplicada al proyecto activo el 2026-09-30.
begin;

update public.eterna_ai_monthly_budget
set cap_eur = least(cap_eur, 2.000000),
    spent_eur = least(spent_eur, 2.000000),
    reserved_eur = least(reserved_eur, greatest(0::numeric, 2.000000 - least(spent_eur, 2.000000)))
where cap_eur > 2.000000
   or spent_eur > 2.000000
   or spent_eur + reserved_eur > 2.000000;

alter table public.eterna_ai_monthly_budget
  drop constraint if exists eterna_ai_monthly_budget_hard_cap_check;

alter table public.eterna_ai_monthly_budget
  add constraint eterna_ai_monthly_budget_hard_cap_check
  check (cap_eur <= 2.000000);

create or replace function public.eterna_ai_budget_reserve(
  p_user_id uuid,
  p_month_start date,
  p_reserve_eur numeric,
  p_cap_eur numeric default 2.000000
)
returns table (
  ok boolean,
  reservation_id uuid,
  cap_eur numeric,
  spent_eur numeric,
  reserved_eur numeric,
  remaining_eur numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.eterna_ai_monthly_budget%rowtype;
  v_id uuid;
  v_reserve numeric(12,6);
  v_cap numeric(12,6);
  v_stale numeric(12,6);
begin
  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  v_reserve := greatest(0.000001, round(coalesce(p_reserve_eur,0)::numeric, 6));
  v_cap := least(2.000000, greatest(0.010000, round(coalesce(p_cap_eur,2.000000)::numeric, 6)));

  insert into public.eterna_ai_monthly_budget(user_id, month_start, cap_eur)
  values (p_user_id, p_month_start, v_cap)
  on conflict (user_id, month_start)
  do update set cap_eur = least(2.000000, public.eterna_ai_monthly_budget.cap_eur, excluded.cap_eur);

  select * into v_row
  from public.eterna_ai_monthly_budget
  where user_id = p_user_id and month_start = p_month_start
  for update;

  select coalesce(sum(r.reserved_eur),0)::numeric(12,6)
    into v_stale
  from public.eterna_ai_budget_reservations r
  where r.user_id = p_user_id
    and r.month_start = p_month_start
    and r.settled_at is null
    and r.created_at < now() - interval '20 minutes';

  if v_stale > 0 then
    update public.eterna_ai_budget_reservations r
      set actual_eur = r.reserved_eur, settled_at = now()
    where r.user_id = p_user_id
      and r.month_start = p_month_start
      and r.settled_at is null
      and r.created_at < now() - interval '20 minutes';

    update public.eterna_ai_monthly_budget b
      set spent_eur = least(b.cap_eur, b.spent_eur + v_stale),
          reserved_eur = greatest(0, b.reserved_eur - v_stale),
          updated_at = now()
    where b.user_id = p_user_id and b.month_start = p_month_start
    returning * into v_row;
  end if;

  if v_row.spent_eur + v_row.reserved_eur + v_reserve > v_row.cap_eur then
    return query
      select false, null::uuid, v_row.cap_eur, v_row.spent_eur, v_row.reserved_eur,
             greatest(0, v_row.cap_eur - v_row.spent_eur - v_row.reserved_eur);
    return;
  end if;

  insert into public.eterna_ai_budget_reservations(user_id, month_start, reserved_eur)
  values (p_user_id, p_month_start, v_reserve)
  returning id into v_id;

  update public.eterna_ai_monthly_budget b
    set reserved_eur = b.reserved_eur + v_reserve, updated_at = now()
  where b.user_id = p_user_id and b.month_start = p_month_start
  returning * into v_row;

  return query
    select true, v_id, v_row.cap_eur, v_row.spent_eur, v_row.reserved_eur,
           greatest(0, v_row.cap_eur - v_row.spent_eur - v_row.reserved_eur);
end;
$$;

create or replace function public.eterna_ai_budget_status(
  p_user_id uuid,
  p_month_start date,
  p_cap_eur numeric default 2.000000
)
returns table (
  cap_eur numeric,
  spent_eur numeric,
  reserved_eur numeric,
  remaining_eur numeric,
  blocked boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.eterna_ai_monthly_budget%rowtype;
  v_cap numeric(12,6);
begin
  v_cap := least(2.000000, greatest(0.010000, round(coalesce(p_cap_eur,2.000000)::numeric,6)));

  insert into public.eterna_ai_monthly_budget(user_id, month_start, cap_eur)
  values (p_user_id, p_month_start, v_cap)
  on conflict (user_id, month_start)
  do update set cap_eur = least(2.000000, public.eterna_ai_monthly_budget.cap_eur, excluded.cap_eur);

  select * into v_row
  from public.eterna_ai_monthly_budget
  where user_id = p_user_id and month_start = p_month_start;

  return query
    select v_row.cap_eur, v_row.spent_eur, v_row.reserved_eur,
           greatest(0, v_row.cap_eur - v_row.spent_eur - v_row.reserved_eur),
           (v_row.spent_eur + v_row.reserved_eur >= v_row.cap_eur);
end;
$$;

revoke all on function public.eterna_ai_budget_reserve(uuid,date,numeric,numeric) from public, anon, authenticated;
revoke all on function public.eterna_ai_budget_status(uuid,date,numeric) from public, anon, authenticated;
grant execute on function public.eterna_ai_budget_reserve(uuid,date,numeric,numeric) to service_role;
grant execute on function public.eterna_ai_budget_status(uuid,date,numeric) to service_role;

comment on table public.eterna_ai_monthly_budget is
  'Tope duro mensual por usuario para gasto de inferencia IA de ETERNA. Nunca puede superar 2 EUR/mes.';

commit;
