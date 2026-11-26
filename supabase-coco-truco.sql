-- The Data API exposes no room records to browsers. The Edge Function returns one seat's view.
create table public.coco_truco_rooms (
  code text primary key check(code ~ '^[A-F0-9]{12}$'),
  version integer not null default 0,
  state jsonb not null,
  creator_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 days'
);
alter table public.coco_truco_rooms enable row level security;
revoke all on public.coco_truco_rooms from public,anon,authenticated;
grant select,insert,update,delete on public.coco_truco_rooms to service_role;
create index coco_truco_expiry on public.coco_truco_rooms(expires_at);
create index coco_truco_creator on public.coco_truco_rooms(creator_hash,created_at);
create function public.coco_truco_create(room_code text,room_state jsonb,creator text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(creator,2161));
  delete from public.coco_truco_rooms where expires_at < now();
  if (select count(*) from public.coco_truco_rooms where creator_hash=creator and created_at>now()-interval '1 day') >= 30 then
    return false;
  end if;
  insert into public.coco_truco_rooms(code,state,creator_hash) values(room_code,room_state,creator)
    on conflict (code) do nothing;
  return found;
end;
$$;
revoke all on function public.coco_truco_create(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.coco_truco_create(text,jsonb,text) to service_role;
