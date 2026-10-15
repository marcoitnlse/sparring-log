import type { Bout } from '../hooks/useBouts'

export type BoutOutcome = 'win' | 'loss'

export interface BoutStatsSummary {
  total: number
  wins: number
  losses: number
  winRatePct: number | null
  avgScored: number | null
  avgConceded: number | null
  avgMargin: number | null
  /** Newest first. */
  recentForm: BoutOutcome[]
}

/** A bout always has a winner — fencing resolves a tie via a sudden-death
 * touch, so logged scores are never equal (enforced in the DB too). */
export function outcomeOf(bout: Bout): BoutOutcome {
  return bout.fencer_score > bout.opponent_score ? 'win' : 'loss'
}

/** Pure aggregate over any subset of bouts — same function powers the
 * filtered analytics view and the per-opponent "last 5" summary. */
export function computeBoutStats(bouts: Bout[]): BoutStatsSummary {
  const total = bouts.length
  let wins = 0
  let losses = 0
  let scoredSum = 0
  let concededSum = 0

  for (const bout of bouts) {
    if (outcomeOf(bout) === 'win') wins++
    else losses++
    scoredSum += bout.fencer_score
    concededSum += bout.opponent_score
  }

  // `bouts` is assumed already sorted newest-first (as useBouts returns it).
  const recentForm = bouts.slice(0, 5).map(outcomeOf)

  return {
    total,
    wins,
    losses,
    winRatePct: total > 0 ? Math.round((wins / total) * 1000) / 10 : null,
    avgScored: total > 0 ? Math.round((scoredSum / total) * 10) / 10 : null,
    avgConceded: total > 0 ? Math.round((concededSum / total) * 10) / 10 : null,
    avgMargin: total > 0 ? Math.round(((scoredSum - concededSum) / total) * 10) / 10 : null,
    recentForm,
  }
}

/** Groups bouts by opponent, preserving each bout's relative order
 * (so every group stays newest-first, same as the input array). */
export function groupBoutsByOpponent(bouts: Bout[]): Map<string, Bout[]> {
  const byOpponent = new Map<string, Bout[]>()
  for (const bout of bouts) {
    const group = byOpponent.get(bout.opponent_id)
    if (group) group.push(bout)
    else byOpponent.set(bout.opponent_id, [bout])
  }
  return byOpponent
}
