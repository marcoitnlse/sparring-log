import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { deleteBoutRow, fetchAllBouts, insertBout, updateBoutRow } from '../lib/boutsApi'
import type { Bout, CreateBoutInput } from '../lib/boutsApi'
import { getErrorMessage } from '../lib/errors'

export type { Bout } from '../lib/boutsApi'

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
    try {
      setBouts(await fetchAllBouts())
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load bouts.'))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (options?.skipInitialFetch) return
    refetch()
  }, [refetch, options?.skipInitialFetch])

  const createBout = useCallback(
    async (input: CreateBoutInput) => {
      if (!session) throw new Error('Not authenticated')
      const newBout = await insertBout(session.user.id, input)
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

  const updateBout = useCallback(async (id: string, patch: Partial<CreateBoutInput>) => {
    const updated = await updateBoutRow(id, patch)
    setBouts((prev) => prev.map((b) => (b.id === id ? updated : b)))
    return updated
  }, [])

  const deleteBout = useCallback(async (id: string) => {
    await deleteBoutRow(id)
    setBouts((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return { bouts, loading, error, createBout, updateBout, deleteBout, refetch }
}
