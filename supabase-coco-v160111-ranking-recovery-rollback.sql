-- Rollback no destructivo de v160.111: vuelve a mostrar solo balanced-v1.
begin;

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
  'balanced-v1: suma comparable de los 11 juegos generales; histórico preservado fuera de la vista.';

commit;
