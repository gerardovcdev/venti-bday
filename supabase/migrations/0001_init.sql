-- Venti b-day! schema
-- Single-room party game: trivia + WML + photo upload + wrapped recap

create table if not exists public.game (
	id text primary key,
	phase text not null default 'lobby' check (phase in ('lobby', 'trivia', 'wml', 'photo', 'wrapped')),
	current_round int not null default 0,
	reveal boolean not null default false,
	started_at timestamptz,
	finished_at timestamptz,
	config jsonb not null default '{}'::jsonb
);

create table if not exists public.players (
	id uuid primary key,
	game_id text not null references public.game(id) on delete cascade,
	name text not null,
	initials text not null,
	color text not null,
	is_ready boolean not null default false,
	joined_at timestamptz not null default now(),
	last_seen_at timestamptz not null default now()
);

create index if not exists idx_players_game on public.players(game_id);

create table if not exists public.trivia_answers (
	player_id uuid not null references public.players(id) on delete cascade,
	question_id text not null,
	answer text not null,
	is_correct boolean not null default false,
	answered_at timestamptz not null default now(),
	primary key (player_id, question_id)
);

create index if not exists idx_trivia_question on public.trivia_answers(question_id);

create table if not exists public.wml_votes (
	voter_id uuid not null references public.players(id) on delete cascade,
	round_id text not null,
	voted_for_id uuid not null references public.players(id) on delete cascade,
	voted_at timestamptz not null default now(),
	primary key (voter_id, round_id)
);

create index if not exists idx_wml_round on public.wml_votes(round_id);

create table if not exists public.photos (
	player_id uuid primary key references public.players(id) on delete cascade,
	storage_path text not null,
	uploaded_at timestamptz not null default now()
);

-- Realtime publication
alter publication supabase_realtime add table public.game;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.trivia_answers;
alter publication supabase_realtime add table public.wml_votes;
alter publication supabase_realtime add table public.photos;

-- RLS: open access via anon key for this private party app
alter table public.game enable row level security;
alter table public.players enable row level security;
alter table public.trivia_answers enable row level security;
alter table public.wml_votes enable row level security;
alter table public.photos enable row level security;

-- Permissive policies (party game, not security-sensitive data)
create policy "anyone can read game" on public.game for select using (true);
create policy "anyone can update game" on public.game for update using (true) with check (true);
create policy "anyone can insert game" on public.game for insert with check (true);

create policy "anyone can read players" on public.players for select using (true);
create policy "anyone can insert players" on public.players for insert with check (true);
create policy "anyone can update players" on public.players for update using (true) with check (true);

create policy "anyone can read answers" on public.trivia_answers for select using (true);
create policy "anyone can insert answers" on public.trivia_answers for insert with check (true);
create policy "anyone can update own answers" on public.trivia_answers for update using (true) with check (true);

create policy "anyone can read votes" on public.wml_votes for select using (true);
create policy "anyone can insert votes" on public.wml_votes for insert with check (true);
create policy "anyone can update votes" on public.wml_votes for update using (true) with check (true);

create policy "anyone can read photos" on public.photos for select using (true);
create policy "anyone can insert photos" on public.photos for insert with check (true);

-- Storage bucket setup (run separately in Supabase Studio if needed)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "anyone can upload photos" on storage.objects for insert
	to anon with check (bucket_id = 'photos');

create policy "anyone can read photos" on storage.objects for select
	to anon using (bucket_id = 'photos');

-- Seed the single game row
insert into public.game (id, phase) values ('venti-bday-2026', 'lobby')
on conflict (id) do nothing;
