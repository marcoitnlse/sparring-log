import type { BoutFormat, TargetScore } from '../types/database'

export interface QuickLogDraft {
  opponentId: string
  fencerScore: number
  opponentScore: number
  targetScore: TargetScore
  boutDate: string
  showDatePicker: boolean
  boutFormat: BoutFormat
  showNotes: boolean
  notesWorked: string
  notesNotWorked: string
  notesOther: string
}

// Module-level so the Log screen's unsaved bout survives switching tabs,
// and so the Next tab can pick the opponent the Log form starts on.
// In-memory only: a full reload starts fresh.
let draft: Partial<QuickLogDraft> = {}

export function getQuickLogDraft(): Partial<QuickLogDraft> {
  return draft
}

export function saveQuickLogDraft(next: QuickLogDraft) {
  draft = next
}

export function setDraftOpponent(opponentId: string) {
  draft = { ...draft, opponentId }
}
