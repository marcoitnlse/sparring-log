import type { SessionFormPoint, TrendWindow, WeeklyFormPoint } from './boutStats'
import { addDays, addMonths, daysBetween } from './isoDate'

/** Geometry for the form trend chart, kept apart from the SVG so the
 * placement rules (where a session or week lands, where lines break,
 * which axis labels fit) can be unit-tested as plain numbers. */

export const CHART = {
  width: 300,
  height: 112,
  padLeft: 34,
  padRight: 6,
  padTop: 10,
  padBottom: 22,
  /** Narrowest gap (in viewBox units) between two axis labels. */
  minLabelGap: 36,
} as const

export const Y_TICKS = [0, 50, 100]

/** pct is 0-100; a higher win rate draws higher (smaller y). */
export function yFor(pct: number): number {
  return CHART.padTop + (1 - pct / 100) * (CHART.height - CHART.padTop - CHART.padBottom)
}

export interface XScale {
  /** Days in the period, counting both ends. */
  totalDays: number
  /** x for a fractional number of days after the start of the period. */
  xForDay: (dayOffset: number) => number
  /** x for a date, optionally partway through that day (0.5 = midday). */
  xForDate: (iso: string, withinDay?: number) => number
}

/** Day-based x scale from the start of `period.start` to the end of
 * `period.end`, so the whole period is visible even where nothing happened. */
export function createXScale(period: TrendWindow): XScale {
  const totalDays = daysBetween(period.start, period.end) + 1
  const plotWidth = CHART.width - CHART.padLeft - CHART.padRight
  const xForDay = (dayOffset: number) => CHART.padLeft + (dayOffset / totalDays) * plotWidth
  const xForDate = (iso: string, withinDay = 0) => xForDay(daysBetween(period.start, iso) + withinDay)
  return { totalDays, xForDay, xForDate }
}

export interface PlottedSession {
  session: SessionFormPoint
  /** Each session sits at midday of its date. */
  x: number
}

export interface PlottedWeek {
  week: WeeklyFormPoint
  x: number
  y: number
}

export interface AxisLabel {
  x: number
  date: string
  /** start/end are the period's ends; month marks the 1st of a month. */
  kind: 'start' | 'month' | 'end'
}

export interface TrendChartLayout {
  sessions: PlottedSession[]
  /** Sessions split at training breaks — lines aren't drawn across them. */
  sessionSegments: PlottedSession[][]
  /** x of a dashed marker halfway between the sessions either side of a break. */
  breakXs: number[]
  weeks: PlottedWeek[]
  /** Weeks split into runs of back-to-back weeks — a week with no bouts
   * breaks the weekly line rather than being bridged. */
  weekRuns: PlottedWeek[][]
  labels: AxisLabel[]
}

/** Splits sessions into line segments at each break. */
export function splitAtBreaks(points: PlottedSession[]): PlottedSession[][] {
  const segments: PlottedSession[][] = []
  points.forEach((p, i) => {
    if (i === 0 || p.session.isBreakFromPrevious) segments.push([p])
    else segments[segments.length - 1].push(p)
  })
  return segments
}

/** Splits weeks (oldest first) into runs of consecutive weeks. */
export function splitIntoWeekRuns(weeks: PlottedWeek[]): PlottedWeek[][] {
  const runs: PlottedWeek[][] = []
  weeks.forEach((w, i) => {
    if (i > 0 && addDays(weeks[i - 1].week.weekStart, 7) === w.week.weekStart) runs[runs.length - 1].push(w)
    else runs.push([w])
  })
  return runs
}

/** Each week is plotted at its midpoint — midday Thursday of Mon–Sun —
 * but pinned to the end of the period while the current week hasn't
 * reached Thursday yet, so it never lands off the right edge. */
export function weekX(scale: XScale, weekStart: string): number {
  return Math.min(scale.xForDay(scale.totalDays), scale.xForDate(addDays(weekStart, 3), 0.5))
}

/** Both ends of the period are always labelled; each month start in
 * between is labelled only if it isn't crowding the previous label. The
 * end label wins over any month label it would collide with. */
export function computeAxisLabels(period: TrendWindow, scale: XScale): AxisLabel[] {
  const labels: AxisLabel[] = [{ x: scale.xForDay(0), date: period.start, kind: 'start' }]
  const firstOfMonth = period.start.slice(0, 8) + '01'
  for (let month = addMonths(firstOfMonth, 1); month <= period.end; month = addMonths(month, 1)) {
    const x = scale.xForDate(month)
    if (x - labels[labels.length - 1].x < CHART.minLabelGap) continue
    labels.push({ x, date: month, kind: 'month' })
  }
  const end: AxisLabel = { x: scale.xForDay(scale.totalDays), date: period.end, kind: 'end' }
  while (labels.length > 1 && end.x - labels[labels.length - 1].x < CHART.minLabelGap) labels.pop()
  labels.push(end)
  return labels
}

export function layoutTrendChart(
  sessions: SessionFormPoint[],
  weeks: WeeklyFormPoint[],
  period: TrendWindow,
): TrendChartLayout {
  const scale = createXScale(period)

  const plottedSessions = sessions.map((session) => ({ session, x: scale.xForDate(session.date, 0.5) }))
  const breakXs = plottedSessions.flatMap((p, i) =>
    p.session.isBreakFromPrevious && i > 0 ? [(p.x + plottedSessions[i - 1].x) / 2] : [],
  )

  const plottedWeeks = weeks.map((week) => ({ week, x: weekX(scale, week.weekStart), y: yFor(week.winRatePct) }))

  return {
    sessions: plottedSessions,
    sessionSegments: splitAtBreaks(plottedSessions),
    breakXs,
    weeks: plottedWeeks,
    weekRuns: splitIntoWeekRuns(plottedWeeks),
    labels: computeAxisLabels(period, scale),
  }
}
