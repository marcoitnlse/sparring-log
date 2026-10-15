-- Fencing resolves a tie with a sudden-death touch, so a logged bout always
-- has a winner — and neither side's score can exceed what the bout was
-- fenced to.
alter table public.bouts
  add constraint bouts_no_draw check (fencer_score <> opponent_score);

alter table public.bouts
  add constraint bouts_scores_within_target
  check (fencer_score <= target_score and opponent_score <= target_score);

-- Already unused — the app computes all stats client-side (src/lib/boutStats.ts)
-- — and it modeled draws, which no longer exist.
drop view if exists public.bout_stats;
