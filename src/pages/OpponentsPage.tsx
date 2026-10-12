import { useState } from 'react'
import type { FormEvent } from 'react'
import { useOpponents } from '../hooks/useOpponents'

export function OpponentsPage() {
  const { opponents, loading, createOpponent } = useOpponents()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

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
          {opponents.map((o) => (
            <li key={o.id} className="px-4 py-3 text-base text-slate-800 dark:text-slate-200">
              {o.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
