-- Coco en Forma v150.0 — nueva línea construida exclusivamente desde v149.0
-- Clasificaciones completas y seguras para la clasificación general y las clasificaciones específicas.
-- Migración aditiva: no borra ni modifica partidas, perfiles o datos de Coco Pádel.
-- Ejecutar después de supabase-coco-v149.sql.

begin;

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
  with stats as (
    select
      p.jugador,
      coalesce(sum(p.puntos), 0)::bigint as puntos,
      coalesce(max(p.puntos), 0)::integer as mejor,
      count(*)::bigint as partidas
    from public.partidas p
    where p.juego in (
      'numeros', 'calculo', 'palabras', 'series', 'memoria', 'sudoku',
      'sopa', 'crucigrama', 'tiempo', 'verdadero', 'diferencias', 'cococorre'
    )
    group by p.jugador
  ), ranked as (
    select
      s.jugador,
      coalesce(nullif(btrim(pr.apodo), ''), 'Jugador Coco')::text as apodo,
      s.puntos,
      s.mejor,
      s.partidas,
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
    r.jugador,
    r.apodo,
    r.puntos,
    r.mejor,
    r.partidas,
    r.posicion,
    r.total_jugadores,
    (r.jugador = auth.uid()) as es_mio
  from ranked r
  where auth.uid() is not null
    and (
      r.posicion <= greatest(1, least(coalesce(p_limit, 50), 100))
      or r.jugador = auth.uid()
    )
  order by r.posicion asc, r.apodo asc;
$$;

revoke all on function public.clasificacion_general_coco(integer) from public, anon;
grant execute on function public.clasificacion_general_coco(integer) to authenticated;
comment on function public.clasificacion_general_coco(integer) is
  'Clasificación general de Coco en Forma: suma los 12 retos generales y devuelve la tabla completa sin exponer datos privados.';

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
      and p_juego in ('cocomed', 'futbol')
    group by p.jugador
  ), ranked as (
    select
      s.jugador,
      coalesce(nullif(btrim(pr.apodo), ''), 'Jugador Coco')::text as apodo,
      s.puntos,
      s.mejor,
      s.partidas,
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
    r.jugador,
    r.apodo,
    r.puntos,
    r.mejor,
    r.partidas,
    r.posicion,
    r.total_jugadores,
    (r.jugador = auth.uid()) as es_mio
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
comment on function public.clasificacion_juego_coco(text, integer) is
  'Clasificación específica de Coco Med o Coco Fútbol. No mezcla puntos con la clasificación general.';

commit;
