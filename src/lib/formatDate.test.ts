import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formats an ISO date as a short, readable date', () => {
    const result = formatDate('2026-03-05')
    // Exact punctuation/ordering depends on the runtime's default locale,
    // so check the pieces rather than the whole formatted string.
    expect(result).toContain('Mar')
    expect(result).toContain('5')
    expect(result).toContain('2026')
  })

  it('does not shift the date across a timezone boundary', () => {
    // Appending T00:00:00 (local time, not UTC) is what guards against the
    // classic "date string parses one day early/late" bug.
    expect(formatDate('2026-01-01')).toContain('1')
    expect(formatDate('2026-01-01')).not.toContain('Dec')
  })
})
