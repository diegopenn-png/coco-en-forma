create table public.coco_truco_diario (
 usuario uuid not null references auth.users(id) on delete cascade,
 dia date not null default (now() at time zone 'Europe/Madrid')::date,
 version integer not null default 0, estado jsonb not null,
 puntos integer generated always as (case when estado->>'phase'='finished' then case when estado->>'matchWinner'='0' then 100 else 0 end end) stored,
 primary key(usuario,dia)
);
alter table public.coco_truco_diario enable row level security;
revoke all on public.coco_truco_diario from public,anon,authenticated;
grant select,insert,update on public.coco_truco_diario to service_role;
do $$
declare v text; updated text;
begin
 v:=pg_get_viewdef('public.coco_clasificacion_fuente_v153'::regclass,true);
 updated:=replace(v,'), pivot AS (',' UNION ALL SELECT usuario, ''truco''::text, puntos FROM public.coco_truco_diario WHERE puntos IS NOT NULL ), pivot AS (');
 if updated=v or position('pv.ajedrez AS total' in v)=0 then raise exception 'Unexpected ranking shape'; end if;
 updated:=replace(updated,'COALESCE(max(n.puntos)','COALESCE(sum(n.puntos) FILTER (WHERE n.juego=''truco''),0::bigint) AS truco, COALESCE(max(n.puntos)');
 updated:=replace(updated,'pv.ajedrez AS total','pv.ajedrez + pv.truco AS total');
 execute 'create or replace view public.coco_clasificacion_fuente_v153 as '||updated;
end $$;
