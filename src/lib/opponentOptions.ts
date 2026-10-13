import type { Handedness } from '../types/database'

export const HANDEDNESS_OPTIONS: readonly { value: Handedness; label: string }[] = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
]

export type HandednessFilter = Handedness | 'all'

export const HANDEDNESS_FILTER_OPTIONS: readonly { value: HandednessFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...HANDEDNESS_OPTIONS,
]
