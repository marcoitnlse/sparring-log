import { useState } from 'react'
import { useOpponents } from '../hooks/useOpponents'
import { useBouts } from '../hooks/useBouts'
import { ScoreStepper } from '../components/ScoreStepper'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { BOUT_FORMAT_OPTIONS, TARGET_SCORE_OPTIONS } from '../lib/boutOptions'
import type { BoutFormat, TargetScore } from '../types/database'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function QuickLogPage() {
  const { opponents } = useOpponents()
  const { createBout } = useBouts({ skipInitialFetch: true })

  const [opponentId, setOpponentId] = useState('')
  const [fencerScore, setFencerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [boutDate, setBoutDate] = useState(todayIso())
  const [boutFormat, setBoutFormat] = useState<BoutFormat>('timed')
  const [targetScore, setTargetScore] = useState<TargetScore>(15)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handleSave() {
    const selected = opponents.find((o) => o.id === opponentId)
    if (!selected || saving) return
    setSaving(true)
    try {
      await createBout({
        opponentId: selected.id,
        fencerScore,
        opponentScore,
        boutDate,
        boutFormat,
        targetScore,
        notes: notes.trim() || undefined,
      })
      setToast(`Bout logged: ${fencerScore}–${opponentScore} vs. ${selected.name}`)
      setTimeout(() => setToast(null), 2500)
      // Keep the opponent selected — sparring is usually several bouts in a row.
      setFencerScore(0)
      setOpponentScore(0)
      setNotes('')
      setShowNotes(false)
      setShowDatePicker(false)
      setBoutDate(todayIso())
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
        <ScoreStepper label="You" value={fencerScore} onChange={setFencerScore} />
        <span className="text-2xl font-light text-slate-300 dark:text-slate-700">–</span>
        <ScoreStepper label="Opponent" value={opponentScore} onChange={setOpponentScore} />
      </section>

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
        <SegmentedToggle options={BOUT_FORMAT_OPTIONS} value={boutFormat} onChange={setBoutFormat} />
        <SegmentedToggle options={TARGET_SCORE_OPTIONS} value={targetScore} onChange={setTargetScore} />
      </section>

      <section>
        {showNotes ? (
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering about this bout…"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
