-- ============================================================
-- COCO EN FORMA v160.111
-- RECUPERACIÓN DE CLASIFICACIÓN HISTÓRICA EN ESCALA EQUILIBRADA
-- ============================================================
-- Migración idempotente y no destructiva: no modifica ninguna partida.
-- Los resultados balanced-v1 conservan sus puntos validados. Los resultados
-- anteriores se proyectan a la escala común según el máximo histórico de cada
-- juego, para que vuelvan a aparecer sin que un juego domine a los demás.

begin;

create or replace view public.coco_clasificacion_fuente_v153 as
with normalizadas as (
  select
    p.jugador,
    p.juego,
    case
      when p.puntuacion_version = 'balanced-v1'
        then least(115, greatest(0, p.puntos))
      when p.puntuacion_version is null then
        least(115, greatest(0, round(
          100::numeric
          * case p.juego
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
            end
          * least(1::numeric, greatest(0::numeric,
              p.puntos::numeric
              / case p.juego
                  when 'numeros' then 672
                  when 'calculo' then 840
                  when 'palabras' then 739
                  when 'series' then 907
                  when 'memoria' then 874
                  when 'sudoku' then 1075
                  when 'sopa' then 773
                  when 'crucigrama' then 320
                  when 'tiempo' then 320
                  when 'verdadero' then 320
                  when 'futbol' then 1300
                end::numeric
            ))
        )))::integer
    end as puntos
  from public.partidas p
  where p.juego in (
    'numeros','calculo','palabras','series','memoria','sudoku',
    'sopa','crucigrama','tiempo','verdadero','futbol'
  )
    and (p.puntuacion_version = 'balanced-v1' or p.puntuacion_version is null)
),
pivot as (
  select
    n.jugador as jugador_id,
    coalesce(sum(n.puntos) filter (where n.juego = 'numeros'), 0)::bigint as numeros,
    coalesce(sum(n.puntos) filter (where n.juego = 'calculo'), 0)::bigint as calculo,
    coalesce(sum(n.puntos) filter (where n.juego = 'palabras'), 0)::bigint as palabras,
    coalesce(sum(n.puntos) filter (where n.juego = 'series'), 0)::bigint as series,
    coalesce(sum(n.puntos) filter (where n.juego = 'memoria'), 0)::bigint as memoria,
    coalesce(sum(n.puntos) filter (where n.juego = 'sudoku'), 0)::bigint as sudoku,
    coalesce(sum(n.puntos) filter (where n.juego = 'sopa'), 0)::bigint as sopa,
    coalesce(sum(n.puntos) filter (where n.juego = 'crucigrama'), 0)::bigint as crucigrama,
    coalesce(sum(n.puntos) filter (where n.juego = 'tiempo'), 0)::bigint as tiempo,
    coalesce(sum(n.puntos) filter (where n.juego = 'verdadero'), 0)::bigint as verdadero,
    coalesce(sum(n.puntos) filter (where n.juego = 'futbol'), 0)::bigint as futbol,
    coalesce(max(n.puntos), 0)::integer as mejor,
    count(*)::bigint as partidas
  from normalizadas n
  group by n.jugador
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
  'balanced-v1 + histórico normalizado: clasificación comparable sin modificar las partidas originales.';

commit;

-- VALIDACIONES SOLO LECTURA
-- select count(*) from public.partidas;
-- select count(*) from public.coco_clasificacion_fuente_v153;
-- select * from public.coco_clasificacion_fuente_v153
-- where total <> numeros+calculo+palabras+series+memoria+sudoku+sopa+crucigrama+tiempo+verdadero+futbol;
