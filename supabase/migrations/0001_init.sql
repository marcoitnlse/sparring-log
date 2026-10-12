-- Fencing Bout Tracker — initial schema
-- See DESIGN.md for the rationale behind these choices.

-- === profiles ===
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- auto-create a profile row when a user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- === opponents ===
create table public.opponents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index opponents_user_id_idx on public.opponents(user_id);

alter table public.opponents enable row level security;

create policy "opponents_all_own" on public.opponents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- === bouts ===
create table public.bouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references public.opponents(id) on delete restrict,
  weapon text not null default 'epee' check (weapon in ('epee', 'foil', 'sabre')),
  fencer_score integer not null check (fencer_score >= 0),
  opponent_score integer not null check (opponent_score >= 0),
  bout_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index bouts_user_date_idx on public.bouts(user_id, bout_date desc);
create index bouts_opponent_idx on public.bouts(opponent_id);

alter table public.bouts enable row level security;

create policy "bouts_all_own" on public.bouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- === win/loss aggregate view ===
-- security_invoker is required: without it the view runs with the owner's
-- privileges and bypasses RLS, leaking every user's stats to every user.
create view public.bout_stats
with (security_invoker = true)
as
select
  user_id,
  count(*) as total_bouts,
  count(*) filter (where fencer_score > opponent_score) as wins,
  count(*) filter (where fencer_score < opponent_score) as losses,
  count(*) filter (where fencer_score = opponent_score) as draws,
  round(
    100.0 * count(*) filter (where fencer_score > opponent_score)
      / nullif(count(*), 0), 1
  ) as win_rate_pct
from public.bouts
group by user_id;
