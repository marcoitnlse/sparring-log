import { describe, expect, it } from 'vitest'
import type { SessionFormPoint, WeeklyFormPoint } from './boutStats'
import {
  CHART,
  computeAxisLabels,
  createXScale,
  layoutTrendChart,
  weekX,
  yFor,
} from './trendChartLayout'

const LEFT = CHART.padLeft
const RIGHT = CHART.width - CHART.padRight

function session(date: string, overrides: Partial<SessionFormPoint> = {}): SessionFormPoint {
  return { date, wins: 1, losses: 1, winRatePct: 50, rollingWinRatePct: 50, isBreakFromPrevious: false, ...overrides }
}

function week(weekStart: string, winRatePct = 50): WeeklyFormPoint {
  return { weekStart, wins: 1, losses: 1, winRatePct }
}

// Two full Monday–Sunday weeks: 14 days across the plot.
const TWO_WEEKS = { start: '2026-11-02', end: '2026-11-15' }

describe('yFor', () => {
  it('puts 100% at the top of the plot and 0% at the bottom', () => {
    expect(yFor(100)).toBe(CHART.padTop)
    expect(yFor(0)).toBe(CHART.height - CHART.padBottom)
  })
})

describe('createXScale', () => {
  it('spans from the start of the first day to the end of the last day', () => {
    const scale = createXScale(TWO_WEEKS)
    expect(scale.totalDays).toBe(14)
    expect(scale.xForDate('2026-11-02')).toBe(LEFT)
    expect(scale.xForDay(14)).toBe(RIGHT)
    expect(scale.xForDate('2026-11-09')).toBe((LEFT + RIGHT) / 2) // day 7 of 14
  })
})

describe('weekX', () => {
  it('places a full week at midday Thursday', () => {
    const scale = createXScale(TWO_WEEKS)
    expect(weekX(scale, '2026-11-02')).toBe(scale.xForDay(3.5))
  })

  it("pins the current week to the right edge before it reaches Thursday", () => {
    // Period ends on Tuesday 2026-11-17; that week's Thursday is in the future.
    const scale = createXScale({ start: '2026-11-02', end: '2026-11-17' })
    expect(weekX(scale, '2026-11-16')).toBe(RIGHT)
  })
})

describe('computeAxisLabels', () => {
  it('labels both ends and the month starts in between', () => {
    const period = { start: '2026-09-14', end: '2026-12-20' }
    const labels = computeAxisLabels(period, createXScale(period))
    expect(labels.map((l) => [l.kind, l.date])).toEqual([
      ['start', '2026-09-14'],
      ['month', '2026-10-01'],
      ['month', '2026-11-01'],
      ['month', '2026-12-01'],
      ['end', '2026-12-20'],
    ])
    expect(labels[0].x).toBe(LEFT)
    expect(labels[labels.length - 1].x).toBe(RIGHT)
  })

  it('skips a month start that would crowd the start label', () => {
    // A 3M window: Sep 1 is only 8 days in, too close to the start label.
    const period = { start: '2026-08-24', end: '2026-11-26' }
    const labels = computeAxisLabels(period, createXScale(period))
    expect(labels.map((l) => l.date)).toEqual(['2026-08-24', '2026-10-01', '2026-11-01', '2026-11-26'])
  })

  it('drops a month start that would crowd the end label, keeping the end', () => {
    // Nov 1 is two days before the end of a 1M window.
    const period = { start: '2026-10-06', end: '2026-11-03' }
    const labels = computeAxisLabels(period, createXScale(period))
    expect(labels.map((l) => l.kind)).toEqual(['start', 'end'])
  })

  it('keeps labels at least the minimum gap apart', () => {
    const period = { start: '2024-01-01', end: '2026-11-26' } // "All" over ~3 years
    const labels = computeAxisLabels(period, createXScale(period))
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].x - labels[i - 1].x).toBeGreaterThanOrEqual(CHART.minLabelGap)
    }
  })
})

describe('layoutTrendChart', () => {
  it('places each session at midday of its date', () => {
    const layout = layoutTrendChart([session('2026-11-02'), session('2026-11-15')], [], TWO_WEEKS)
    const scale = createXScale(TWO_WEEKS)
    expect(layout.sessions.map((p) => p.x)).toEqual([scale.xForDay(0.5), scale.xForDay(13.5)])
  })

  it('splits session lines at a break, with a marker halfway between', () => {
    const layout = layoutTrendChart(
      [session('2026-11-02'), session('2026-11-03'), session('2026-11-14', { isBreakFromPrevious: true })],
      [],
      TWO_WEEKS,
    )
    expect(layout.sessionSegments.map((seg) => seg.map((p) => p.session.date))).toEqual([
      ['2026-11-02', '2026-11-03'],
      ['2026-11-14'],
    ])
    expect(layout.breakXs).toEqual([(layout.sessions[1].x + layout.sessions[2].x) / 2])
  })

  it('joins back-to-back weeks and breaks the weekly line at a week with no bouts', () => {
    const period = { start: '2026-11-02', end: '2026-11-29' }
    const layout = layoutTrendChart(
      [session('2026-11-02')],
      [week('2026-11-02', 40), week('2026-11-09', 60), week('2026-11-23', 80)], // no bouts week of 11-16
      period,
    )
    expect(layout.weekRuns.map((run) => run.map((w) => w.week.weekStart))).toEqual([
      ['2026-11-02', '2026-11-09'],
      ['2026-11-23'],
    ])
    expect(layout.weeks.map((w) => w.y)).toEqual([yFor(40), yFor(60), yFor(80)])
  })
})
