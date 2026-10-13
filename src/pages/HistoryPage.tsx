import { useState } from 'react'
import { useBouts } from '../hooks/useBouts'
import type { Bout } from '../hooks/useBouts'
import { ScoreStepper } from '../components/ScoreStepper'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { BOUT_FORMAT_OPTIONS, TARGET_SCORE_OPTIONS } from '../lib/boutOptions'

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function EditForm({ bout, onClose }: { bout: Bout; onClose: () => void }) {
  const { updateBout, deleteBout } = useBouts()
  const [fencerScore, setFencerScore] = useState(bout.fencer_score)
  const [opponentScore, setOpponentScore] = useState(bout.opponent_score)
  const [boutDate, setBoutDate] = useState(bout.bout_date)
  const [boutFormat, setBoutFormat] = useState(bout.bout_format)
  const [targetScore, setTargetScore] = useState(bout.target_score)
  const [notes, setNotes] = useState(bout.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateBout(bout.id, {
        fencerScore,
        opponentScore,
        boutDate,
        boutFormat,
        targetScore,
        notes: notes.trim() || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this bout? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteBout(bout.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center justify-center gap-8">
        <ScoreStepper label="You" value={fencerScore} onChange={setFencerScore} />
        <ScoreStepper label="Opponent" value={opponentScore} onChange={setOpponentScore} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <SegmentedToggle options={BOUT_FORMAT_OPTIONS} value={boutFormat} onChange={setBoutFormat} />
        <SegmentedToggle options={TARGET_SCORE_OPTIONS} value={targetScore} onChange={setTargetScore} />
      </div>
      <input
        type="date"
        value={boutDate}
        onChange={(e) => setBoutDate(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
        >
          Cancel
        </button>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="w-full rounded-lg py-2 text-sm font-medium text-red-600 disabled:opacity-50 dark:text-red-400"
      >
        {deleting ? 'Deleting…' : 'Delete bout'}
      </button>
    </div>
  )
}

export function HistoryPage() {
  const { bouts, loading } = useBouts()
  const [editingId, setEditingId] = useState<string | null>(null)

  if (loading) {
    return <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
  }

  if (bouts.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
        No bouts logged yet. Head to the Log tab to record your first one.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {bouts.map((bout) => {
        const won = bout.fencer_score > bout.opponent_score
        const drew = bout.fencer_score === bout.opponent_score
        return (
          <li key={bout.id}>
            <button
              type="button"
              onClick={() => setEditingId(editingId === bout.id ? null : bout.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-900"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{bout.opponent_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(bout.bout_date)} · {bout.bout_format === 'free' ? 'Free time' : 'Timed match'} · To{' '}
                  {bout.target_score}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-lg font-semibold ${
                    drew
                      ? 'text-slate-500 dark:text-slate-400'
                      : won
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {bout.fencer_score}–{bout.opponent_score}
                </span>
              </div>
            </button>
            {editingId === bout.id && <EditForm bout={bout} onClose={() => setEditingId(null)} />}
          </li>
        )
      })}
    </ul>
  )
}
