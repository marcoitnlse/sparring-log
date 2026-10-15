import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useOpponents } from '../hooks/useOpponents'
import type { Opponent } from '../hooks/useOpponents'
import { useBouts } from '../hooks/useBouts'
import type { Bout } from '../hooks/useBouts'
import { computeBoutStats, groupBoutsByOpponent } from '../lib/boutStats'
import { RecentFormDots } from '../components/RecentFormDots'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { formatDate } from '../lib/formatDate'
import { HANDEDNESS_OPTIONS } from '../lib/opponentOptions'
import type { Handedness } from '../types/database'

function handednessLabel(h: Handedness | null) {
  return h === 'right' ? 'R' : h === 'left' ? 'L' : null
}

function LastFiveList({ bouts }: { bouts: Bout[] }) {
  return (
    <ul className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      {bouts.map((bout) => {
        const won = bout.fencer_score > bout.opponent_score
        return (
          <li key={bout.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{formatDate(bout.bout_date)}</span>
            <span
              className={`font-semibold ${won ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {bout.fencer_score}–{bout.opponent_score}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

interface EditOpponentFormProps {
  opponent: Opponent
  onUpdate: (id: string, patch: { name?: string; handedness?: Handedness | null }) => Promise<Opponent>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

function EditOpponentForm({ opponent, onUpdate, onDelete, onClose }: EditOpponentFormProps) {
  const [name, setName] = useState(opponent.name)
  const [handedness, setHandedness] = useState<Handedness>(opponent.handedness ?? 'right')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      await onUpdate(opponent.id, { name: trimmed, handedness })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${opponent.name}? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete(opponent.id)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete opponent.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <SegmentedToggle options={HANDEDNESS_OPTIONS} value={handedness} onChange={setHandedness} />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
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
        {deleting ? 'Deleting…' : 'Delete opponent'}
      </button>
    </div>
  )
}

export function OpponentsPage() {
  const { opponents, loading, error, createOpponent, updateOpponent, deleteOpponent } = useOpponents()
  const { bouts } = useBouts()
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [newHandedness, setNewHandedness] = useState<Handedness>('right')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const byOpponent = useMemo(() => groupBoutsByOpponent(bouts), [bouts])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await createOpponent(trimmed, newHandedness)
      setName('')
      setNewHandedness('right')
      setShowAddForm(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      {showAddForm ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New opponent name"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              Add
            </button>
          </div>
          <SegmentedToggle options={HANDEDNESS_OPTIONS} value={newHandedness} onChange={setNewHandedness} />
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false)
              setName('')
              setNewHandedness('right')
            }}
            className="text-sm text-slate-500 underline underline-offset-2 dark:text-slate-400"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="mb-6 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
        >
          + Add opponent
        </button>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">Couldn't load opponents: {error}</p>
      ) : opponents.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No opponents yet — add one above.</p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {opponents.map((o) => {
            const group = byOpponent.get(o.id) ?? []
            const stats = computeBoutStats(group)
            const hasBouts = group.length > 0
            const hand = handednessLabel(o.handedness)

            return (
              <li key={o.id}>
                <div
                  onClick={() => hasBouts && setExpandedId(expandedId === o.id ? null : o.id)}
                  className={`flex items-center justify-between px-4 py-3 ${
                    hasBouts ? 'active:bg-slate-100 dark:active:bg-slate-900' : ''
                  }`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-base text-slate-800 dark:text-slate-200">
                      {o.name}
                      {hand && (
                        <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {hand}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(editingId === o.id ? null : o.id)
                      }}
                      aria-label={`Edit ${o.name}`}
                      className="text-sm text-slate-500 underline underline-offset-2 dark:text-slate-400"
                    >
                      Edit
                    </button>
                  </div>
                  {hasBouts && (
                    <div className="flex flex-col items-end gap-1">
                      <RecentFormDots outcomes={stats.recentForm} />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        W-L: {stats.wins}–{stats.losses} · {stats.total} {stats.total === 1 ? 'bout' : 'bouts'}
                      </p>
                    </div>
                  )}
                </div>
                {editingId === o.id && (
                  <EditOpponentForm
                    opponent={o}
                    onUpdate={updateOpponent}
                    onDelete={deleteOpponent}
                    onClose={() => setEditingId(null)}
                  />
                )}
                {expandedId === o.id && <LastFiveList bouts={group.slice(0, 5)} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
