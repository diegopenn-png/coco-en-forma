-- First completed result per game, account and Madrid day, as in the daily league.
create table public.coco_mesa_resultados (
 jugador uuid not null references auth.users(id) on delete cascade,
 juego text not null check (juego in ('ciudad','generala','naval')),
 partida uuid not null,
 dia date not null,
 puntos smallint not null check (puntos between 0 and 100),
 origen text not null check (origen in ('local','sala')),
 cuenta boolean not null default true,
 primary key (jugador,juego,partida)
);
create unique index coco_mesa_resultado_diario on public.coco_mesa_resultados(jugador,juego,dia) where cuenta;
alter table public.coco_mesa_resultados enable row level security;
revoke all on public.coco_mesa_resultados from public,anon,authenticated;
grant select on public.coco_mesa_resultados to authenticated;
create policy ver_resultado_propio on public.coco_mesa_resultados for select to authenticated using(jugador=(select auth.uid()));
create schema if not exists coco_mesa_private;
revoke all on schema coco_mesa_private from public,anon,authenticated;

create function coco_mesa_private.puntos(j text,s jsonb,asiento text)
returns integer language plpgsql immutable set search_path='' as $$
declare p jsonb; worth integer; homes integer; upgrades integer; shops integer; goals integer; n integer; hits integer; cats jsonb; k text; v integer;
begin
 if s->>'phase' is distinct from 'finished' then return null; end if;
 select x into p from jsonb_array_elements(s->'players') x where x->>'id'=asiento;
 if p is null then return null; end if;
 case j
 when 'ciudad' then
  if (s->>'round')::int is distinct from 13 or (s->>'rounds')::int is distinct from 12 then return null; end if;
  if jsonb_array_length(s->'players') not between 2 and 6 or (s->>'rollSeq')::int < 12*jsonb_array_length(s->'players')
    or jsonb_typeof(s->'properties') is distinct from 'object'
    or not (p ?& array['money','skill','experience','community','wellbeing','goal','salary']) then return null; end if;
  select coalesce(sum(floor(((property->>'paid')::numeric+150*(property->>'level')::int)/jsonb_array_length(property->'owners'))),0),
    count(*),coalesce(sum((property->>'level')::int),0),count(*) filter(where square in ('6','14','22','26','33'))
    into worth,homes,upgrades,shops from jsonb_each(s->'properties') prop(square,property) where property->'owners' ? asiento;
  worth:=worth+(p->>'money')::int;
  goals:=case (p->>'goal')::int
   when 0 then (homes>=3)::int+(upgrades>=1)::int+((p->>'wellbeing')::int>=4)::int
   when 1 then (shops>=2)::int+((p->>'skill')::int>=4)::int+((p->>'money')::int>=600)::int
   when 2 then ((p->>'experience')::int>=5)::int+((p->>'skill')::int>=3)::int+((p->>'wellbeing')::int>=5)::int
   when 3 then ((p->>'community')::int>=5)::int+(homes>=2)::int+((p->>'experience')::int>=3)::int
   when 4 then ((p->>'skill')::int>=6)::int+((p->>'salary')::int>=350)::int+((p->>'wellbeing')::int>=4)::int
   when 5 then ((p->>'money')::int>=1000)::int+((p->>'experience')::int>=4)::int+((p->>'community')::int>=4)::int end;
  if goals is null then return null; end if;
  return greatest(0,least(100,floor(worth/100.0)::int+2*(p->>'skill')::int+3*(p->>'experience')::int
    +3*(p->>'community')::int+2*(p->>'wellbeing')::int+15*goals));
 when 'generala' then
  if s->>'servedWinner' is not null then
   if s#>>'{rules,servedWins}' is distinct from 'true' or s->>'rolls' is distinct from '1'
     or jsonb_array_length(s->'dice') is distinct from 5
     or (select count(distinct x) from jsonb_array_elements_text(s->'dice') x)<>1
     or s#>>'{dice,0}' not in ('1','2','3','4','5','6') then return null; end if;
   return case when s->>'servedWinner'=asiento then 100 else 0 end;
  end if;
  cats:=p->'scores';
  if jsonb_typeof(cats) is distinct from 'object' or not (cats ?& array['1','2','3','4','5','6','straight','full','poker','generala','double']) then return null; end if;
  n:=0;
  for k,v in select key,value::int from jsonb_each_text(cats) loop
   if not (case when k in ('1','2','3','4','5','6') then v between 0 and 5*k::int and v%k::int=0
    when k='straight' then v in(0,20,25) when k='full' then v in(0,30,35)
    when k='poker' then v in(0,40,45) when k='generala' then v in(0,50)
    when k='double' then v=0 or (v=100 and cats->>'generala'='50') else false end) or v is null then return null; end if;
   n:=n+v;
  end loop;
  return round(n*100.0/360)::int;
 when 'naval' then
  if s->>'reason' is distinct from 'fleet' or s->>'winner' is null then return null; end if;
  select count(*) filter(where x->>'kind' in ('hit','sunk')),count(distinct x->>'cell')
   into hits,n from jsonb_array_elements(p->'shots') x;
  if hits>17 or jsonb_array_length(p->'shots') is distinct from n or n>100 or
     not exists(select 1 from jsonb_array_elements(s->'players') w where w->>'id'=s->>'winner' and
       (select count(*) from jsonb_array_elements(w->'shots') x where x->>'kind' in('hit','sunk'))=17) then return null; end if;
  return round(hits*100.0/17)::int;
 else return null;
 end case;
end $$;

create function coco_mesa_private.guardar(uid uuid,j text,part uuid,fecha date,pt integer,modo text)
returns void language plpgsql set search_path='' as $$
begin
 insert into public.coco_mesa_resultados values(uid,j,part,fecha,pt,modo,true) on conflict do nothing;
 if not found then
  insert into public.coco_mesa_resultados values(uid,j,part,fecha,pt,modo,false) on conflict do nothing;
 end if;
end $$;
create function coco_mesa_private.registrar_sala(j text,part uuid,miembros uuid[],s jsonb,fecha timestamptz)
returns void language sql set search_path='' as $$
 select coco_mesa_private.guardar(uid,j,part,(fecha at time zone 'Europe/Madrid')::date,pt,'sala')
 from unnest(miembros) uid cross join lateral (select coco_mesa_private.puntos(j,s,uid::text) pt) score
 where pt is not null order by uid;
$$;
create function coco_mesa_private.fin_sala() returns trigger language plpgsql security definer set search_path='' as $$
declare r public.coco_naval_rooms;
begin
 if tg_argv[0]='naval' then
  select * into strict r from public.coco_naval_rooms where id=new.room_id;
  perform coco_mesa_private.registrar_sala('naval',r.id,r.members,new.state,r.updated_at);
 else
  perform coco_mesa_private.registrar_sala(tg_argv[0],new.id,new.members,new.state,new.updated_at);
 end if;
 return new;
end $$;
create trigger clasificar_ciudad after update on public.coco_city_rooms for each row
 when (new.status='finished' and old.status is distinct from 'finished')
 execute function coco_mesa_private.fin_sala('ciudad');
create trigger clasificar_generala after update on public.coco_generala_rooms for each row
 when (new.status='finished' and old.status is distinct from 'finished')
 execute function coco_mesa_private.fin_sala('generala');
create trigger clasificar_naval after update on coco_naval_private.states for each row
 when (new.state->>'phase'='finished' and old.state->>'phase' is distinct from 'finished')
 execute function coco_mesa_private.fin_sala('naval');

create function public.coco_mesa_final_local(p_juego text,p_partida uuid,p_estado jsonb)
returns text language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); pt integer; hoy date:=(now() at time zone 'Europe/Madrid')::date;
begin
 if uid is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'login_required'; end if;
 if p_partida is null or length(p_estado::text)>150000 or p_juego not in ('ciudad','generala','naval') then raise exception 'invalid_match'; end if;
 pt:=coco_mesa_private.puntos(p_juego,p_estado,case when p_juego='naval' then 'you' else 'local-0' end);
 if pt is null then return 'incomplete'; end if;
 perform coco_mesa_private.guardar(uid,p_juego,p_partida,hoy,pt,'local');
 if exists(select 1 from public.coco_mesa_resultados where jugador=uid and juego=p_juego and partida=p_partida and cuenta) then return 'saved'; end if;
 return 'daily';
end $$;
revoke all on all functions in schema coco_mesa_private from public,anon,authenticated;
revoke all on function public.coco_mesa_final_local(text,uuid,jsonb) from public,anon;
grant execute on function public.coco_mesa_final_local(text,uuid,jsonb) to authenticated;

-- Include complete rooms still present at rollout, earliest finish first.
do $$ declare r record; begin
 for r in select 'ciudad' j,id,members,state,updated_at from public.coco_city_rooms where status='finished'
  union all select 'generala',id,members,state,updated_at from public.coco_generala_rooms where status='finished'
  union all select 'naval',n.id,n.members,s.state,n.updated_at from public.coco_naval_rooms n join coco_naval_private.states s on s.room_id=n.id where n.status='finished'
  order by updated_at,id loop
  perform coco_mesa_private.registrar_sala(r.j,r.id,r.members,r.state,r.updated_at);
 end loop;
end $$;
create or replace view public.coco_clasificacion_fuente_v153 as
 WITH normalizadas AS (
         SELECT p.jugador,
            p.juego,
                CASE
                    WHEN p.puntuacion_version = 'balanced-v1'::text THEN LEAST(115, GREATEST(0, p.puntos))
                    WHEN p.puntuacion_version IS NULL THEN LEAST(115::numeric, GREATEST(0::numeric, round(100::numeric *
                    CASE p.juego
                        WHEN 'numeros'::text THEN 0.98
                        WHEN 'calculo'::text THEN 1.02
                        WHEN 'palabras'::text THEN 0.99
                        WHEN 'series'::text THEN 1.01
                        WHEN 'memoria'::text THEN 1.00
                        WHEN 'sudoku'::text THEN 1.03
                        WHEN 'sopa'::text THEN 0.98
                        WHEN 'crucigrama'::text THEN 1.01
                        WHEN 'tiempo'::text THEN 0.99
                        WHEN 'verdadero'::text THEN 0.98
                        WHEN 'futbol'::text THEN 1.02
                        WHEN 'conecta'::text THEN 1.02
                        ELSE NULL::numeric
                    END * LEAST(1::numeric, GREATEST(0::numeric, p.puntos::numeric /
                    CASE p.juego
                        WHEN 'numeros'::text THEN 672
                        WHEN 'calculo'::text THEN 840
                        WHEN 'palabras'::text THEN 739
                        WHEN 'series'::text THEN 907
                        WHEN 'memoria'::text THEN 874
                        WHEN 'sudoku'::text THEN 1075
                        WHEN 'sopa'::text THEN 773
                        WHEN 'crucigrama'::text THEN 320
                        WHEN 'tiempo'::text THEN 320
                        WHEN 'verdadero'::text THEN 320
                        WHEN 'futbol'::text THEN 1300
                        WHEN 'conecta'::text THEN 110
                        ELSE NULL::integer
                    END::numeric)))))::integer
                    ELSE NULL::integer
                END AS puntos
           FROM public.partidas p
          WHERE (p.juego = ANY (ARRAY['ajedrez'::text, 'numeros'::text, 'calculo'::text, 'palabras'::text, 'series'::text, 'memoria'::text, 'sudoku'::text, 'sopa'::text, 'crucigrama'::text, 'tiempo'::text, 'verdadero'::text, 'futbol'::text, 'conecta'::text])) AND (p.puntuacion_version = 'balanced-v1'::text OR p.puntuacion_version IS NULL)
        UNION ALL
         SELECT coco_truco_diario.usuario,
            'truco'::text AS text,
            coco_truco_diario.puntos
           FROM public.coco_truco_diario
          WHERE coco_truco_diario.puntos IS NOT NULL
        UNION ALL
         SELECT jugador,juego,puntos FROM public.coco_mesa_resultados WHERE cuenta
        ), pivot AS (
         SELECT n.jugador AS jugador_id,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'numeros'::text), 0::bigint) AS numeros,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'calculo'::text), 0::bigint) AS calculo,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'palabras'::text), 0::bigint) AS palabras,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'series'::text), 0::bigint) AS series,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'memoria'::text), 0::bigint) AS memoria,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'sudoku'::text), 0::bigint) AS sudoku,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'sopa'::text), 0::bigint) AS sopa,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'crucigrama'::text), 0::bigint) AS crucigrama,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'tiempo'::text), 0::bigint) AS tiempo,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'verdadero'::text), 0::bigint) AS verdadero,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'futbol'::text), 0::bigint) AS futbol,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'conecta'::text), 0::bigint) AS conecta,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'ajedrez'::text), 0::bigint) AS ajedrez,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego = 'truco'::text), 0::bigint) AS truco,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego='ciudad'),0::bigint) AS ciudad,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego='generala'),0::bigint) AS generala,
            COALESCE(sum(n.puntos) FILTER (WHERE n.juego='naval'),0::bigint) AS naval,
            COALESCE(max(n.puntos), 0) AS mejor,
            count(*) AS partidas
           FROM normalizadas n
          GROUP BY n.jugador
        )
 SELECT pv.jugador_id,
    COALESCE(NULLIF(btrim(pr.apodo), ''::text), 'Jugador Coco'::text) AS apodo,
    pv.numeros,
    pv.calculo,
    pv.palabras,
    pv.series,
    pv.memoria,
    pv.sudoku,
    pv.sopa,
    pv.crucigrama,
    pv.tiempo,
    pv.verdadero,
    pv.futbol,
    pv.numeros + pv.calculo + pv.palabras + pv.series + pv.memoria + pv.sudoku + pv.sopa + pv.crucigrama + pv.tiempo + pv.verdadero + pv.futbol + pv.conecta + pv.ajedrez + pv.truco + pv.ciudad + pv.generala + pv.naval AS total,
    pv.mejor,
    pv.partidas,
    pv.conecta,
    pv.ajedrez,
    pv.truco, pv.ciudad, pv.generala, pv.naval
   FROM pivot pv
     LEFT JOIN public.perfiles pr ON pr.id = pv.jugador_id;
