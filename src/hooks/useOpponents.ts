import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import type { Database, Handedness } from '../types/database'

export type Opponent = Database['public']['Tables']['opponents']['Row']

/** Postgres foreign_key_violation — thrown when deleting an opponent that
 * still has bouts logged against them (bouts.opponent_id is ON DELETE RESTRICT). */
const FOREIGN_KEY_VIOLATION = '23503'

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
    async (name: string, handedness?: Handedness | null, notes?: string) => {
      if (!session) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('opponents')
        .insert({ user_id: session.user.id, name, handedness: handedness ?? null, notes: notes ?? null })
        .select()
        .single()

      if (error) throw error
      setOpponents((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    },
    [session],
  )

  const updateOpponent = useCallback(
    async (id: string, patch: { name?: string; handedness?: Handedness | null }) => {
      const { data, error } = await supabase
        .from('opponents')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setOpponents((prev) =>
        prev.map((o) => (o.id === id ? data : o)).sort((a, b) => a.name.localeCompare(b.name)),
      )
      return data
    },
    [],
  )

  const deleteOpponent = useCallback(async (id: string) => {
    const { error } = await supabase.from('opponents').delete().eq('id', id)
    if (error) {
      if (error.code === FOREIGN_KEY_VIOLATION) {
        throw new Error('This opponent has bouts logged against them — delete those from History first.')
      }
      throw error
    }
    setOpponents((prev) => prev.filter((o) => o.id !== id))
  }, [])

  return { opponents, loading, error, createOpponent, updateOpponent, deleteOpponent, refetch }
}
