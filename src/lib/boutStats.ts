import type { Bout } from '../hooks/useBouts'
import type { BoutFormatFilter, TargetScoreFilter } from './boutOptions'
import { categoryOfBoutFormat } from './boutOptions'
import type { HandednessFilter } from './opponentOptions'
import { addMonths, daysBetween, mondayOf, todayIso } from './isoDate'

export type BoutOutcome = 'win' | 'loss'

export interface BoutFilters {
  opponentId: string
  format: BoutFormatFilter
  targetScore: TargetScoreFilter
  handedness: HandednessFilter
}

function matchesFormatFilter(bout: Bout, filter: BoutFormatFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'training') return categoryOfBoutFormat(bout.bout_format) === 'training'
  return bout.bout_format === filter
}

/** Narrows bouts down to whatever's currently selected on the Stats page —
 * each filter is "all" (no-op) or a specific value, combined with AND.
 * Pulled out of StatsPage and tested here since it's real logic (unlike
 * most of what's left in that component), and a bug in it would show up
 * as a quietly-wrong number with no visible error. */
export function filterBouts(bouts: Bout[], filters: BoutFilters): Bout[] {
  return bouts.filter(
    (b) =>
      (filters.opponentId === 'all' || b.opponent_id === filters.opponentId) &&
      matchesFormatFilter(b, filters.format) &&
      (filters.targetScore === 'all' || b.target_score === filters.targetScore) &&
      (filters.handedness === 'all' || b.opponent_handedness === filters.handedness),
  )
}

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

export interface SessionFormPoint {
  date: string
  wins: number
  losses: number
  /** Win ratio for this session alone, 0-100. */
  winRatePct: number
  /** Win ratio averaged over this session and up to the previous
   * `rollingWindowSize - 1` sessions — an expanding window until enough
   * history exists (or until a break resets it), then a trailing one.
   * Smooths out the noise of single low-bout-count sessions so a trend
   * is actually visible. */
  rollingWinRatePct: number
  /** True when more than `breakThresholdDays` passed since the previous
   * visible session — a training layoff, not just a quiet day. The
   * trend line shouldn't connect across it, and the rolling average
   * restarts here rather than blending pre- and post-break form. */
  isBreakFromPrevious: boolean
}

export interface SessionTrendOptions {
  /** Only sessions on or after this date (inclusive) are included. */
  since?: string
  /** How many sessions the rolling average smooths over. */
  rollingWindowSize?: number
  /** A gap longer than this many days counts as a training break. */
  breakThresholdDays?: number
}

/** One point per training session (bouts grouped by date), oldest first,
 * for charting a win-rate trend over the selected period (`since`). A
 * single session's raw ratio is noisy (a 2-bout day swings between
 * 0/50/100%), so each point also carries a rolling average — pooled over
 * bouts, not averaged per session, and reset across any training break so
 * a layoff doesn't blend stale pre-break form into the current trend. */
export function computeSessionFormTrend(bouts: Bout[], options: SessionTrendOptions = {}): SessionFormPoint[] {
  const { since, rollingWindowSize = 3, breakThresholdDays = 10 } = options

  const byDate = new Map<string, { wins: number; losses: number }>()
  for (const bout of bouts) {
    const entry = byDate.get(bout.bout_date) ?? { wins: 0, losses: 0 }
    if (outcomeOf(bout) === 'win') entry.wins++
    else entry.losses++
    byDate.set(bout.bout_date, entry)
  }

  const allSessions = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { wins, losses }]) => ({
      date,
      wins,
      losses,
      winRatePct: Math.round((wins / (wins + losses)) * 1000) / 10,
    }))

  const sessions = since ? allSessions.filter((session) => session.date >= since) : allSessions

  let segmentStart = 0
  return sessions.map((session, i) => {
    const isBreakFromPrevious =
      i > 0 && daysBetween(sessions[i - 1].date, session.date) > breakThresholdDays
    if (isBreakFromPrevious) segmentStart = i

    const window = sessions.slice(Math.max(segmentStart, i - rollingWindowSize + 1), i + 1)
    const windowWins = window.reduce((sum, s) => sum + s.wins, 0)
    const windowLosses = window.reduce((sum, s) => sum + s.losses, 0)
    return {
      ...session,
      rollingWinRatePct: Math.round((windowWins / (windowWins + windowLosses)) * 1000) / 10,
      isBreakFromPrevious,
    }
  })
}

export type TrendRange = '1m' | '3m' | '6m' | 'all'

export const TREND_RANGE_OPTIONS: readonly { value: TrendRange; label: string }[] = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: 'all', label: 'All' },
]

const RANGE_MONTHS: Record<Exclude<TrendRange, 'all'>, number> = { '1m': 1, '3m': 3, '6m': 6 }

/** The calendar span the trend chart covers, both ends inclusive. */
export interface TrendWindow {
  start: string
  end: string
}

/** Turns a range choice into dates. The start snaps back to a Monday so
 * the first weekly average covers a whole Monday–Sunday week rather than
 * a partial one. The end is today — or a later bout date, if one was
 * logged ahead — so the chart shows how long it's been since the last
 * session. "All" starts at the week of the earliest bout. */
export function computeTrendWindow(range: TrendRange, bouts: Bout[], today: string = todayIso()): TrendWindow {
  let latest = today
  let earliest = today
  for (const bout of bouts) {
    if (bout.bout_date > latest) latest = bout.bout_date
    if (bout.bout_date < earliest) earliest = bout.bout_date
  }
  const start = range === 'all' ? earliest : addMonths(today, -RANGE_MONTHS[range])
  return { start: mondayOf(start), end: latest }
}
