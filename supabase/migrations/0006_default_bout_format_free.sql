-- Most sparring is unstructured free exchange, not a formal timed bout —
-- flip the column default to match the app's new default selection.
alter table public.bouts
  alter column bout_format set default 'free';
