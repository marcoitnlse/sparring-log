import { useState } from 'react'
import type { SessionFormPoint, TrendWindow, WeeklyFormPoint } from '../lib/boutStats'
import { loadTrendLines, saveTrendLines, toggleTrendLine, type TrendLine } from '../lib/trendLines'
import { parseIsoDate } from '../lib/isoDate'
import { CHART, Y_TICKS, layoutTrendChart, yFor, type AxisLabel } from '../lib/trendChartLayout'

function formatShortDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Month name, or the year for January so a multi-year "All" view still
 * reads unambiguously. Period ends show day and month. */
function formatAxisLabel({ date, kind }: AxisLabel): string {
  if (kind !== 'month') return formatShortDate(date)
  const d = parseIsoDate(date)
  return d.getMonth() === 0 ? String(d.getFullYear()) : d.toLocaleDateString(undefined, { month: 'short' })
}

const LABEL_ANCHOR: Record<AxisLabel['kind'], 'start' | 'middle' | 'end'> = {
  start: 'start',
  month: 'middle',
  end: 'end',
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

  const layout = layoutTrendChart(sessions, weeks, period)
  const midY = (CHART.padTop + (CHART.height - CHART.padBottom)) / 2

  return (
    <>
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="h-32 w-full"
        role="img"
        aria-label="Win rate trend across training sessions in the selected period"
      >
        {Y_TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={CHART.padLeft}
              x2={CHART.width - CHART.padRight}
              y1={yFor(tick)}
              y2={yFor(tick)}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1}
              strokeDasharray={tick === 50 ? '3 3' : undefined}
            />
            <text
              x={CHART.padLeft - 4}
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
          y={midY}
          textAnchor="middle"
          transform={`rotate(-90, 10, ${midY})`}
          className="fill-slate-400 text-[11px] dark:fill-slate-500"
        >
          % of wins
        </text>

        {layout.breakXs.map((x) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={CHART.padTop}
            y2={CHART.height - CHART.padBottom}
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        ))}

        {visible.sessions && layout.sessionSegments.map((segment) => (
          <polyline
            key={`raw-${segment[0].session.date}`}
            points={segment.map((p) => `${p.x},${yFor(p.session.winRatePct)}`).join(' ')}
            fill="none"
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth={1}
          />
        ))}
        {visible.rolling && layout.sessionSegments.map((segment) => (
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
          layout.weekRuns.map((run) => (
            <polyline
              key={`weekly-${run[0].week.weekStart}`}
              points={run.map(({ x, y }) => `${x},${y}`).join(' ')}
              fill="none"
              className="stroke-orange-500 dark:stroke-orange-400"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        {visible.weekly &&
          layout.weeks.map(({ week, x, y }) => {
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
        {visible.sessions && layout.sessions.map((p) => (
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

        {layout.labels.map((label) => (
          <text
            key={label.date}
            x={label.x}
            y={CHART.height - 4}
            textAnchor={LABEL_ANCHOR[label.kind]}
            className="fill-slate-400 text-[11px] dark:fill-slate-500"
          >
            {formatAxisLabel(label)}
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
