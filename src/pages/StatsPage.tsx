import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useBouts } from '../hooks/useBouts'
import { useOpponents } from '../hooks/useOpponents'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { computeBoutStats } from '../lib/boutStats'
import { SegmentedToggle } from '../components/SegmentedToggle'
import {
  BOUT_FORMAT_FILTER_OPTIONS,
  TARGET_SCORE_FILTER_OPTIONS,
  type BoutFormatFilter,
  type TargetScoreFilter,
} from '../lib/boutOptions'

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-slate-900">
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function ProfileSection() {
  const { session } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!session) return
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name)
      })
  }, [session])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session || saving) return
    setSaving(true)
    setSaved(false)
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', session.user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <label htmlFor="displayName" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

export function StatsPage() {
  const { bouts, loading } = useBouts()
  const { opponents } = useOpponents()

  const [opponentFilter, setOpponentFilter] = useState<string>('all')
  const [formatFilter, setFormatFilter] = useState<BoutFormatFilter>('all')
  const [targetFilter, setTargetFilter] = useState<TargetScoreFilter>('all')

  const filteredBouts = useMemo(
    () =>
      bouts.filter(
        (b) =>
          (opponentFilter === 'all' || b.opponent_id === opponentFilter) &&
          (formatFilter === 'all' || b.bout_format === formatFilter) &&
          (targetFilter === 'all' || b.target_score === targetFilter),
      ),
    [bouts, opponentFilter, formatFilter, targetFilter],
  )

  const stats = useMemo(() => computeBoutStats(filteredBouts), [filteredBouts])

  return (
    <div className="space-y-8 p-4">
      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Filters</h2>
        <div className="flex flex-col gap-3">
          <select
            value={opponentFilter}
            onChange={(e) => setOpponentFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All opponents</option>
            {opponents.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <SegmentedToggle options={BOUT_FORMAT_FILTER_OPTIONS} value={formatFilter} onChange={setFormatFilter} />
          <SegmentedToggle options={TARGET_SCORE_FILTER_OPTIONS} value={targetFilter} onChange={setTargetFilter} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Record</h2>
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Bouts" value={stats.total} />
            <StatTile label="Win rate" value={stats.winRatePct !== null ? `${stats.winRatePct}%` : '—'} />
            <StatTile label="Wins" value={stats.wins} />
            <StatTile label="Losses" value={stats.losses} />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Touches</h2>
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Avg scored" value={stats.avgScored ?? '—'} />
            <StatTile label="Avg conceded" value={stats.avgConceded ?? '—'} />
            <StatTile label="Avg margin" value={stats.avgMargin !== null ? (stats.avgMargin > 0 ? `+${stats.avgMargin}` : stats.avgMargin) : '—'} />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Profile</h2>
        <ProfileSection />
      </section>
    </div>
  )
}
