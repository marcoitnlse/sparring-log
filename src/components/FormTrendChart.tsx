import type { SessionFormPoint } from '../lib/boutStats'

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

function toTimestamp(iso: string): number {
  return new Date(iso + 'T00:00:00').getTime()
}

function formatShortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatMonthOnly(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short' })
}

function monthOf(iso: string): number {
  return new Date(iso + 'T00:00:00').getMonth()
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

/** Sparkline of win-rate trend across recent training sessions: a smoothed
 * rolling-average line with each session's raw (noisier) ratio plotted as
 * a dot and a thin connecting line, so a single standout day doesn't get
 * hidden by the average. Points are spaced by actual elapsed time (not
 * just session order), and a training break — a gap longer than the data
 * already flags — shows as a gap in both lines rather than a line drawn
 * straight through it. */
export function FormTrendChart({ sessions }: { sessions: SessionFormPoint[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No sessions yet</p>
  }

  if (sessions.length === 1) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Log a few more sessions to see a trend.
      </p>
    )
  }

  const timestamps = sessions.map((s) => toTimestamp(s.date))
  const minT = timestamps[0]
  const maxT = timestamps[timestamps.length - 1]
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT

  const points: PlottedPoint[] = sessions.map((session, i) => ({
    session,
    x: PAD_LEFT + ((timestamps[i] - minT) / (maxT - minT)) * plotWidth,
  }))
  const segments = toSegments(points)

  // Always label the first and last point; in between, label each month
  // boundary crossed, skipping any that would sit too close to its
  // neighbor to stay readable.
  const labels: { x: number; text: string; anchor: 'start' | 'middle' | 'end' }[] = [
    { x: points[0].x, text: formatShortDate(sessions[0].date), anchor: 'start' },
  ]
  for (let i = 1; i < sessions.length - 1; i++) {
    if (monthOf(sessions[i].date) === monthOf(sessions[i - 1].date)) continue
    const x = points[i].x
    if (x - labels[labels.length - 1].x < MIN_LABEL_GAP) continue
    labels.push({ x, text: formatMonthOnly(sessions[i].date), anchor: 'middle' })
  }
  const lastX = points[points.length - 1].x
  const lastLabel = { x: lastX, text: formatShortDate(sessions[sessions.length - 1].date), anchor: 'end' as const }
  if (lastX - labels[labels.length - 1].x < MIN_LABEL_GAP) labels[labels.length - 1] = lastLabel
  else labels.push(lastLabel)

  const breakMidpoints = points
    .map((p, i) => (p.session.isBreakFromPrevious ? (p.x + points[i - 1].x) / 2 : null))
    .filter((x): x is number => x !== null)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-32 w-full"
      role="img"
      aria-label="Win rate trend across recent training sessions"
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

      {segments.map((segment) => (
        <polyline
          key={`raw-${segment[0].session.date}`}
          points={segment.map((p) => `${p.x},${yFor(p.session.winRatePct)}`).join(' ')}
          fill="none"
          className="stroke-slate-400 dark:stroke-slate-600"
          strokeWidth={1}
        />
      ))}
      {segments.map((segment) => (
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
      {points.map((p) => (
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
  )
}
