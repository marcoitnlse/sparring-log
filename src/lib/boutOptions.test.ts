import { describe, expect, it } from 'vitest'
import {
  BOUT_FORMAT_FILTER_OPTIONS,
  BOUT_FORMAT_OPTIONS,
  TARGET_SCORE_FILTER_OPTIONS,
  TARGET_SCORE_OPTIONS,
} from './boutOptions'

describe('boutOptions', () => {
  it('BOUT_FORMAT_OPTIONS covers free and timed', () => {
    expect(BOUT_FORMAT_OPTIONS.map((o) => o.value)).toEqual(['free', 'timed'])
  })

  it('TARGET_SCORE_OPTIONS covers 5, 10, 15', () => {
    expect(TARGET_SCORE_OPTIONS.map((o) => o.value)).toEqual([5, 10, 15])
  })

  it('filter variants prepend an "all" option to the base options', () => {
    expect(BOUT_FORMAT_FILTER_OPTIONS[0]).toEqual({ value: 'all', label: 'All' })
    expect(BOUT_FORMAT_FILTER_OPTIONS.slice(1)).toEqual(BOUT_FORMAT_OPTIONS)

    expect(TARGET_SCORE_FILTER_OPTIONS[0]).toEqual({ value: 'all', label: 'All' })
    expect(TARGET_SCORE_FILTER_OPTIONS.slice(1)).toEqual(TARGET_SCORE_OPTIONS)
  })
})
