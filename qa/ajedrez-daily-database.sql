begin;
do $qa$
declare u uuid; r uuid; v jsonb; result text; points integer; n integer; q jsonb;
begin
 foreach result in array array['1-0','1/2-1/2','0-1'] loop
  u:=gen_random_uuid();
  insert into auth.users(id,email,raw_user_meta_data) values(u,'chess-qa-'||u::text||'@example.invalid',jsonb_build_object('apodo','Prueba ajedrez '||left(u::text,8)));
  insert into public.coco_chess_daily(user_id) values(u) returning id into r;
  v:=public.coco_chess_daily_commit(r,u,0,'','*',''); assert (v->>'version')::integer=1;
  assert not exists(select 1 from public.partidas where jugador=u);
  assert public.coco_chess_daily_commit(r,u,0,'',result,'QA') is null;
  v:=public.coco_chess_daily_commit(r,u,1,'',result,'QA');
  points:=case result when '1-0' then 100 when '1/2-1/2' then 50 else 0 end;
  assert (v->>'points')::integer=points;
  assert public.coco_chess_daily_commit(r,u,2,'',result,'QA duplicate') is null;
  select count(*) into n from public.partidas where jugador=u and juego='ajedrez'; assert n=1;
  select to_jsonb(f) into q from public.coco_clasificacion_fuente_v153 f where jugador_id=u;
  assert (q->>'ajedrez')::integer=points and (q->>'total')::integer=points and (q->>'partidas')::integer=1;
  perform set_config('request.jwt.claim.sub',u::text,true);
  select to_jsonb(f) into q from public.clasificacion_global_v160122() f where jugador_id=u;
  assert (q->>'ajedrez')::integer=points;
  select to_jsonb(f) into q from public.clasificacion_general_coco(50) f where jugador=u;
  assert (q->>'puntos')::integer=points and (q->>'partidas')::integer=1;
  begin
   insert into public.coco_chess_daily(user_id) values(u);
   raise exception 'Duplicate daily game was accepted';
  exception when unique_violation then null; end;
 end loop;
 assert not has_function_privilege('authenticated','public.coco_chess_daily_commit(uuid,uuid,integer,text,text,text)','execute');
 assert not has_function_privilege('anon','public.coco_chess_daily_commit(uuid,uuid,integer,text,text,text)','execute');
 assert not has_table_privilege('authenticated','public.coco_chess_daily','insert,update,delete');
 assert (select relrowsecurity from pg_class where oid='public.coco_chess_daily'::regclass);
 perform set_config('chess.qa.uid',u::text,true);
end $qa$;
set local role authenticated;
do $rls$
begin
 assert (select count(*) from public.coco_chess_daily)=1;
 begin
  insert into public.partidas(jugador,juego,puntos,puntuacion_version,dificultad,rendimiento,ajedrez_dia)
  values(auth.uid(),'ajedrez',100,'balanced-v1',2,1,current_date+1);
  raise exception 'Direct forged score was accepted';
 exception when insufficient_privilege then null; end;
end $rls$;
reset role;
rollback;
select 'PASS: 100/50/0, one result, stale rejection, both rankings, own-row RLS and denied forged scores. Transaction rolled back.' as verification;
