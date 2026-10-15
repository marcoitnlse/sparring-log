import type { BoutFormat } from '../types/database'
import { BOUT_CATEGORY_OPTIONS, TRAINING_FORMAT_OPTIONS, categoryOfBoutFormat } from '../lib/boutOptions'
import { SegmentedToggle } from './SegmentedToggle'

/** Two-level bout format picker: Training vs Competition at the top,
 * with Free time/Timed match offered as a sub-choice only under
 * Training — competitions are always timed, so there's nothing to
 * choose once "Competition" is picked. */
export function BoutFormatPicker({
  value,
  onChange,
}: {
  value: BoutFormat
  onChange: (format: BoutFormat) => void
}) {
  const category = categoryOfBoutFormat(value)
  const trainingFormat: 'free' | 'timed' = value === 'timed' ? 'timed' : 'free'

  return (
    <div className="flex flex-col items-center gap-2">
      <SegmentedToggle
        options={BOUT_CATEGORY_OPTIONS}
        value={category}
        onChange={(cat) => onChange(cat === 'competition' ? 'competition' : 'free')}
      />
      {category === 'training' && (
        <SegmentedToggle options={TRAINING_FORMAT_OPTIONS} value={trainingFormat} onChange={onChange} />
      )}
    </div>
  )
}
