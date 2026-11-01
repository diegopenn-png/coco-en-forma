-- Server-authoritative private 2–6 player rooms; unrelated to ranking or paid services.
create table public.coco_city_rooms (
 id uuid primary key default gen_random_uuid(),
 invite_code text not null unique check(invite_code ~ '^[0-9A-F]{16}$'),
 host_user uuid not null references auth.users(id) on delete cascade,
 members uuid[] not null check(cardinality(members) between 1 and 6),
 status text not null default 'waiting' check(status in ('waiting','active','finished','cancelled')),
 state jsonb not null check(jsonb_typeof(state)='object' and octet_length(state::text)<150000),
 version integer not null default 0 check(version>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 deadline timestamptz, expires_at timestamptz not null default now()+interval '30 days',
 check(host_user=any(members)), check(jsonb_array_length(state->'players')=cardinality(members))
);
create index coco_city_member_lookup on public.coco_city_rooms using gin(members);
create index coco_city_host_recent on public.coco_city_rooms(host_user,created_at desc);
create unique index coco_city_one_waiting on public.coco_city_rooms(host_user) where status='waiting';
alter table public.coco_city_rooms enable row level security;
revoke all on public.coco_city_rooms from public,anon,authenticated;
grant select on public.coco_city_rooms to authenticated;
grant all on public.coco_city_rooms to service_role;
create policy city_participant_read on public.coco_city_rooms for select to authenticated
 using ((select auth.uid())=any(members) and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
alter publication supabase_realtime add table public.coco_city_rooms;
