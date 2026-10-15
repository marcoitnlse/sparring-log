import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

export function ProfileSettings() {
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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
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
