-- Competitions are always timed, so they're a third bout_format value
-- rather than a separate column: the app presents it as "Competition"
-- at the top level, with "Free time"/"Timed match" only offered as a
-- sub-choice under "Training".
alter table public.bouts
  drop constraint bouts_bout_format_check;

alter table public.bouts
  add constraint bouts_bout_format_check
    check (bout_format in ('free', 'timed', 'competition'));
