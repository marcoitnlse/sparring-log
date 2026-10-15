import { describe, expect, it } from 'vitest'
import { HANDEDNESS_FILTER_OPTIONS, HANDEDNESS_OPTIONS } from './opponentOptions'

describe('opponentOptions', () => {
  it('HANDEDNESS_OPTIONS covers right and left (no "unknown")', () => {
    expect(HANDEDNESS_OPTIONS.map((o) => o.value)).toEqual(['right', 'left'])
  })

  it('HANDEDNESS_FILTER_OPTIONS prepends "all" to the base options', () => {
    expect(HANDEDNESS_FILTER_OPTIONS[0]).toEqual({ value: 'all', label: 'All' })
    expect(HANDEDNESS_FILTER_OPTIONS.slice(1)).toEqual(HANDEDNESS_OPTIONS)
  })
})
