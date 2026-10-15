import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ProfileSettings } from './ProfileSettings'

const TABS = [
  { to: '/', label: 'Log', icon: '✚' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/opponents', label: 'Opponents', icon: '🤺' },
  { to: '/stats', label: 'Stats', icon: '📊' },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Fencing Bout Tracker
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label="Settings"
              aria-expanded={settingsOpen}
              className="text-lg leading-none text-slate-500 dark:text-slate-400"
            >
              ⚙
            </button>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-slate-500 underline underline-offset-2 dark:text-slate-400"
            >
              Sign out
            </button>
          </div>
        </div>
        {settingsOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <ProfileSettings />
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive
                  ? 'text-slate-900 dark:text-slate-50'
                  : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
