import { describe, expect, it } from 'vitest'
import { groupNotesByCategory, NOTE_CATEGORIES } from './boutNotes'
import { makeBout } from '../test/fixtures'

describe('groupNotesByCategory', () => {
  it('returns every category, in order, even with no notes', () => {
    const grouped = groupNotesByCategory([makeBout()])
    expect(grouped.map((g) => g.category.column)).toEqual(NOTE_CATEGORIES.map((c) => c.column))
    expect(grouped.every((g) => g.notes.length === 0)).toBe(true)
  })

  it('files each note under its category with its bout date, keeping input order', () => {
    const newer = makeBout({ id: 'b2', bout_date: '2026-11-20', notes_worked: 'flick', notes_other: 'tired' })
    const older = makeBout({ id: 'b1', bout_date: '2026-11-01', notes_worked: 'beat attack' })
    const [worked, notWorked, other] = groupNotesByCategory([newer, older])

    expect(worked.notes).toEqual([
      { boutId: 'b2', date: '2026-11-20', text: 'flick' },
      { boutId: 'b1', date: '2026-11-01', text: 'beat attack' },
    ])
    expect(notWorked.notes).toEqual([])
    expect(other.notes).toEqual([{ boutId: 'b2', date: '2026-11-20', text: 'tired' }])
  })

  it('skips notes that are only whitespace', () => {
    const [worked] = groupNotesByCategory([makeBout({ notes_worked: '   ' })])
    expect(worked.notes).toEqual([])
  })
})
