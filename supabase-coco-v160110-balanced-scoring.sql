-- ============================================================
-- COCO EN FORMA v160.110
-- PUNTUACIÓN EQUILIBRADA · TEMPORADA BALANCED-V1
-- ============================================================
-- Migración aditiva e idempotente. No borra ni reescribe partidas históricas.
-- Las clasificaciones generales comienzan una temporada nueva y solo leen
-- resultados guardados con puntuacion_version = 'balanced-v1'.

begin;

create table if not exists public.coco_scoring_seasons (
  version text primary key,
  started_at timestamptz not null default now(),
  active boolean not null default false,
  description text not null
);

alter table public.coco_scoring_seasons enable row level security;
revoke all on table public.coco_scoring_seasons from public, anon, authenticated;

update public.coco_scoring_seasons set active = false where active = true;
insert into public.coco_scoring_seasons (version, active, description)
values (
  'balanced-v1',
  true,
  'Escala común de aproximadamente 100 puntos; dificultad y complejidad acotadas.'
)
on conflict (version) do update
set active = excluded.active,
    description = excluded.description;

alter table public.partidas
  add column if not exists puntuacion_version text,
  add column if not exists dificultad smallint,
  add column if not exists rendimiento numeric(7,6);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.partidas'::regclass
      and conname = 'partidas_dificultad_equilibrada'
  ) then
    alter table public.partidas
      add constraint partidas_dificultad_equilibrada
      check (dificultad is null or dificultad between 1 and 4) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.partidas'::regclass
      and conname = 'partidas_rendimiento_equilibrado'
  ) then
    alter table public.partidas
      add constraint partidas_rendimiento_equilibrado
      check (rendimiento is null or rendimiento between 0 and 1) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.partidas'::regclass
      and conname = 'partidas_balanced_v1_integridad'
  ) then
    alter table public.partidas
      add constraint partidas_balanced_v1_integridad
      check (
        puntuacion_version is distinct from 'balanced-v1'
        or (
          juego in (
            'numeros','calculo','palabras','series','memoria','sudoku',
            'sopa','crucigrama','tiempo','verdadero','futbol'
          )
          and puntos between 0 and 115
          and dificultad between 1 and 4
          and rendimiento between 0 and 1
          and (dificultad <> 4 or juego = 'futbol')
        )
      ) not valid;
  end if;
end
$$;

-- Solo la función validada puede crear filas de la temporada nueva. Las rutas
-- históricas conservan sus inserciones con puntuacion_version nula.
drop policy if exists partidas_balanced_v1_solo_rpc on public.partidas;
create policy partidas_balanced_v1_solo_rpc
  on public.partidas
  as restrictive
  for insert
  to public
  with check (puntuacion_version is null);

create index if not exists partidas_scoring_version_jugador_idx
  on public.partidas (puntuacion_version, jugador, juego, creado desc);

create index if not exists partidas_jugador_juego_creado_idx
  on public.partidas (jugador, juego, creado desc);

create or replace function public.registrar_partida_equilibrada_v160110(
  p_juego text,
  p_puntos integer,
  p_dificultad smallint,
  p_rendimiento numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_inicio_dia timestamptz := v_hoy::timestamp at time zone 'Europe/Madrid';
  v_fin_dia timestamptz := (v_hoy + 1)::timestamp at time zone 'Europe/Madrid';
  v_factor_juego numeric;
  v_factor_dificultad numeric;
  v_esperado integer;
begin
  if v_usuario is null then
    raise exception using
      errcode = '42501',
      message = 'Es necesario iniciar sesión para guardar la partida.';
  end if;

  v_factor_juego := case p_juego
    when 'numeros' then 0.98
    when 'calculo' then 1.02
    when 'palabras' then 0.99
    when 'series' then 1.01
    when 'memoria' then 1.00
    when 'sudoku' then 1.03
    when 'sopa' then 0.98
    when 'crucigrama' then 1.01
    when 'tiempo' then 0.99
    when 'verdadero' then 0.98
    when 'futbol' then 1.02
    else null
  end;

  if v_factor_juego is null then
    raise exception using
      errcode = '22023',
      message = 'El juego no pertenece a la clasificación general equilibrada.';
  end if;

  if p_dificultad is null or p_dificultad < 1 or p_dificultad > 4
     or (p_dificultad = 4 and p_juego <> 'futbol') then
    raise exception using
      errcode = '22023',
      message = 'La dificultad indicada no es válida para este juego.';
  end if;

  if p_rendimiento is null or p_rendimiento < 0 or p_rendimiento > 1 then
    raise exception using
      errcode = '22003',
      message = 'El rendimiento debe estar entre 0 y 1.';
  end if;

  v_factor_dificultad := case p_dificultad
    when 1 then 0.90
    when 2 then 1.00
    when 3 then 1.08
    when 4 then 1.12
  end;
  v_esperado := least(
    115,
    round(100 * v_factor_juego * v_factor_dificultad * p_rendimiento)::integer
  );

  if p_puntos is null or p_puntos < 0 or p_puntos > 115
     or abs(p_puntos - v_esperado) > 1 then
    raise exception using
      errcode = '22003',
      message = 'La puntuación no coincide con el rendimiento y la dificultad.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_usuario::text || '|' || p_juego || '|' || v_hoy::text, 160110)
  );

  if exists (
    select 1
    from public.partidas p
    where p.jugador = v_usuario
      and p.juego = p_juego
      and p.creado >= v_inicio_dia
      and p.creado < v_fin_dia
  ) then
    raise exception using
      errcode = '23505',
      message = 'La partida de este juego ya está registrada hoy.';
  end if;

  insert into public.partidas (
    jugador, juego, puntos, puntuacion_version, dificultad, rendimiento
  ) values (
    v_usuario, p_juego, v_esperado, 'balanced-v1', p_dificultad, p_rendimiento
  );

  return jsonb_build_object(
    'ok', true,
    'juego', p_juego,
    'puntos', v_esperado,
    'dificultad', p_dificultad,
    'rendimiento', p_rendimiento,
    'puntuacion_version', 'balanced-v1'
  );
end
$$;

revoke all on function public.registrar_partida_equilibrada_v160110(text, integer, smallint, numeric) from public, anon;
grant execute on function public.registrar_partida_equilibrada_v160110(text, integer, smallint, numeric) to authenticated;

comment on function public.registrar_partida_equilibrada_v160110(text, integer, smallint, numeric) is
  'Guarda una única partida diaria y valida en servidor la escala balanced-v1.';

create or replace view public.coco_clasificacion_fuente_v153 as
with pivot as (
  select
    p.jugador as jugador_id,
    coalesce(sum(p.puntos) filter (where p.juego = 'numeros'), 0)::bigint as numeros,
    coalesce(sum(p.puntos) filter (where p.juego = 'calculo'), 0)::bigint as calculo,
    coalesce(sum(p.puntos) filter (where p.juego = 'palabras'), 0)::bigint as palabras,
    coalesce(sum(p.puntos) filter (where p.juego = 'series'), 0)::bigint as series,
    coalesce(sum(p.puntos) filter (where p.juego = 'memoria'), 0)::bigint as memoria,
    coalesce(sum(p.puntos) filter (where p.juego = 'sudoku'), 0)::bigint as sudoku,
    coalesce(sum(p.puntos) filter (where p.juego = 'sopa'), 0)::bigint as sopa,
    coalesce(sum(p.puntos) filter (where p.juego = 'crucigrama'), 0)::bigint as crucigrama,
    coalesce(sum(p.puntos) filter (where p.juego = 'tiempo'), 0)::bigint as tiempo,
    coalesce(sum(p.puntos) filter (where p.juego = 'verdadero'), 0)::bigint as verdadero,
    coalesce(sum(p.puntos) filter (where p.juego = 'futbol'), 0)::bigint as futbol,
    coalesce(max(p.puntos), 0)::integer as mejor,
    count(*)::bigint as partidas
  from public.partidas p
  where p.puntuacion_version = 'balanced-v1'
    and p.juego in (
      'numeros','calculo','palabras','series','memoria','sudoku','sopa',
      'crucigrama','tiempo','verdadero','futbol'
    )
  group by p.jugador
)
select
  pv.jugador_id,
  coalesce(nullif(btrim(pr.apodo), ''), 'Jugador Coco')::text as apodo,
  pv.numeros, pv.calculo, pv.palabras, pv.series, pv.memoria,
  pv.sudoku, pv.sopa, pv.crucigrama, pv.tiempo, pv.verdadero, pv.futbol,
  (
    pv.numeros + pv.calculo + pv.palabras + pv.series + pv.memoria +
    pv.sudoku + pv.sopa + pv.crucigrama + pv.tiempo + pv.verdadero + pv.futbol
  )::bigint as total,
  pv.mejor,
  pv.partidas
from pivot pv
left join public.perfiles pr on pr.id = pv.jugador_id;

revoke all on table public.coco_clasificacion_fuente_v153 from public, anon, authenticated;
comment on view public.coco_clasificacion_fuente_v153 is
  'balanced-v1: suma comparable de los 11 juegos generales; conserva fuera de la vista el histórico anterior.';

-- Conserva el contrato consumido por la web, la PWA, el carnet y Zona Familiar.
create or replace function public.clasificacion_general_coco(p_limit integer default 50)
returns table (
  jugador uuid,
  apodo text,
  puntos bigint,
  mejor integer,
  partidas bigint,
  posicion bigint,
  total_jugadores bigint,
  es_mio boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      f.jugador_id,
      f.apodo,
      f.total,
      f.mejor,
      f.partidas,
      rank() over (
        order by f.total desc, f.mejor desc, f.partidas asc, f.apodo asc, f.jugador_id asc
      )::bigint as posicion,
      count(*) over ()::bigint as total_jugadores
    from public.coco_clasificacion_fuente_v153 f
  )
  select
    r.jugador_id,
    r.apodo,
    r.total,
    r.mejor,
    r.partidas,
    r.posicion,
    r.total_jugadores,
    (r.jugador_id = auth.uid())
  from ranked r
  where auth.uid() is not null
    and (
      r.posicion <= greatest(1, least(coalesce(p_limit, 50), 100))
      or r.jugador_id = auth.uid()
    )
  order by r.posicion, r.apodo;
$$;

create or replace function public.clasificacion_global_v153()
returns table (
  jugador_id uuid,
  apodo text,
  numeros bigint,
  calculo bigint,
  palabras bigint,
  series bigint,
  memoria bigint,
  sudoku bigint,
  sopa bigint,
  crucigrama bigint,
  tiempo bigint,
  verdadero bigint,
  futbol bigint,
  total bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.jugador_id, f.apodo,
    f.numeros, f.calculo, f.palabras, f.series, f.memoria,
    f.sudoku, f.sopa, f.crucigrama, f.tiempo, f.verdadero, f.futbol,
    f.total
  from public.coco_clasificacion_fuente_v153 f
  where auth.uid() is not null
  order by f.total desc, f.apodo, f.jugador_id;
$$;

revoke all on function public.clasificacion_general_coco(integer) from public, anon;
grant execute on function public.clasificacion_general_coco(integer) to authenticated;
revoke all on function public.clasificacion_global_v153() from public, anon;
grant execute on function public.clasificacion_global_v153() to authenticated;

commit;

-- VALIDACIONES SOLO LECTURA
-- 1) Ninguna puntuación de la temporada puede superar 115:
-- select * from public.partidas
-- where puntuacion_version = 'balanced-v1' and puntos not between 0 and 115;
-- 2) El total siempre debe coincidir con la suma de las once columnas:
-- select * from public.coco_clasificacion_fuente_v153
-- where total <> numeros+calculo+palabras+series+memoria+sudoku+sopa+crucigrama+tiempo+verdadero+futbol;
