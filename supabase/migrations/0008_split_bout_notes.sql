-- Split the single free-text bout note into three fixed fields, so a bout
-- can record what worked, what didn't, and anything else, instead of one
-- undifferentiated blob. Existing notes are kept, moved into notes_other.
alter table public.bouts
  add column notes_worked text null,
  add column notes_not_worked text null,
  add column notes_other text null;

update public.bouts
  set notes_other = notes
  where notes is not null;

alter table public.bouts
  drop column notes;
