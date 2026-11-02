-- Only safe room metadata is available to participants and Realtime.
-- Fleet placements are in a non-exposed schema, reached only by service-role RPCs.
create schema if not exists coco_naval_private;
revoke all on schema coco_naval_private from public, anon, authenticated;
grant usage on schema coco_naval_private to service_role;
create table public.coco_naval_rooms (
 id uuid primary key,
 invite_code text not null unique check(invite_code ~ '^[0-9A-F]{16}$'),
 host_user uuid not null references auth.users(id) on delete cascade,
 members uuid[] not null check(cardinality(members) between 1 and 2),
 status text not null check(status in ('waiting','placement','battle','finished','cancelled')),
 version integer not null default 0 check(version>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '7 days', deadline timestamptz,
 check(host_user=any(members))
);
create index coco_naval_members on public.coco_naval_rooms using gin(members);
create index coco_naval_host_recent on public.coco_naval_rooms(host_user,created_at desc);
create unique index coco_naval_waiting_host on public.coco_naval_rooms(host_user) where status='waiting';
alter table public.coco_naval_rooms enable row level security;
revoke all on public.coco_naval_rooms from public, anon, authenticated;
grant select on public.coco_naval_rooms to authenticated;
grant all on public.coco_naval_rooms to service_role;
create policy naval_member_read on public.coco_naval_rooms for select to authenticated
 using ((select auth.uid())=any(members) and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create table coco_naval_private.states (
 room_id uuid primary key references public.coco_naval_rooms(id) on delete cascade,
 state jsonb not null check(jsonb_typeof(state)='object' and octet_length(state::text)<60000)
);
alter table coco_naval_private.states enable row level security;
revoke all on coco_naval_private.states from public, anon, authenticated;
grant all on coco_naval_private.states to service_role;
create policy naval_server_only on coco_naval_private.states for all to service_role using(true) with check(true);

create function public.coco_naval_load(p_id uuid default null,p_code text default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('meta',to_jsonb(r),'state',s.state)
 from public.coco_naval_rooms r join coco_naval_private.states s on s.room_id=r.id
 where (p_id is not null and r.id=p_id) or (p_id is null and r.invite_code=p_code) limit 1;
$$;
revoke all on function public.coco_naval_load(uuid,text) from public,anon,authenticated;
grant execute on function public.coco_naval_load(uuid,text) to service_role;

create function public.coco_naval_save(p_id uuid,p_expected integer,p_members uuid[],p_status text,
 p_state jsonb,p_deadline timestamptz,p_host uuid default null,p_code text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.coco_naval_rooms;
begin
 if p_expected=-1 then
  -- Serialise creations by this host, including concurrent requests.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_host::text,311));
  if (select count(*) from public.coco_naval_rooms where host_user=p_host and created_at>now()-interval '1 day')>=12 then
   raise exception 'naval_daily_room_limit';
  end if;
  insert into public.coco_naval_rooms(id,invite_code,host_user,members,status,deadline)
   values(p_id,p_code,p_host,p_members,p_status,p_deadline) returning * into r;
  insert into coco_naval_private.states(room_id,state) values(p_id,p_state);
 else
  update public.coco_naval_rooms set members=p_members,status=p_status,deadline=p_deadline,
   version=version+1,updated_at=now() where id=p_id and version=p_expected returning * into r;
  if not found then return null; end if;
  update coco_naval_private.states set state=p_state where room_id=p_id;
  if not found then raise exception 'naval_state_missing'; end if;
 end if;
 return to_jsonb(r);
end;
$$;
revoke all on function public.coco_naval_save(uuid,integer,uuid[],text,jsonb,timestamptz,uuid,text) from public,anon,authenticated;
grant execute on function public.coco_naval_save(uuid,integer,uuid[],text,jsonb,timestamptz,uuid,text) to service_role;
alter publication supabase_realtime add table public.coco_naval_rooms;
