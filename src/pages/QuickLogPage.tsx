import { useEffect, useState } from 'react'
import { useOpponents } from '../hooks/useOpponents'
import { useBouts } from '../hooks/useBouts'
import { useScoreForm } from '../hooks/useScoreForm'
import { ScoreStepper } from '../components/ScoreStepper'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { BoutFormatPicker } from '../components/BoutFormatPicker'
import { NotesFields } from '../components/NotesFields'
import { TARGET_SCORE_OPTIONS } from '../lib/boutOptions'
import { getErrorMessage } from '../lib/errors'
import { getQuickLogDraft, saveQuickLogDraft } from '../lib/quickLogDraft'
import { todayIso } from '../lib/isoDate'
import type { BoutFormat } from '../types/database'

export function QuickLogPage() {
  const { opponents } = useOpponents()
  const { createBout } = useBouts({ skipInitialFetch: true })
  const [draft] = useState(getQuickLogDraft)
  const scoreForm = useScoreForm(draft.fencerScore ?? 0, draft.opponentScore ?? 0, draft.targetScore ?? 15)

  const [opponentId, setOpponentId] = useState(draft.opponentId ?? '')
  const [showDatePicker, setShowDatePicker] = useState(draft.showDatePicker ?? false)
  // An untouched date means "today", so don't restore a stale one.
  const [boutDate, setBoutDate] = useState(draft.showDatePicker && draft.boutDate ? draft.boutDate : todayIso())
  const [boutFormat, setBoutFormat] = useState<BoutFormat>(draft.boutFormat ?? 'free')
  const [showNotes, setShowNotes] = useState(draft.showNotes ?? false)
  const [notesWorked, setNotesWorked] = useState(draft.notesWorked ?? '')
  const [notesNotWorked, setNotesNotWorked] = useState(draft.notesNotWorked ?? '')
  const [notesOther, setNotesOther] = useState(draft.notesOther ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { fencerScore, opponentScore, targetScore } = scoreForm
  useEffect(() => {
    saveQuickLogDraft({
      opponentId,
      fencerScore,
      opponentScore,
      targetScore,
      boutDate,
      showDatePicker,
      boutFormat,
      showNotes,
      notesWorked,
      notesNotWorked,
      notesOther,
    })
  }, [opponentId, fencerScore, opponentScore, targetScore, boutDate, showDatePicker, boutFormat, showNotes, notesWorked, notesNotWorked, notesOther])

  function showToast(message: string, durationMs = 2500) {
    setToast(message)
    setTimeout(() => setToast(null), durationMs)
  }

  async function handleSave() {
    const selected = opponents.find((o) => o.id === opponentId)
    if (!selected || saving) return
    if (!scoreForm.checkCanSave()) return
    setSaving(true)
    try {
      await createBout({
        opponentId: selected.id,
        fencerScore: scoreForm.fencerScore,
        opponentScore: scoreForm.opponentScore,
        boutDate,
        boutFormat,
        targetScore: scoreForm.targetScore,
        notesWorked: notesWorked.trim() || undefined,
        notesNotWorked: notesNotWorked.trim() || undefined,
        notesOther: notesOther.trim() || undefined,
      })
      showToast(`Bout logged: ${scoreForm.fencerScore}–${scoreForm.opponentScore} vs. ${selected.name}`)
      // Keep the opponent selected — sparring is usually several bouts in a row.
      scoreForm.resetScores(0, 0)
      setNotesWorked('')
      setNotesNotWorked('')
      setNotesOther('')
      setShowNotes(false)
      setShowDatePicker(false)
      setBoutDate(todayIso())
    } catch (e) {
      showToast(`Not saved: ${getErrorMessage(e, 'something went wrong')}`, 5000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-28">
      {toast && (
        <div className="fixed top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Opponent</h2>
        <select
          value={opponentId}
          onChange={(e) => setOpponentId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="" disabled>
            Who did you fence?
          </option>
          {opponents.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </section>

      <section className="flex items-center justify-center gap-8 rounded-xl bg-white py-6 shadow-sm dark:bg-slate-900">
        <ScoreStepper
          label="You"
          value={scoreForm.fencerScore}
          onChange={scoreForm.setFencerScore}
          max={scoreForm.targetScore}
        />
        <span className="text-2xl font-light text-slate-300 dark:text-slate-700">–</span>
        <ScoreStepper
          label="Opponent"
          value={scoreForm.opponentScore}
          onChange={scoreForm.setOpponentScore}
          max={scoreForm.targetScore}
        />
      </section>

      {scoreForm.showDrawError && scoreForm.isDraw && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          Scores can't be equal — fencing resolves a tie with a sudden-death touch.
        </p>
      )}

      <section className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-full bg-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Épée
        </div>

        {showDatePicker ? (
          <input
            type="date"
            value={boutDate}
            onChange={(e) => setBoutDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className="text-sm text-slate-500 underline underline-offset-2 dark:text-slate-400"
          >
            {boutDate === todayIso() ? 'Today' : boutDate}
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <BoutFormatPicker value={boutFormat} onChange={setBoutFormat} />
        <SegmentedToggle options={TARGET_SCORE_OPTIONS} value={scoreForm.targetScore} onChange={scoreForm.setTargetScore} />
      </section>

      <section>
        {showNotes ? (
          <NotesFields
            notesWorked={notesWorked}
            onNotesWorkedChange={setNotesWorked}
            notesNotWorked={notesNotWorked}
            onNotesNotWorkedChange={setNotesNotWorked}
            notesOther={notesOther}
            onNotesOtherChange={setNotesOther}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="text-sm text-slate-500 underline underline-offset-2 dark:text-slate-400"
          >
            + Add note
          </button>
        )}
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={!opponentId || saving}
        className="fixed inset-x-4 bottom-20 rounded-xl bg-slate-900 py-4 text-lg font-semibold text-white shadow-lg disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
      >
        {saving ? 'Saving…' : 'Save bout'}
      </button>
    </div>
  )
}
