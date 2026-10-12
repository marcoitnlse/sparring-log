import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import type { Database, Weapon } from '../types/database'

type BoutRow = Database['public']['Tables']['bouts']['Row']
export type Bout = BoutRow & { opponent_name: string }

interface CreateBoutInput {
  opponentId: string
  fencerScore: number
  opponentScore: number
  boutDate: string
  weapon?: Weapon
  notes?: string
}

export function useBouts() {
  const { session } = useAuth()
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bouts')
      .select('*, opponents(name)')
      .order('bout_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setBouts(
        data.map((row) => {
          const { opponents, ...bout } = row as BoutRow & { opponents: { name: string } | null }
          return { ...bout, opponent_name: opponents?.name ?? 'Unknown' }
        }),
      )
      setError(null)
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createBout = useCallback(
    async (input: CreateBoutInput) => {
      if (!session) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('bouts')
        .insert({
          user_id: session.user.id,
          opponent_id: input.opponentId,
          fencer_score: input.fencerScore,
          opponent_score: input.opponentScore,
          bout_date: input.boutDate,
          weapon: input.weapon ?? 'epee',
          notes: input.notes ?? null,
        })
        .select('*, opponents(name)')
        .single()

      if (error) throw error
      const { opponents, ...bout } = data as BoutRow & { opponents: { name: string } | null }
      const newBout: Bout = { ...bout, opponent_name: opponents?.name ?? 'Unknown' }
      setBouts((prev) =>
        [newBout, ...prev].sort(
          (a, b) =>
            b.bout_date.localeCompare(a.bout_date) || b.created_at.localeCompare(a.created_at),
        ),
      )
      return newBout
    },
    [session],
  )

  const updateBout = useCallback(
    async (id: string, patch: Partial<CreateBoutInput>) => {
      const { data, error } = await supabase
        .from('bouts')
        .update({
          ...(patch.opponentId !== undefined && { opponent_id: patch.opponentId }),
          ...(patch.fencerScore !== undefined && { fencer_score: patch.fencerScore }),
          ...(patch.opponentScore !== undefined && { opponent_score: patch.opponentScore }),
          ...(patch.boutDate !== undefined && { bout_date: patch.boutDate }),
          ...(patch.weapon !== undefined && { weapon: patch.weapon }),
          ...(patch.notes !== undefined && { notes: patch.notes }),
        })
        .eq('id', id)
        .select('*, opponents(name)')
        .single()

      if (error) throw error
      const { opponents, ...bout } = data as BoutRow & { opponents: { name: string } | null }
      const updated: Bout = { ...bout, opponent_name: opponents?.name ?? 'Unknown' }
      setBouts((prev) => prev.map((b) => (b.id === id ? updated : b)))
      return updated
    },
    [],
  )

  return { bouts, loading, error, createBout, updateBout, refetch }
}
