import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOpponents } from '../hooks/useOpponents'
import { useBouts } from '../hooks/useBouts'
import { groupNotesByCategory } from '../lib/boutNotes'
import { formatDate } from '../lib/formatDate'
import { getQuickLogDraft, setDraftOpponent } from '../lib/quickLogDraft'

/** Pre-bout review: pick who you're about to fence and see every note
 * left against them, grouped by category, each dated. Picking here also
 * selects them on the Log screen for the bout that follows. */
export function NextOpponentPage() {
  const navigate = useNavigate()
  const { opponents, loading: opponentsLoading } = useOpponents()
  const { bouts, loading: boutsLoading, error } = useBouts()
  const [opponentId, setOpponentId] = useState(() => getQuickLogDraft().opponentId ?? '')

  const opponent = opponents.find((o) => o.id === opponentId)
  const opponentBouts = useMemo(() => bouts.filter((b) => b.opponent_id === opponentId), [bouts, opponentId])
  const grouped = useMemo(() => groupNotesByCategory(opponentBouts), [opponentBouts])
  const hasAnyNotes = grouped.some((g) => g.notes.length > 0)

  function selectOpponent(id: string) {
    setOpponentId(id)
    setDraftOpponent(id)
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Who are you fencing next?</h2>
        <select
          value={opponent ? opponentId : ''}
          onChange={(e) => selectOpponent(e.target.value)}
          disabled={opponentsLoading}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="" disabled>
            Pick an opponent
          </option>
          {opponents.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </section>

      {opponent &&
        (error ? (
          <p className="text-sm text-red-600 dark:text-red-400">Couldn't load notes: {error}</p>
        ) : boutsLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : (
          <>
            {!hasAnyNotes && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {opponentBouts.length === 0
                  ? `No bouts against ${opponent.name} yet.`
                  : `No notes on your ${opponentBouts.length} ${opponentBouts.length === 1 ? 'bout' : 'bouts'} against ${opponent.name} yet.`}
              </p>
            )}
            {hasAnyNotes &&
              grouped.map(({ category, notes }) => (
                <section key={category.column}>
                  <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">{category.label}</h3>
                  {notes.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">Nothing yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                      {notes.map((note) => (
                        <li key={note.boutId} className="px-4 py-2 text-sm">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(note.date)}</p>
                          <p className="break-words whitespace-pre-wrap text-slate-800 dark:text-slate-200">{note.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full rounded-xl bg-slate-900 py-3 text-base font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Log a bout vs. {opponent.name}
            </button>
          </>
        ))}
    </div>
  )
}
