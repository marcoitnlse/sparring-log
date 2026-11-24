import { NOTE_CATEGORIES, type NoteColumn } from '../lib/boutNotes'

interface NotesFieldsProps {
  notesWorked: string
  onNotesWorkedChange: (value: string) => void
  notesNotWorked: string
  onNotesNotWorkedChange: (value: string) => void
  notesOther: string
  onNotesOtherChange: (value: string) => void
  autoFocus?: boolean
}

const LABEL_CLASSES = 'block px-4 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400'

const FIELD_CLASSES =
  'block w-full resize-none bg-transparent px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500'

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
  const fields: Record<NoteColumn, { value: string; onChange: (value: string) => void }> = {
    notes_worked: { value: notesWorked, onChange: onNotesWorkedChange },
    notes_not_worked: { value: notesNotWorked, onChange: onNotesNotWorkedChange },
    notes_other: { value: notesOther, onChange: onNotesOtherChange },
  }

  return (
    <div className="divide-y divide-slate-200 rounded-lg border border-slate-300 dark:divide-slate-800 dark:border-slate-700">
      {NOTE_CATEGORIES.map(({ column, label, placeholder }, i) => (
        <label key={column} className="block">
          <span className={LABEL_CLASSES}>{label}</span>
          <textarea
            autoFocus={autoFocus && i === 0}
            value={fields[column].value}
            onChange={(e) => fields[column].onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={FIELD_CLASSES}
          />
        </label>
      ))}
    </div>
  )
}
