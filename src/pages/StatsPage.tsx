import { useMemo, useState } from 'react'
import { useBouts } from '../hooks/useBouts'
import { useOpponents } from '../hooks/useOpponents'
import { computeBoutStats, computeSessionFormTrend, filterBouts } from '../lib/boutStats'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { FormTrendChart } from '../components/FormTrendChart'
import {
  BOUT_FORMAT_FILTER_OPTIONS,
  TARGET_SCORE_FILTER_OPTIONS,
  type BoutFormatFilter,
  type TargetScoreFilter,
} from '../lib/boutOptions'
import { HANDEDNESS_FILTER_OPTIONS, type HandednessFilter } from '../lib/opponentOptions'

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-slate-900">
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

export function StatsPage() {
  const { bouts, loading } = useBouts()
  const { opponents } = useOpponents()

  const [opponentFilter, setOpponentFilter] = useState<string>('all')
  const [formatFilter, setFormatFilter] = useState<BoutFormatFilter>('all')
  const [targetFilter, setTargetFilter] = useState<TargetScoreFilter>('all')
  const [handednessFilter, setHandednessFilter] = useState<HandednessFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilterCount = [
    opponentFilter !== 'all',
    formatFilter !== 'all',
    targetFilter !== 'all',
    handednessFilter !== 'all',
  ].filter(Boolean).length

  const filteredBouts = useMemo(
    () =>
      filterBouts(bouts, {
        opponentId: opponentFilter,
        format: formatFilter,
        targetScore: targetFilter,
        handedness: handednessFilter,
      }),
    [bouts, opponentFilter, formatFilter, targetFilter, handednessFilter],
  )

  const stats = useMemo(() => computeBoutStats(filteredBouts), [filteredBouts])
  const sessions = useMemo(() => computeSessionFormTrend(filteredBouts), [filteredBouts])

  return (
    <div className="space-y-6 p-4">
      <section>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
        >
          <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          <span className="text-slate-400 dark:text-slate-500">{filtersOpen ? '▲' : '▼'}</span>
        </button>
        {filtersOpen && (
          <div className="mt-3 flex flex-col gap-3">
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
            {/* 5 segments (All/Training/Free time/Timed match/Competition) can
             * overflow a narrow phone screen — scroll horizontally rather than
             * clip or wrap. `w-max` keeps the pills at their natural width so
             * the flex items shrink-to-scroll instead of shrinking-to-squish. */}
            <div className="overflow-x-auto">
              <div className="w-max">
                <SegmentedToggle options={BOUT_FORMAT_FILTER_OPTIONS} value={formatFilter} onChange={setFormatFilter} />
              </div>
            </div>
            <SegmentedToggle options={TARGET_SCORE_FILTER_OPTIONS} value={targetFilter} onChange={setTargetFilter} />
            <SegmentedToggle
              options={HANDEDNESS_FILTER_OPTIONS}
              value={handednessFilter}
              onChange={setHandednessFilter}
            />
          </div>
        )}
      </section>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : (
        <>
          <section className="rounded-xl bg-white p-5 text-center shadow-sm dark:bg-slate-900">
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              {stats.winRatePct !== null ? `${stats.winRatePct}%` : '—'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {stats.wins}W–{stats.losses}L · {stats.total} bouts
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Form trend</h2>
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
              <FormTrendChart sessions={sessions} />
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Touches</h2>
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Avg scored" value={stats.avgScored ?? '—'} />
              <StatTile label="Avg conceded" value={stats.avgConceded ?? '—'} />
              <StatTile
                label="Avg margin"
                value={stats.avgMargin !== null ? (stats.avgMargin > 0 ? `+${stats.avgMargin}` : stats.avgMargin) : '—'}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
