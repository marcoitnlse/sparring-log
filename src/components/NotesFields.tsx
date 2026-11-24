interface NotesFieldsProps {
  notesWorked: string
  onNotesWorkedChange: (value: string) => void
  notesNotWorked: string
  onNotesNotWorkedChange: (value: string) => void
  notesOther: string
  onNotesOtherChange: (value: string) => void
  autoFocus?: boolean
}

const FIELD_CLASSES =
  'w-full resize-none bg-transparent px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500'

/** One bordered card holding all three note fields, so it reads as a single
 * "Notes" section with structure rather than three unrelated inputs — only
 * the card has a border, each field is just a label + borderless textarea
 * separated by a divider. */
export function NotesFields({
  notesWorked,
  onNotesWorkedChange,
  notesNotWorked,
  onNotesNotWorkedChange,
  notesOther,
  onNotesOtherChange,
  autoFocus,
}: NotesFieldsProps) {
  return (
    <div className="divide-y divide-slate-200 rounded-lg border border-slate-300 dark:divide-slate-800 dark:border-slate-700">
      <div>
        <p className="px-4 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400">What worked</p>
        <textarea
          autoFocus={autoFocus}
          value={notesWorked}
          onChange={(e) => onNotesWorkedChange(e.target.value)}
          placeholder="Tactics or setups that landed…"
          rows={2}
          className={FIELD_CLASSES}
        />
      </div>
      <div>
        <p className="px-4 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400">What didn't work</p>
        <textarea
          value={notesNotWorked}
          onChange={(e) => onNotesNotWorkedChange(e.target.value)}
          placeholder="What they countered, or what to drop…"
          rows={2}
          className={FIELD_CLASSES}
        />
      </div>
      <div>
        <p className="px-4 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400">Other comments</p>
        <textarea
          value={notesOther}
          onChange={(e) => onNotesOtherChange(e.target.value)}
          placeholder="Anything else worth remembering…"
          rows={2}
          className={FIELD_CLASSES}
        />
      </div>
    </div>
  )
}
