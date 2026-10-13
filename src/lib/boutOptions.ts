import type { BoutFormat, TargetScore } from '../types/database'

export const BOUT_FORMAT_OPTIONS: readonly { value: BoutFormat; label: string }[] = [
  { value: 'free', label: 'Free time' },
  { value: 'timed', label: 'Timed match' },
]

export const TARGET_SCORE_OPTIONS: readonly { value: TargetScore; label: string }[] = [
  { value: 5, label: 'To 5' },
  { value: 10, label: 'To 10' },
  { value: 15, label: 'To 15' },
]
