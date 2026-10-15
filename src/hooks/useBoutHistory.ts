import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { deleteBoutRow, fetchBoutsForDate, fetchBoutsPage, updateBoutRow } from '../lib/boutsApi'
import type { Bout, CreateBoutInput } from '../lib/boutsApi'
import { getErrorMessage } from '../lib/errors'

export const PAGE_SIZE = 20

function dedupeById(bouts: Bout[]): Bout[] {
  const seen = new Set<string>()
  const result: Bout[] = []
  for (const bout of bouts) {
    if (seen.has(bout.id)) continue
    seen.add(bout.id)
    result.push(bout)
  }
  return result
}

/** Paginated bout history for the History screen — fetches PAGE_SIZE at a
 * time (oldest-first cutoff, newest-first order), but a page boundary only
 * ever falls between two dates, never splits one day's bouts across two
 * loads. Full-history consumers (Stats, Opponents) use useBouts instead,
 * which fetches everything — they genuinely need the complete set for
 * correct aggregates, so this hook is deliberately separate rather than a
 * shared "maybe paginated" mode on useBouts. */
export function useBoutHistory() {
  const { session } = useAuth()
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cursorDateRef = useRef<string | undefined>(undefined)
  const inFlightRef = useRef(false)
  const hasMoreRef = useRef(true)

  const loadMore = useCallback(async () => {
    if (!session || inFlightRef.current || !hasMoreRef.current) return
    inFlightRef.current = true
    setLoadingMore(true)
    try {
      const page = await fetchBoutsPage({ limit: PAGE_SIZE, beforeDate: cursorDateRef.current })
      if (page.length === 0) {
        hasMoreRef.current = false
        setHasMore(false)
        return
      }

      const boundaryDate = page[page.length - 1].bout_date
      const restOfBoundaryDate = await fetchBoutsForDate(boundaryDate)
      const merged = dedupeById([...page, ...restOfBoundaryDate])

      setBouts((prev) => dedupeById([...prev, ...merged]))
      cursorDateRef.current = boundaryDate
      const stillMore = page.length === PAGE_SIZE
      hasMoreRef.current = stillMore
      setHasMore(stillMore)
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load history.'))
    } finally {
      inFlightRef.current = false
      setLoadingMore(false)
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  const updateBout = useCallback(async (id: string, patch: Partial<CreateBoutInput>) => {
    const updated = await updateBoutRow(id, patch)
    setBouts((prev) => prev.map((b) => (b.id === id ? updated : b)))
    return updated
  }, [])

  const deleteBout = useCallback(async (id: string) => {
    await deleteBoutRow(id)
    setBouts((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return { bouts, loading, loadingMore, hasMore, loadMore, error, updateBout, deleteBout }
}
