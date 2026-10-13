import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useOpponents } from '../hooks/useOpponents'
import { useBouts } from '../hooks/useBouts'
import type { Bout } from '../hooks/useBouts'
import { computeBoutStats, groupBoutsByOpponent } from '../lib/boutStats'
import { RecentFormDots } from '../components/RecentFormDots'
import { formatDate } from '../lib/formatDate'

function LastFiveList({ bouts }: { bouts: Bout[] }) {
  return (
    <ul className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      {bouts.map((bout) => {
        const won = bout.fencer_score > bout.opponent_score
        const drew = bout.fencer_score === bout.opponent_score
        return (
          <li key={bout.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{formatDate(bout.bout_date)}</span>
            <span
              className={`font-semibold ${
                drew
                  ? 'text-slate-500 dark:text-slate-400'
                  : won
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {bout.fencer_score}–{bout.opponent_score}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function OpponentsPage() {
  const { opponents, loading, createOpponent } = useOpponents()
  const { bouts } = useBouts()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const byOpponent = useMemo(() => groupBoutsByOpponent(bouts), [bouts])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await createOpponent(trimmed)
      setName('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
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
      </form>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : opponents.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No opponents yet — add one above, or add one inline while logging a bout.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {opponents.map((o) => {
            const group = byOpponent.get(o.id) ?? []
            const stats = computeBoutStats(group)
            const hasBouts = group.length > 0

            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => hasBouts && setExpandedId(expandedId === o.id ? null : o.id)}
                  disabled={!hasBouts}
                  className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-slate-100 disabled:active:bg-transparent dark:active:bg-slate-900"
                >
                  <div>
                    <p className="text-base text-slate-800 dark:text-slate-200">{o.name}</p>
                    {hasBouts && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {stats.wins}–{stats.losses}
                        {stats.draws > 0 ? `–${stats.draws}` : ''} · {stats.total}{' '}
                        {stats.total === 1 ? 'bout' : 'bouts'}
                      </p>
                    )}
                  </div>
                  {hasBouts && <RecentFormDots outcomes={stats.recentForm} />}
                </button>
                {expandedId === o.id && <LastFiveList bouts={group.slice(0, 5)} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
