import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import type { BoutFormat, Database, Handedness, TargetScore, Weapon } from '../types/database'

type BoutRow = Database['public']['Tables']['bouts']['Row']
type OpponentJoin = { name: string; handedness: Handedness | null } | null
export type Bout = BoutRow & { opponent_name: string; opponent_handedness: Handedness | null }

interface CreateBoutInput {
  opponentId: string
  fencerScore: number
  opponentScore: number
  boutDate: string
  weapon?: Weapon
  boutFormat?: BoutFormat
  targetScore?: TargetScore
  notes?: string
}

function toBout(row: BoutRow & { opponents: OpponentJoin }): Bout {
  const { opponents, ...bout } = row
  return {
    ...bout,
    opponent_name: opponents?.name ?? 'Unknown',
    opponent_handedness: opponents?.handedness ?? null,
  }
}

interface UseBoutsOptions {
  /** Skip the initial fetch of the full bout list — for callers that only
   * need createBout/updateBout/deleteBout and never render `bouts`, so we
   * don't pull the user's entire history just to log a new one. */
  skipInitialFetch?: boolean
}

export function useBouts(options?: UseBoutsOptions) {
  const { session } = useAuth()
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(!options?.skipInitialFetch)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bouts')
      .select('*, opponents(name, handedness)')
      .order('bout_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setBouts(data.map((row) => toBout(row as BoutRow & { opponents: OpponentJoin })))
      setError(null)
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (options?.skipInitialFetch) return
    refetch()
  }, [refetch, options?.skipInitialFetch])

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
          bout_format: input.boutFormat ?? 'timed',
          target_score: input.targetScore ?? 15,
          notes: input.notes ?? null,
        })
        .select('*, opponents(name, handedness)')
        .single()

      if (error) throw error
      const newBout = toBout(data as BoutRow & { opponents: OpponentJoin })
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
          ...(patch.boutFormat !== undefined && { bout_format: patch.boutFormat }),
          ...(patch.targetScore !== undefined && { target_score: patch.targetScore }),
          ...(patch.notes !== undefined && { notes: patch.notes }),
        })
        .eq('id', id)
        .select('*, opponents(name, handedness)')
        .single()

      if (error) throw error
      const updated = toBout(data as BoutRow & { opponents: OpponentJoin })
      setBouts((prev) => prev.map((b) => (b.id === id ? updated : b)))
      return updated
    },
    [],
  )

  const deleteBout = useCallback(async (id: string) => {
    const { error } = await supabase.from('bouts').delete().eq('id', id)
    if (error) throw error
    setBouts((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return { bouts, loading, error, createBout, updateBout, deleteBout, refetch }
}
