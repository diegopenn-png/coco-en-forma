-- COCO EN FORMA · ETERNA · Tope duro mensual de gasto IA por usuario
-- Límite por defecto: 2,00 EUR por mes natural y por usuario.
-- Aditiva: no borra ni transforma datos existentes.
begin;

create table if not exists public.eterna_ai_monthly_budget (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null,
  cap_eur numeric(12,6) not null default 2.000000 check (cap_eur > 0 and cap_eur <= 2.000000),
  spent_eur numeric(12,6) not null default 0 check (spent_eur >= 0),
  reserved_eur numeric(12,6) not null default 0 check (reserved_eur >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, month_start)
);

create table if not exists public.eterna_ai_budget_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null,
  reserved_eur numeric(12,6) not null check (reserved_eur > 0),
  actual_eur numeric(12,6),
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  foreign key (user_id, month_start)
    references public.eterna_ai_monthly_budget(user_id, month_start)
    on delete cascade
);

create index if not exists eterna_ai_budget_reservations_open_idx
  on public.eterna_ai_budget_reservations(user_id, month_start, created_at)
  where settled_at is null;

alter table public.eterna_ai_monthly_budget enable row level security;
alter table public.eterna_ai_budget_reservations enable row level security;

drop policy if exists eterna_ai_budget_own_select on public.eterna_ai_monthly_budget;
create policy eterna_ai_budget_own_select
  on public.eterna_ai_monthly_budget
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.eterna_ai_monthly_budget from anon, authenticated;
grant select on public.eterna_ai_monthly_budget to authenticated;
revoke all on public.eterna_ai_budget_reservations from anon, authenticated;

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

  -- Una reserva huérfana de más de 20 minutos se considera consumida.
  -- Es deliberadamente conservador: evita que un corte de red deje gasto real sin contabilizar.
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
      set spent_eur = b.spent_eur + v_stale,
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

create or replace function public.eterna_ai_budget_settle(
  p_user_id uuid,
  p_reservation_id uuid,
  p_actual_eur numeric,
  p_input_tokens bigint default 0,
  p_output_tokens bigint default 0
)
returns table (
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
  v_res public.eterna_ai_budget_reservations%rowtype;
  v_budget public.eterna_ai_monthly_budget%rowtype;
  v_actual numeric(12,6);
begin
  select * into v_res
  from public.eterna_ai_budget_reservations
  where id = p_reservation_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'budget reservation not found';
  end if;

  select * into v_budget
  from public.eterna_ai_monthly_budget
  where user_id = v_res.user_id and month_start = v_res.month_start
  for update;

  if v_res.settled_at is null then
    -- La reserva se calcula como cota superior. Si una métrica del proveedor
    -- llegara a superar esa estimación, nunca ampliamos gasto por encima
    -- de lo previamente reservado: el límite duro conserva prioridad.
    v_actual := least(
      v_res.reserved_eur,
      greatest(0, round(coalesce(p_actual_eur, v_res.reserved_eur)::numeric, 6))
    );

    update public.eterna_ai_budget_reservations
      set actual_eur = v_actual,
          input_tokens = greatest(0, coalesce(p_input_tokens,0)),
          output_tokens = greatest(0, coalesce(p_output_tokens,0)),
          settled_at = now()
    where id = v_res.id;

    update public.eterna_ai_monthly_budget b
      set spent_eur = least(b.cap_eur, b.spent_eur + v_actual),
          reserved_eur = greatest(0, b.reserved_eur - v_res.reserved_eur),
          input_tokens = b.input_tokens + greatest(0, coalesce(p_input_tokens,0)),
          output_tokens = b.output_tokens + greatest(0, coalesce(p_output_tokens,0)),
          updated_at = now()
    where b.user_id = v_res.user_id and b.month_start = v_res.month_start
    returning * into v_budget;
  end if;

  return query
    select v_budget.cap_eur, v_budget.spent_eur, v_budget.reserved_eur,
           greatest(0, v_budget.cap_eur - v_budget.spent_eur - v_budget.reserved_eur);
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
  v_cap := greatest(0.010000, round(coalesce(p_cap_eur,2.000000)::numeric,6));

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
revoke all on function public.eterna_ai_budget_settle(uuid,uuid,numeric,bigint,bigint) from public, anon, authenticated;
revoke all on function public.eterna_ai_budget_status(uuid,date,numeric) from public, anon, authenticated;
grant execute on function public.eterna_ai_budget_reserve(uuid,date,numeric,numeric) to service_role;
grant execute on function public.eterna_ai_budget_settle(uuid,uuid,numeric,bigint,bigint) to service_role;
grant execute on function public.eterna_ai_budget_status(uuid,date,numeric) to service_role;

comment on table public.eterna_ai_monthly_budget is
  'Tope duro mensual por usuario para gasto de inferencia IA de ETERNA. Nunca puede superar 2 EUR/mes.';
comment on function public.eterna_ai_budget_reserve(uuid,date,numeric,numeric) is
  'Reserva atómica de presupuesto antes de una inferencia. No existe bypass por rol, tester o plan.';
comment on function public.eterna_ai_budget_settle(uuid,uuid,numeric,bigint,bigint) is
  'Liquida una reserva con el coste estimado por uso real del proveedor.';

commit;
