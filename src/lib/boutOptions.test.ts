import { describe, expect, it } from 'vitest'
import {
  BOUT_CATEGORY_OPTIONS,
  BOUT_FORMAT_FILTER_OPTIONS,
  BOUT_FORMAT_LABELS,
  BOUT_FORMAT_OPTIONS,
  TARGET_SCORE_FILTER_OPTIONS,
  TARGET_SCORE_OPTIONS,
  TRAINING_FORMAT_OPTIONS,
  categoryOfBoutFormat,
} from './boutOptions'

describe('boutOptions', () => {
  it('BOUT_FORMAT_OPTIONS covers free, timed, and competition', () => {
    expect(BOUT_FORMAT_OPTIONS.map((o) => o.value)).toEqual(['free', 'timed', 'competition'])
  })

  it('BOUT_FORMAT_LABELS has a label for every format', () => {
    expect(BOUT_FORMAT_LABELS).toEqual({
      free: 'Free time',
      timed: 'Timed match',
      competition: 'Competition',
    })
  })

  it('TRAINING_FORMAT_OPTIONS only covers the sub-choices under Training', () => {
    expect(TRAINING_FORMAT_OPTIONS.map((o) => o.value)).toEqual(['free', 'timed'])
  })

  it('BOUT_CATEGORY_OPTIONS covers training and competition', () => {
    expect(BOUT_CATEGORY_OPTIONS.map((o) => o.value)).toEqual(['training', 'competition'])
  })

  it('categoryOfBoutFormat maps free/timed to training and competition to itself', () => {
    expect(categoryOfBoutFormat('free')).toBe('training')
    expect(categoryOfBoutFormat('timed')).toBe('training')
    expect(categoryOfBoutFormat('competition')).toBe('competition')
  })

  it('TARGET_SCORE_OPTIONS covers 5, 10, 15', () => {
    expect(TARGET_SCORE_OPTIONS.map((o) => o.value)).toEqual([5, 10, 15])
  })

  it('BOUT_FORMAT_FILTER_OPTIONS prepends "all" and "training" to the base options', () => {
    expect(BOUT_FORMAT_FILTER_OPTIONS[0]).toEqual({ value: 'all', label: 'All' })
    expect(BOUT_FORMAT_FILTER_OPTIONS[1]).toEqual({ value: 'training', label: 'Training' })
    expect(BOUT_FORMAT_FILTER_OPTIONS.slice(2)).toEqual(BOUT_FORMAT_OPTIONS)
  })

  it('TARGET_SCORE_FILTER_OPTIONS prepends an "all" option to the base options', () => {
    expect(TARGET_SCORE_FILTER_OPTIONS[0]).toEqual({ value: 'all', label: 'All' })
    expect(TARGET_SCORE_FILTER_OPTIONS.slice(1)).toEqual(TARGET_SCORE_OPTIONS)
  })
})
