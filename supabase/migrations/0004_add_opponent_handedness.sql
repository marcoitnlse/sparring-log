-- Nullable (unknown until set): we don't want to silently assume a
-- handedness for existing/new opponents.
alter table public.opponents
  add column handedness text check (handedness in ('left', 'right'));
