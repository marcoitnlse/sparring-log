import type { Bout } from './boutsApi'

export type NoteColumn = 'notes_worked' | 'notes_not_worked' | 'notes_other'

export interface NoteCategory {
  column: NoteColumn
  label: string
  placeholder: string
}

export const NOTE_CATEGORIES: NoteCategory[] = [
  { column: 'notes_worked', label: 'What worked', placeholder: 'Tactics or setups that landed…' },
  { column: 'notes_not_worked', label: "What didn't work", placeholder: 'What they countered, or what to drop…' },
  { column: 'notes_other', label: 'Other comments', placeholder: 'Anything else worth remembering…' },
]

export interface DatedNote {
  boutId: string
  date: string
  text: string
}

export interface CategoryNotes {
  category: NoteCategory
  notes: DatedNote[]
}

/** Every note left on these bouts, grouped by category, each one keeping
 * its bout's date. Order follows `bouts`, which is newest first as fetched. */
export function groupNotesByCategory(bouts: Bout[]): CategoryNotes[] {
  return NOTE_CATEGORIES.map((category) => ({
    category,
    notes: bouts.flatMap((bout) => {
      const text = bout[category.column]?.trim()
      return text ? [{ boutId: bout.id, date: bout.bout_date, text }] : []
    }),
  }))
}
