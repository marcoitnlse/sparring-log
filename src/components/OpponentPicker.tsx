import { useMemo, useState } from 'react'
import type { Opponent } from '../hooks/useOpponents'

interface OpponentPickerProps {
  opponents: Opponent[]
  recentOpponents: Opponent[]
  selected: Opponent | null
  onSelect: (opponent: Opponent) => void
  onCreate: (name: string) => Promise<Opponent>
}

export function OpponentPicker({ opponents, recentOpponents, selected, onSelect, onCreate }: OpponentPickerProps) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return opponents.filter((o) => o.name.toLowerCase().includes(q))
  }, [opponents, query])

  const exactMatch = useMemo(
    () => opponents.some((o) => o.name.toLowerCase() === query.trim().toLowerCase()),
    [opponents, query],
  )

  async function handleCreate() {
    const name = query.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const opponent = await onCreate(name)
      onSelect(opponent)
      setQuery('')
    } finally {
      setCreating(false)
    }
  }

  function handleSelect(opponent: Opponent) {
    onSelect(opponent)
    setQuery('')
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        autoFocus
        placeholder="Who did you fence?"
        value={selected && !query ? selected.name : query}
        onFocus={() => setQuery(selected && !query ? '' : query)}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

      {!query && recentOpponents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recentOpponents.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => handleSelect(o)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                selected?.id === o.id
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      {query && (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => handleSelect(o)}
                className="w-full px-4 py-3 text-left text-base text-slate-800 active:bg-slate-100 dark:text-slate-200 dark:active:bg-slate-800"
              >
                {o.name}
              </button>
            </li>
          ))}
          {!exactMatch && (
            <li>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full px-4 py-3 text-left text-base font-medium text-blue-600 active:bg-slate-100 dark:text-blue-400 dark:active:bg-slate-800"
              >
                + Add "{query.trim()}" as new opponent
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
