-- Conecta colores: extensión aditiva del circuito diario, sin reescribir partidas.
begin;
do $patch$
declare d text; n text;
begin
  foreach n in array array['partidas_juego_valido','partidas_balanced_v1_integridad'] loop
    select pg_get_constraintdef(oid) into d from pg_constraint where conrelid='public.partidas'::regclass and conname=n;
    if d is null then raise exception 'Falta constraint %',n; end if;
    if position('conecta' in d)=0 then
      d:=replace(d,'ARRAY[','ARRAY[''conecta''::text, ');
      execute format('alter table public.partidas drop constraint %I',n);
      execute format('alter table public.partidas add constraint %I %s',n,d);
    end if;
  end loop;
  select pg_get_functiondef('public.registrar_partida_equilibrada_v160110(text,integer,smallint,numeric)'::regprocedure) into d;
  if position('conecta' in d)=0 then
    if position('when ''futbol'' then 1.02' in d)=0 then raise exception 'Contrato de puntuación inesperado'; end if;
    d:=replace(d,'when ''futbol'' then 1.02','when ''futbol'' then 1.02 when ''conecta'' then 1.02');
    execute d;
  end if;
end $patch$;
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
              when 'conecta' then 1.02
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
                  when 'conecta' then 110
                end::numeric
            ))
        )))::integer
    end as puntos
  from public.partidas p
  where p.juego in (
    'numeros','calculo','palabras','series','memoria','sudoku',
    'sopa','crucigrama','tiempo','verdadero','futbol','conecta'
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
    coalesce(sum(n.puntos) filter (where n.juego = 'conecta'), 0)::bigint as conecta,
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
    pv.sudoku + pv.sopa + pv.crucigrama + pv.tiempo + pv.verdadero + pv.futbol + pv.conecta
  )::bigint as total,
  pv.mejor,
  pv.partidas,
  pv.conecta
from pivot pv
left join public.perfiles pr on pr.id = pv.jugador_id;

revoke all on table public.coco_clasificacion_fuente_v153 from public, anon, authenticated;
comment on view public.coco_clasificacion_fuente_v153 is
  'balanced-v1 + histórico normalizado: clasificación comparable sin modificar las partidas originales.';


create or replace function public.clasificacion_global_v160122()
returns setof public.coco_clasificacion_fuente_v153
language sql stable security definer set search_path = ''
as $$ select f.* from public.coco_clasificacion_fuente_v153 f
where auth.uid() is not null order by f.total desc,f.apodo,f.jugador_id; $$;
revoke all on function public.clasificacion_global_v160122() from public,anon;
grant execute on function public.clasificacion_global_v160122() to authenticated;

-- La nueva misión no cambia retroactivamente las rachas ya ganadas.
alter table public.juegos_coco add column if not exists activo_desde date;
insert into public.juegos_coco(id,nombre,categoria,activo,cuenta_para_racha,orden,activo_desde)
values('conecta','Conecta colores','logica',true,true,12,(now() at time zone 'Europe/Madrid')::date)
on conflict(id) do update set nombre=excluded.nombre,categoria=excluded.categoria,activo=true,cuenta_para_racha=true;
do $patch$
declare d text;
begin
 select pg_get_functiondef('public.dia_coco_completo(uuid,date)'::regprocedure) into d;
 if position('activo_desde' in d)=0 then
  d:=replace(d,'and cuenta_para_racha = true;','and cuenta_para_racha = true and (activo_desde is null or p_fecha >= activo_desde);');
  d:=replace(d,'and j.cuenta_para_racha = true','and j.cuenta_para_racha = true and (j.activo_desde is null or p_fecha >= j.activo_desde)');
  if position('activo_desde' in d)=0 then raise exception 'Contrato de rachas inesperado'; end if;
  execute d;
 end if;
end $patch$;
notify pgrst, 'reload schema';
commit;
