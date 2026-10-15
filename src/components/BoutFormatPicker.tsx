import { useEffect, useState } from 'react'
import type { BoutFormat } from '../types/database'
import { BOUT_CATEGORY_OPTIONS, TRAINING_FORMAT_OPTIONS, categoryOfBoutFormat } from '../lib/boutOptions'
import { SegmentedToggle } from './SegmentedToggle'

/** Two-level bout format picker: Training vs Competition at the top,
 * with Free time/Timed match offered as a sub-choice only under
 * Training — competitions are always timed, so there's nothing to
 * choose once "Competition" is picked. Remembers the last training
 * sub-format while Competition is selected, so switching Training ->
 * Competition -> Training doesn't silently reset a 'timed' bout to
 * 'free'. */
export function BoutFormatPicker({
  value,
  onChange,
}: {
  value: BoutFormat
  onChange: (format: BoutFormat) => void
}) {
  const category = categoryOfBoutFormat(value)
  const [lastTrainingFormat, setLastTrainingFormat] = useState<'free' | 'timed'>(value === 'timed' ? 'timed' : 'free')

  useEffect(() => {
    if (value !== 'competition') setLastTrainingFormat(value)
  }, [value])

  return (
    <div className="flex flex-col items-center gap-2">
      <SegmentedToggle
        options={BOUT_CATEGORY_OPTIONS}
        value={category}
        onChange={(cat) => {
          if (cat === category) return
          onChange(cat === 'competition' ? 'competition' : lastTrainingFormat)
        }}
      />
      {category === 'training' && (
        <SegmentedToggle options={TRAINING_FORMAT_OPTIONS} value={value === 'timed' ? 'timed' : 'free'} onChange={onChange} />
      )}
    </div>
  )
}
