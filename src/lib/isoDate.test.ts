import { describe, expect, it } from 'vitest'
import { addDays, addMonths, daysBetween, mondayOf, toIsoDate } from './isoDate'

describe('isoDate', () => {
  it('formats a local date without UTC shifting', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('subtracts months, clamping to the shorter month', () => {
    expect(addMonths('2026-11-26', -3)).toBe('2026-08-26')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('finds the Monday of a Monday–Sunday week', () => {
    expect(mondayOf('2026-11-23')).toBe('2026-11-23') // Monday
    expect(mondayOf('2026-11-26')).toBe('2026-11-23') // Thursday
    expect(mondayOf('2026-11-29')).toBe('2026-11-23') // Sunday
    expect(mondayOf('2026-11-01')).toBe('2026-10-26') // Sunday, previous month
  })

  it('counts whole days, even across a daylight-saving change', () => {
    expect(daysBetween('2026-10-20', '2026-11-03')).toBe(14)
    expect(daysBetween('2026-03-25', '2026-04-01')).toBe(7)
  })
})
