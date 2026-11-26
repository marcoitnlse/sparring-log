/** Helpers for plain `YYYY-MM-DD` calendar dates (how `bout_date` is
 * stored). Everything goes through local time — toISOString() would give
 * the UTC date, which is the wrong day for anyone near midnight outside UTC. */

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseIsoDate(iso: string): Date {
  return new Date(iso + 'T00:00:00')
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function addMonths(iso: string, months: number): string {
  const d = parseIsoDate(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  // Clamp: one month before Mar 31 is Feb 28/29, not Mar 2/3.
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return toIsoDate(d)
}

/** The Monday starting the Monday–Sunday week `iso` falls in. */
export function mondayOf(iso: string): string {
  const d = parseIsoDate(iso)
  const daysSinceMonday = (d.getDay() + 6) % 7 // getDay(): Sunday = 0
  return addDays(iso, -daysSinceMonday)
}

/** Whole days from `earlier` to `later` (negative if reversed). Rounded,
 * so a daylight-saving shift in between doesn't produce 6.958 days. */
export function daysBetween(earlier: string, later: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((parseIsoDate(later).getTime() - parseIsoDate(earlier).getTime()) / MS_PER_DAY)
}
