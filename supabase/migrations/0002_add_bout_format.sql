-- Adds a free/timed distinction to bouts: some sparring is unstructured
-- ("free" exchange), some is a formal timed bout with a clock.
alter table public.bouts
  add column bout_format text not null default 'timed'
    check (bout_format in ('free', 'timed'));
