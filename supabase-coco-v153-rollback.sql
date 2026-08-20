-- COCO EN FORMA v153.0 — rollback de clasificación
-- No borra datos. Devuelve el criterio de v150/v152 (sin Fútbol en general y con Coco Corre/Diferencias).
begin;

drop function if exists public.clasificacion_global_v153();
drop view if exists public.coco_clasificacion_fuente_v153;

create or replace function public.clasificacion_general_coco(p_limit integer default 50)
returns table (jugador uuid, apodo text, puntos bigint, mejor integer, partidas bigint, posicion bigint, total_jugadores bigint, es_mio boolean)
language sql stable security definer set search_path = public, pg_temp as $$
with stats as (
  select p.jugador,coalesce(sum(p.puntos),0)::bigint puntos,coalesce(max(p.puntos),0)::integer mejor,count(*)::bigint partidas
  from public.partidas p
  where p.juego in ('numeros','calculo','palabras','series','memoria','sudoku','sopa','crucigrama','tiempo','verdadero','diferencias','cococorre')
  group by p.jugador
), ranked as (
  select s.jugador,coalesce(nullif(btrim(pr.apodo),''),'Jugador Coco')::text apodo,s.puntos,s.mejor,s.partidas,
         rank() over(order by s.puntos desc,s.mejor desc,s.partidas asc,coalesce(nullif(btrim(pr.apodo),''),'Jugador Coco') asc,s.jugador asc)::bigint posicion,
         count(*) over()::bigint total_jugadores
  from stats s left join public.perfiles pr on pr.id=s.jugador
)
select r.jugador,r.apodo,r.puntos,r.mejor,r.partidas,r.posicion,r.total_jugadores,(r.jugador=auth.uid()) es_mio
from ranked r
where auth.uid() is not null and (r.posicion<=greatest(1,least(coalesce(p_limit,50),100)) or r.jugador=auth.uid())
order by r.posicion,r.apodo;
$$;

create or replace function public.clasificacion_juego_coco(p_juego text,p_limit integer default 50)
returns table (jugador uuid, apodo text, puntos bigint, mejor integer, partidas bigint, posicion bigint, total_jugadores bigint, es_mio boolean)
language sql stable security definer set search_path = public, pg_temp as $$
with stats as (
  select p.jugador,coalesce(sum(p.puntos),0)::bigint puntos,coalesce(max(p.puntos),0)::integer mejor,count(*)::bigint partidas
  from public.partidas p where p.juego=p_juego and p_juego in ('cocomed','futbol') group by p.jugador
), ranked as (
  select s.jugador,coalesce(nullif(btrim(pr.apodo),''),'Jugador Coco')::text apodo,s.puntos,s.mejor,s.partidas,
         rank() over(order by s.puntos desc,s.mejor desc,s.partidas asc,coalesce(nullif(btrim(pr.apodo),''),'Jugador Coco') asc,s.jugador asc)::bigint posicion,
         count(*) over()::bigint total_jugadores
  from stats s left join public.perfiles pr on pr.id=s.jugador
)
select r.jugador,r.apodo,r.puntos,r.mejor,r.partidas,r.posicion,r.total_jugadores,(r.jugador=auth.uid()) es_mio
from ranked r
where auth.uid() is not null and (r.posicion<=greatest(1,least(coalesce(p_limit,50),100)) or r.jugador=auth.uid())
order by r.posicion,r.apodo;
$$;

revoke all on function public.clasificacion_general_coco(integer) from public, anon;
grant execute on function public.clasificacion_general_coco(integer) to authenticated;
revoke all on function public.clasificacion_juego_coco(text,integer) from public, anon;
grant execute on function public.clasificacion_juego_coco(text,integer) to authenticated;

commit;
