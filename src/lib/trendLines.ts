/** Which lines the form trend chart shows, chosen from its legend and
 * remembered per device. */
export type TrendLine = 'sessions' | 'rolling' | 'weekly'

export type TrendLineVisibility = Record<TrendLine, boolean>

export const DEFAULT_TREND_LINES: TrendLineVisibility = { sessions: true, rolling: true, weekly: false }

const STORAGE_KEY = 'sparringlog.trendLines'

export function loadTrendLines(): TrendLineVisibility {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TREND_LINES
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_TREND_LINES
    const stored = parsed as Partial<Record<TrendLine, unknown>>
    const merged = { ...DEFAULT_TREND_LINES }
    for (const line of Object.keys(DEFAULT_TREND_LINES) as TrendLine[]) {
      if (typeof stored[line] === 'boolean') merged[line] = stored[line]
    }
    return Object.values(merged).some(Boolean) ? merged : DEFAULT_TREND_LINES
  } catch {
    // Private browsing, blocked storage, or a corrupt value — use defaults.
    return DEFAULT_TREND_LINES
  }
}

export function saveTrendLines(visibility: TrendLineVisibility) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
  } catch {
    // Not remembered this time; the choice still applies until reload.
  }
}

/** Flips one line, except it won't hide the last visible one — the
 * chart should never go blank from a tap. */
export function toggleTrendLine(visibility: TrendLineVisibility, line: TrendLine): TrendLineVisibility {
  const next = { ...visibility, [line]: !visibility[line] }
  return Object.values(next).some(Boolean) ? next : visibility
}
