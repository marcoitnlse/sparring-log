import { useState } from 'react'
import type { SessionFormPoint, TrendWindow, WeeklyFormPoint } from '../lib/boutStats'
import { loadTrendLines, saveTrendLines, toggleTrendLine, type TrendLine } from '../lib/trendLines'
import { addDays, addMonths, daysBetween, parseIsoDate } from '../lib/isoDate'

const WIDTH = 300
const HEIGHT = 112
const PAD_LEFT = 34
const PAD_RIGHT = 6
const PAD_TOP = 10
const PAD_BOTTOM = 22
const MIN_LABEL_GAP = 36

const Y_TICKS = [0, 50, 100]

function yFor(pct: number): number {
  // pct is 0-100; higher win rate draws higher (smaller y).
  return PAD_TOP + (1 - pct / 100) * (HEIGHT - PAD_TOP - PAD_BOTTOM)
}

function formatShortDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Month name, or the year for January so a multi-year "All" view still
 * reads unambiguously. */
function formatMonthStart(iso: string): string {
  const d = parseIsoDate(iso)
  return d.getMonth() === 0 ? String(d.getFullYear()) : d.toLocaleDateString(undefined, { month: 'short' })
}

interface PlottedPoint {
  session: SessionFormPoint
  x: number
}

/** Splits sessions into line segments at each break — the connecting
 * lines (raw and rolling) shouldn't be drawn across a training layoff. */
function toSegments(points: PlottedPoint[]): PlottedPoint[][] {
  const segments: PlottedPoint[][] = []
  let current: PlottedPoint[] = []
  points.forEach((p, i) => {
    if (i > 0 && p.session.isBreakFromPrevious) {
      segments.push(current)
      current = []
    }
    current.push(p)
  })
  if (current.length > 0) segments.push(current)
  return segments
}

/** Splits weeks into runs of back-to-back weeks — a week with no bouts
 * breaks the weekly line rather than being bridged. */
function toWeekRuns(weeks: WeeklyFormPoint[]): WeeklyFormPoint[][] {
  const runs: WeeklyFormPoint[][] = []
  weeks.forEach((week, i) => {
    if (i > 0 && addDays(weeks[i - 1].weekStart, 7) === week.weekStart) runs[runs.length - 1].push(week)
    else runs.push([week])
  })
  return runs
}

const LEGEND: { line: TrendLine; label: string; swatch: string }[] = [
  { line: 'sessions', label: 'Sessions', swatch: 'h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500' },
  { line: 'rolling', label: '3-session avg', swatch: 'h-0.5 w-4 rounded bg-emerald-500 dark:bg-emerald-400' },
  { line: 'weekly', label: 'Weekly avg', swatch: 'h-0.5 w-4 rounded bg-orange-500 dark:bg-orange-400' },
]

/** Win-rate trend across training sessions in the selected period: a
 * smoothed rolling-average line with each session's raw (noisier) ratio
 * plotted as a dot and a thin connecting line, so a single standout day
 * doesn't get hidden by the average. The x-axis is the whole period, day
 * by day (each session sits mid-day), so empty stretches read as time
 * without fencing, and a training break shows as a gap in both lines
 * rather than a line drawn straight through it. An orange line adds the
 * Monday–Sunday weekly average, one point per week at its midpoint
 * (Thursday), joined only between back-to-back weeks.
 * The legend underneath doubles as on/off buttons for each line. */
export function FormTrendChart({
  sessions,
  weeks,
  period,
}: {
  sessions: SessionFormPoint[]
  weeks: WeeklyFormPoint[]
  period: TrendWindow
}) {
  const [visible, setVisible] = useState(loadTrendLines)

  function toggle(line: TrendLine) {
    const next = toggleTrendLine(visible, line)
    setVisible(next)
    saveTrendLines(next)
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No sessions in this period.</p>
  }

  // Day-based x scale: from the start of period.start to the end of period.end.
  const totalDays = daysBetween(period.start, period.end) + 1
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const xForDay = (dayOffset: number) => PAD_LEFT + (dayOffset / totalDays) * plotWidth
  const xForDate = (iso: string, withinDay = 0) => xForDay(daysBetween(period.start, iso) + withinDay)

  const points: PlottedPoint[] = sessions.map((session) => ({
    session,
    x: xForDate(session.date, 0.5),
  }))
  const segments = toSegments(points)

  // Each week is plotted at its midpoint — midday Thursday of Mon–Sun —
  // pinned to today while the current week hasn't reached Thursday yet.
  const weekPoint = (week: WeeklyFormPoint) => ({
    x: Math.min(xForDay(totalDays), xForDate(addDays(week.weekStart, 3), 0.5)),
    y: yFor(week.winRatePct),
  })
  const weekRuns = toWeekRuns(weeks)

  // Label both ends of the period, and each month start in between,
  // skipping any that would sit too close to a neighbor to stay readable.
  const labels: { x: number; text: string; anchor: 'start' | 'middle' | 'end' }[] = [
    { x: xForDay(0), text: formatShortDate(period.start), anchor: 'start' },
  ]
  const firstOfMonth = period.start.slice(0, 8) + '01'
  for (let month = addMonths(firstOfMonth, 1); month <= period.end; month = addMonths(month, 1)) {
    const x = xForDate(month)
    if (x - labels[labels.length - 1].x < MIN_LABEL_GAP) continue
    labels.push({ x, text: formatMonthStart(month), anchor: 'middle' })
  }
  const lastLabel = { x: xForDay(totalDays), text: formatShortDate(period.end), anchor: 'end' as const }
  while (labels.length > 1 && lastLabel.x - labels[labels.length - 1].x < MIN_LABEL_GAP) labels.pop()
  labels.push(lastLabel)

  const breakMidpoints = points
    .map((p, i) => (p.session.isBreakFromPrevious ? (p.x + points[i - 1].x) / 2 : null))
    .filter((x): x is number => x !== null)

  return (
    <>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-32 w-full"
        role="img"
        aria-label="Win rate trend across training sessions in the selected period"
      >
        {Y_TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yFor(tick)}
              y2={yFor(tick)}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1}
              strokeDasharray={tick === 50 ? '3 3' : undefined}
            />
            <text
              x={PAD_LEFT - 4}
              y={yFor(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-slate-400 text-[8px] dark:fill-slate-500"
            >
              {tick}%
            </text>
          </g>
        ))}
        <text
          x={10}
          y={(PAD_TOP + (HEIGHT - PAD_BOTTOM)) / 2}
          textAnchor="middle"
          transform={`rotate(-90, 10, ${(PAD_TOP + (HEIGHT - PAD_BOTTOM)) / 2})`}
          className="fill-slate-400 text-[11px] dark:fill-slate-500"
        >
          % of wins
        </text>

        {breakMidpoints.map((x) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        ))}

        {visible.sessions && segments.map((segment) => (
          <polyline
            key={`raw-${segment[0].session.date}`}
            points={segment.map((p) => `${p.x},${yFor(p.session.winRatePct)}`).join(' ')}
            fill="none"
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth={1}
          />
        ))}
        {visible.rolling && segments.map((segment) => (
          <polyline
            key={`rolling-${segment[0].session.date}`}
            points={segment.map((p) => `${p.x},${yFor(p.session.rollingWinRatePct)}`).join(' ')}
            fill="none"
            className="stroke-emerald-500 dark:stroke-emerald-400"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {visible.weekly &&
          weekRuns.map((run) => (
            <polyline
              key={`weekly-${run[0].weekStart}`}
              points={run
                .map(weekPoint)
                .map(({ x, y }) => `${x},${y}`)
                .join(' ')}
              fill="none"
              className="stroke-orange-500 dark:stroke-orange-400"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        {visible.weekly &&
          weeks.map((week) => {
            const { x, y } = weekPoint(week)
            return (
              <circle
                key={`weekly-${week.weekStart}`}
                cx={x}
                cy={y}
                r={2.5}
                className="fill-orange-500 dark:fill-orange-400"
              >
                <title>
                  Week of {formatShortDate(week.weekStart)}: {week.winRatePct}% ({week.wins}W-{week.losses}L)
                </title>
              </circle>
            )
          })}
        {visible.sessions && points.map((p) => (
          <circle
            key={p.session.date}
            cx={p.x}
            cy={yFor(p.session.winRatePct)}
            r={2.5}
            className="fill-slate-400 dark:fill-slate-500"
          >
            <title>
              {p.session.date}: {p.session.winRatePct}% ({p.session.wins}W-{p.session.losses}L)
            </title>
          </circle>
        ))}

        {labels.map((label) => (
          <text
            key={label.x}
            x={label.x}
            y={HEIGHT - 4}
            textAnchor={label.anchor}
            className="fill-slate-400 text-[11px] dark:fill-slate-500"
          >
            {label.text}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-x-1 gap-y-1">
        {LEGEND.map(({ line, label, swatch }) => (
          <button
            key={line}
            type="button"
            onClick={() => toggle(line)}
            aria-pressed={visible[line]}
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-slate-600 transition-opacity dark:text-slate-300 ${
              visible[line] ? '' : 'opacity-35'
            }`}
          >
            <span className={swatch} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
