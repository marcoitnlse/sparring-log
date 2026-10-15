import { Fragment, useState } from 'react'
import { useBoutHistory } from '../hooks/useBoutHistory'
import type { Bout } from '../lib/boutsApi'
import { ScoreStepper } from '../components/ScoreStepper'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { BOUT_FORMAT_OPTIONS, TARGET_SCORE_OPTIONS } from '../lib/boutOptions'
import { formatDate } from '../lib/formatDate'

interface EditFormProps {
  bout: Bout
  onUpdate: ReturnType<typeof useBoutHistory>['updateBout']
  onDelete: ReturnType<typeof useBoutHistory>['deleteBout']
  onClose: () => void
}

function EditForm({ bout, onUpdate, onDelete, onClose }: EditFormProps) {
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
      await onUpdate(bout.id, {
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
      await onDelete(bout.id)
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
  const { bouts, loading, loadingMore, hasMore, loadMore, error, updateBout, deleteBout } = useBoutHistory()
  const [editingId, setEditingId] = useState<string | null>(null)

  if (loading) {
    return <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
  }

  if (error && bouts.length === 0) {
    return <p className="p-4 text-sm text-red-600 dark:text-red-400">Couldn't load history: {error}</p>
  }

  if (bouts.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
        No bouts logged yet. Head to the Log tab to record your first one.
      </p>
    )
  }

  let lastDate = ''

  return (
    <div className="pb-6">
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {bouts.map((bout) => {
          const isNewDate = bout.bout_date !== lastDate
          lastDate = bout.bout_date
          const won = bout.fencer_score > bout.opponent_score
          const drew = bout.fencer_score === bout.opponent_score

          return (
            <Fragment key={bout.id}>
              {isNewDate && (
                <li className="bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  {formatDate(bout.bout_date)}
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === bout.id ? null : bout.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-900"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{bout.opponent_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {bout.bout_format === 'free' ? 'Free time' : 'Timed match'} · To {bout.target_score}
                    </p>
                  </div>
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
                </button>
                {editingId === bout.id && (
                  <EditForm
                    bout={bout}
                    onUpdate={updateBout}
                    onDelete={deleteBout}
                    onClose={() => setEditingId(null)}
                  />
                )}
              </li>
            </Fragment>
          )
        })}
      </ul>

      {error && <p className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-4 mt-4 block w-[calc(100%-2rem)] rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
