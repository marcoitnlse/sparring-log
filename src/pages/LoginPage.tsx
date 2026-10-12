import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName || undefined } },
          })

    setSubmitting(false)
    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Fencing Bout Tracker
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === 'sign-in' ? 'Sign in to log your bouts.' : 'Create an account to get started.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'sign-up' && (
            <div>
              <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null)
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          }}
          className="mt-6 w-full text-center text-sm text-slate-500 underline underline-offset-2 dark:text-slate-400"
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
