import type { BoutFormat, TargetScore } from '../types/database'

/** Label for every bout_format value, including "competition" which has
 * no dedicated sub-toggle (it's always timed). */
export const BOUT_FORMAT_OPTIONS: readonly { value: BoutFormat; label: string }[] = [
  { value: 'free', label: 'Free time' },
  { value: 'timed', label: 'Timed match' },
  { value: 'competition', label: 'Competition' },
]

export const BOUT_FORMAT_LABELS: Record<BoutFormat, string> = Object.fromEntries(
  BOUT_FORMAT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<BoutFormat, string>

/** Training sessions choose free/timed; competitions are always timed,
 * so that choice is hidden once "Competition" is picked at the top level. */
export type BoutCategory = 'training' | 'competition'

export const BOUT_CATEGORY_OPTIONS: readonly { value: BoutCategory; label: string }[] = [
  { value: 'training', label: 'Training' },
  { value: 'competition', label: 'Competition' },
]

export const TRAINING_FORMAT_OPTIONS: readonly { value: 'free' | 'timed'; label: string }[] = [
  { value: 'free', label: 'Free time' },
  { value: 'timed', label: 'Timed match' },
]

export function categoryOfBoutFormat(format: BoutFormat): BoutCategory {
  return format === 'competition' ? 'competition' : 'training'
}

export const TARGET_SCORE_OPTIONS: readonly { value: TargetScore; label: string }[] = [
  { value: 5, label: 'To 5' },
  { value: 10, label: 'To 10' },
  { value: 15, label: 'To 15' },
]

/** 'training' filters to either sub-format (free or timed) at once —
 * everything that isn't a competition. */
export type BoutFormatFilter = BoutFormat | 'all' | 'training'
export type TargetScoreFilter = TargetScore | 'all'

export const BOUT_FORMAT_FILTER_OPTIONS: readonly { value: BoutFormatFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'training', label: 'Training' },
  ...BOUT_FORMAT_OPTIONS,
]

export const TARGET_SCORE_FILTER_OPTIONS: readonly { value: TargetScoreFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...TARGET_SCORE_OPTIONS,
]
