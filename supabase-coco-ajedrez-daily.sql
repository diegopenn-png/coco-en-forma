-- One server-validated chess game per account and Europe/Madrid calendar day.
begin;
create table public.coco_chess_daily (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null default (now() at time zone 'Europe/Madrid')::date,
 pgn text not null default '' check (length(pgn)<=100000),
 status text not null default 'active' check(status in ('active','finished')),
 result text not null default '*' check(result in ('*','1-0','0-1','1/2-1/2')),
 end_reason text not null default '',
 version integer not null default 0 check(version>=0),
 points integer,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 finished_at timestamptz,
 unique(user_id,day),
 constraint daily_result_consistent check ((status='active' and result='*' and points is null and finished_at is null) or
  (status='finished' and result<>'*' and points is not null and points=case result when '1-0' then 100 when '1/2-1/2' then 50 else 0 end and finished_at is not null))
);
alter table public.coco_chess_daily enable row level security;
revoke all on public.coco_chess_daily from public,anon,authenticated;
grant select on public.coco_chess_daily to authenticated;
grant all on public.coco_chess_daily to service_role;
create policy daily_own_read on public.coco_chess_daily for select to authenticated
 using (user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');

alter table public.partidas add column ajedrez_dia date;
do $constraints$
declare item record;
begin
 for item in select conname,pg_get_constraintdef(oid) as definition from pg_constraint
  where conrelid='public.partidas'::regclass and conname in ('partidas_juego_valido','partidas_balanced_v1_integridad') loop
  execute format('alter table public.partidas drop constraint %I',item.conname);
  execute format('alter table public.partidas add constraint %I %s',item.conname,replace(item.definition,'ARRAY[','ARRAY[''ajedrez''::text, '));
 end loop;
end $constraints$;
alter table public.partidas add constraint partidas_ajedrez_diaria check (
 juego<>'ajedrez' or (puntuacion_version='balanced-v1' and ajedrez_dia is not null and dificultad=2 and
 puntos in (0,50,100) and rendimiento=puntos::numeric/100) is true
);
create unique index partidas_ajedrez_un_resultado_diario on public.partidas(jugador,ajedrez_dia) where juego='ajedrez';

-- SECURITY INVOKER + service_role only: neither public clients nor the generic score RPC can award chess points.
create function public.coco_chess_daily_commit(p_id uuid,p_user uuid,p_version integer,p_pgn text,p_result text,p_reason text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.coco_chess_daily; earned integer;
begin
 select * into r from public.coco_chess_daily where id=p_id and user_id=p_user for update;
 if not found or r.status<>'active' or r.version<>p_version or r.day<>(now() at time zone 'Europe/Madrid')::date then return null; end if;
 if p_result not in ('*','1-0','0-1','1/2-1/2') or p_result is null then raise exception 'Invalid result'; end if;
 earned:=case p_result when '1-0' then 100 when '1/2-1/2' then 50 when '0-1' then 0 else null end;
 update public.coco_chess_daily set pgn=p_pgn,result=p_result,end_reason=p_reason,version=version+1,
  status=case when p_result='*' then 'active' else 'finished' end,points=earned,updated_at=now(),
  finished_at=case when p_result='*' then null else now() end where id=r.id returning * into r;
 if earned is not null then
  insert into public.partidas(jugador,juego,puntos,puntuacion_version,dificultad,rendimiento,ajedrez_dia)
   values(p_user,'ajedrez',earned,'balanced-v1',2,earned::numeric/100,r.day);
 end if;
 return to_jsonb(r);
end $$;
revoke all on function public.coco_chess_daily_commit(uuid,uuid,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.coco_chess_daily_commit(uuid,uuid,integer,text,text,text) to service_role;

-- Preserve the existing normalized history and column order used by ranking RPCs.
do $ranking$
declare definition text;
begin
 definition:=pg_get_viewdef('public.coco_clasificacion_fuente_v153'::regclass,true);
 if position('pv.conecta AS total' in definition)=0 or position('pv.conecta'||chr(10)||'   FROM' in definition)=0 then
  raise exception 'Ranking definition changed: review before applying';
 end if;
 definition:=replace(definition,'ARRAY[','ARRAY[''ajedrez''::text, ');
 definition:=replace(definition,'COALESCE(max(n.puntos)', 'COALESCE(sum(n.puntos) FILTER (WHERE n.juego = ''ajedrez''::text), 0::bigint) AS ajedrez, COALESCE(max(n.puntos)');
 definition:=replace(definition,'pv.conecta AS total','pv.conecta + pv.ajedrez AS total');
 definition:=replace(definition,'pv.conecta'||chr(10)||'   FROM','pv.conecta, pv.ajedrez'||chr(10)||'   FROM');
 execute 'create or replace view public.coco_clasificacion_fuente_v153 as '||definition;
end $ranking$;
revoke all on public.coco_clasificacion_fuente_v153 from public,anon,authenticated;
insert into public.juegos_coco(id,nombre,categoria,activo,cuenta_para_racha,orden,activo_desde)
 values('ajedrez','Coco Ajedrez · Partida del día','logica',true,false,13,(now() at time zone 'Europe/Madrid')::date)
 on conflict(id) do update set nombre=excluded.nombre,activo=true,cuenta_para_racha=false;
commit;

