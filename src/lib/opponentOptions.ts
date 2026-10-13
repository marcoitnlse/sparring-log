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

/** For the opponent edit/add form, where "unknown" (null) is a real, pickable state. */
export type HandednessOrUnknown = Handedness | 'unknown'

export const HANDEDNESS_EDIT_OPTIONS: readonly { value: HandednessOrUnknown; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  ...HANDEDNESS_OPTIONS,
]
