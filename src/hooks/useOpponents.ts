import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import type { Database } from '../types/database'

export type Opponent = Database['public']['Tables']['opponents']['Row']

export function useOpponents() {
  const { session } = useAuth()
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const { data, error } = await supabase
      .from('opponents')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setOpponents(data)
      setError(null)
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createOpponent = useCallback(
    async (name: string, notes?: string) => {
      if (!session) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('opponents')
        .insert({ user_id: session.user.id, name, notes: notes ?? null })
        .select()
        .single()

      if (error) throw error
      setOpponents((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    },
    [session],
  )

  return { opponents, loading, error, createOpponent, refetch }
}
