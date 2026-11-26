import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_TREND_LINES, loadTrendLines, saveTrendLines, toggleTrendLine } from './trendLines'

describe('trendLines', () => {
  afterEach(() => localStorage.clear())

  it('starts with the session dots and 3-session average, weekly off', () => {
    expect(loadTrendLines()).toEqual({ sessions: true, rolling: true, weekly: false })
  })

  it('remembers a saved choice', () => {
    saveTrendLines({ sessions: false, rolling: false, weekly: true })
    expect(loadTrendLines()).toEqual({ sessions: false, rolling: false, weekly: true })
  })

  it('falls back to defaults for corrupt or all-off stored values', () => {
    localStorage.setItem('sparringlog.trendLines', 'not json')
    expect(loadTrendLines()).toEqual(DEFAULT_TREND_LINES)
    localStorage.setItem('sparringlog.trendLines', JSON.stringify({ sessions: false, rolling: false, weekly: false }))
    expect(loadTrendLines()).toEqual(DEFAULT_TREND_LINES)
  })

  it('toggles a line but never hides the last visible one', () => {
    const weeklyOn = toggleTrendLine(DEFAULT_TREND_LINES, 'weekly')
    expect(weeklyOn.weekly).toBe(true)
    const onlyRolling = { sessions: false, rolling: true, weekly: false }
    expect(toggleTrendLine(onlyRolling, 'rolling')).toBe(onlyRolling)
  })
})
