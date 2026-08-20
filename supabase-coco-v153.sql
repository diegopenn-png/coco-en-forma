-- ============================================================
-- COCO EN FORMA v153.0
-- FUENTE ÚNICA DE VERDAD PARA CLASIFICACIÓN GENERAL
-- ============================================================
-- Ejecutar UNA VEZ (es idempotente) en Supabase SQL Editor después de desplegar v153.
-- No borra usuarios, perfiles ni partidas históricas.
-- Coco Corre y Encuentra las diferencias dejan de contar, pero sus filas históricas se conservan.
-- Coco Fútbol pasa a la clasificación general y sus partidas históricas cuentan una sola vez.

begin;

-- Esta vista privada es la fuente única: todos los totales y desgloses salen de public.partidas
-- con exactamente el mismo conjunto de 11 juegos.
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
  where p.juego in (
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
'v153: fuente privada única. TOTAL = suma exacta de los 11 juegos generales, incluido Fútbol.';

-- Ranking compacto utilizado también por el carnet y Zona Familiar.
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
set search_path = public, pg_temp
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
    r.jugador_id as jugador,
    r.apodo,
    r.total as puntos,
    r.mejor,
    r.partidas,
    r.posicion,
    r.total_jugadores,
    (r.jugador_id = auth.uid()) as es_mio
  from ranked r
  where auth.uid() is not null
    and (
      r.posicion <= greatest(1, least(coalesce(p_limit, 50), 100))
      or r.jugador_id = auth.uid()
    )
  order by r.posicion asc, r.apodo asc;
$$;

revoke all on function public.clasificacion_general_coco(integer) from public, anon;
grant execute on function public.clasificacion_general_coco(integer) to authenticated;
comment on function public.clasificacion_general_coco(integer) is
'v153: ranking general desde coco_clasificacion_fuente_v153; incluye Fútbol y excluye Coco Corre/Diferencias.';

-- Desglose visible: cada columna y el Total salen de la misma vista, por lo que
-- TOTAL = numeros + calculo + palabras + series + memoria + sudoku + sopa + crucigrama + tiempo + verdadero + futbol.
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
set search_path = public, pg_temp
as $$
  select
    f.jugador_id, f.apodo,
    f.numeros, f.calculo, f.palabras, f.series, f.memoria,
    f.sudoku, f.sopa, f.crucigrama, f.tiempo, f.verdadero, f.futbol,
    f.total
  from public.coco_clasificacion_fuente_v153 f
  where auth.uid() is not null
  order by f.total desc, f.apodo asc, f.jugador_id asc;
$$;

revoke all on function public.clasificacion_global_v153() from public, anon;
grant execute on function public.clasificacion_global_v153() to authenticated;
comment on function public.clasificacion_global_v153() is
'v153: desglose por juego desde una única fuente; el total es matemáticamente idéntico a la suma de las once columnas.';

-- Compatibilidad: la clasificación específica queda únicamente para Coco Med.
-- Fútbol ya NO puede devolver ranking específico.
create or replace function public.clasificacion_juego_coco(p_juego text, p_limit integer default 50)
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
set search_path = public, pg_temp
as $$
  with stats as (
    select
      p.jugador,
      coalesce(sum(p.puntos), 0)::bigint as puntos,
      coalesce(max(p.puntos), 0)::integer as mejor,
      count(*)::bigint as partidas
    from public.partidas p
    where p.juego = p_juego
      and p_juego = 'cocomed'
    group by p.jugador
  ), ranked as (
    select
      s.jugador,
      coalesce(nullif(btrim(pr.apodo), ''), 'Jugador Coco')::text as apodo,
      s.puntos, s.mejor, s.partidas,
      rank() over (
        order by s.puntos desc, s.mejor desc, s.partidas asc,
                 coalesce(nullif(btrim(pr.apodo), ''), 'Jugador Coco') asc,
                 s.jugador asc
      )::bigint as posicion,
      count(*) over ()::bigint as total_jugadores
    from stats s
    left join public.perfiles pr on pr.id = s.jugador
  )
  select
    r.jugador, r.apodo, r.puntos, r.mejor, r.partidas,
    r.posicion, r.total_jugadores, (r.jugador = auth.uid()) as es_mio
  from ranked r
  where auth.uid() is not null
    and (
      r.posicion <= greatest(1, least(coalesce(p_limit, 50), 100))
      or r.jugador = auth.uid()
    )
  order by r.posicion asc, r.apodo asc;
$$;

revoke all on function public.clasificacion_juego_coco(text, integer) from public, anon;
grant execute on function public.clasificacion_juego_coco(text, integer) to authenticated;

commit;

-- VALIDACIÓN OPCIONAL (solo lectura; descomenta después de ejecutar si quieres auditar):
-- select jugador_id, total,
--        numeros+calculo+palabras+series+memoria+sudoku+sopa+crucigrama+tiempo+verdadero+futbol as suma_columnas
-- from public.coco_clasificacion_fuente_v153
-- where total <> numeros+calculo+palabras+series+memoria+sudoku+sopa+crucigrama+tiempo+verdadero+futbol;
-- Debe devolver 0 filas.

-- DIAGNÓSTICO OPCIONAL DE DUPLICADOS DIARIOS (NO BORRA NADA):
-- select jugador, juego, (creado at time zone 'Europe/Madrid')::date as dia, count(*) as filas
-- from public.partidas
-- where juego in ('numeros','calculo','palabras','series','memoria','sudoku','sopa','crucigrama','tiempo','verdadero','futbol')
-- group by jugador, juego, (creado at time zone 'Europe/Madrid')::date
-- having count(*) > 1
-- order by filas desc, dia desc;
