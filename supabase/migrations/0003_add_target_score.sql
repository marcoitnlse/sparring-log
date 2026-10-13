-- Records what the bout was fenced to (common poule/DE targets).
alter table public.bouts
  add column target_score integer not null default 15
    check (target_score in (5, 10, 15));
