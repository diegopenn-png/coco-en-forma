-- Private two-player rooms. Only the authenticated Edge Function may mutate state.
create table public.coco_chess_games (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique check (invite_code ~ '^[0-9A-F]{16}$'),
  white_user uuid not null references auth.users(id) on delete cascade,
  black_user uuid references auth.users(id) on delete cascade,
  white_name text not null check (length(white_name) between 1 and 40),
  black_name text check (length(black_name) between 1 and 40),
  status text not null default 'waiting' check (status in ('waiting','active','finished','cancelled')),
  pgn text not null default '' check (length(pgn) <= 50000),
  result text not null default '*' check (result in ('*','1-0','0-1','1/2-1/2')),
  end_reason text not null default '',
  version integer not null default 0 check (version >= 0),
  draw_offer uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  check (black_user is null or black_user <> white_user),
  check (status <> 'active' or black_user is not null),
  check (draw_offer is null or draw_offer in (white_user,black_user))
);
create index coco_chess_white_recent on public.coco_chess_games (white_user,updated_at desc);
create index coco_chess_black_recent on public.coco_chess_games (black_user,updated_at desc) where black_user is not null;
create unique index coco_chess_one_waiting on public.coco_chess_games (white_user) where status='waiting';
alter table public.coco_chess_games enable row level security;
revoke all on public.coco_chess_games from public, anon, authenticated;
grant select on public.coco_chess_games to authenticated;
grant all on public.coco_chess_games to service_role;
create policy chess_participants_read on public.coco_chess_games for select to authenticated
using (
  ((select auth.uid()) = white_user or (select auth.uid()) = black_user)
  and coalesce((select auth.jwt())->>'is_anonymous','false') = 'false'
);
-- Add only our table; never replace the project's existing publication.
alter publication supabase_realtime add table public.coco_chess_games;
