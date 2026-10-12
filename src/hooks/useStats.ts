import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import type { Database } from '../types/database'

export type BoutStats = Database['public']['Views']['bout_stats']['Row']

const EMPTY_STATS: Omit<BoutStats, 'user_id'> = {
  total_bouts: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  win_rate_pct: null,
}

export function useStats() {
  const { session } = useAuth()
  const [stats, setStats] = useState<Omit<BoutStats, 'user_id'>>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bout_stats')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error) {
      setError(error.message)
    } else {
      setStats(data ?? EMPTY_STATS)
      setError(null)
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { stats, loading, error, refetch }
}
