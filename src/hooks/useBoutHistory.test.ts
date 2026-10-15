import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGE_SIZE, useBoutHistory } from './useBoutHistory'
import { supabase } from '../lib/supabaseClient'
import { createQueryBuilder, mockFromSequence } from '../test/supabaseMock'
import { makeBoutRow } from '../test/fixtures'

vi.mock('../lib/supabaseClient', () => ({ supabase: { from: vi.fn() } }))
// A stable `session` reference matters here too — see useBouts.test.ts.
vi.mock('./useAuth', () => {
  const session = { user: { id: 'user-1' } }
  return { useAuth: () => ({ session, loading: false }) }
})

const fromMock = vi.mocked(supabase.from)

beforeEach(() => {
  fromMock.mockReset()
})

describe('useBoutHistory', () => {
  it('loads the first page on mount', async () => {
    const row = makeBoutRow({ bout_date: '2026-03-01' })
    // First call: the page query. Second call: the boundary-date top-up query.
    mockFromSequence(fromMock, [
      { data: [row], error: null },
      { data: [row], error: null },
    ])

    const { result } = renderHook(() => useBoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.bouts).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('merges in the rest of the boundary date instead of splitting it across pages', async () => {
    // Page query returns 2 rows (simulating a limit of 2 for this test),
    // the last of which is on the boundary date. The boundary-date query
    // reveals a 3rd bout on that same date that the page query didn't
    // include — it must still end up in the final list.
    const dayBefore = makeBoutRow({ id: 'older', bout_date: '2026-02-28' })
    const boundaryInPage = makeBoutRow({ id: 'boundary-1', bout_date: '2026-03-01' })
    const boundaryMissedByPage = makeBoutRow({ id: 'boundary-2', bout_date: '2026-03-01' })

    mockFromSequence(fromMock, [
      { data: [dayBefore, boundaryInPage], error: null }, // page query ("last" row is the boundary)
      { data: [boundaryInPage, boundaryMissedByPage], error: null }, // boundary-date query
    ])

    const { result } = renderHook(() => useBoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const ids = result.current.bouts.map((b) => b.id).sort()
    expect(ids).toEqual(['boundary-1', 'boundary-2', 'older'])
  })

  it('sets hasMore to false when a page comes back empty', async () => {
    mockFromSequence(fromMock, [{ data: [], error: null }])

    const { result } = renderHook(() => useBoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasMore).toBe(false)
    expect(result.current.bouts).toEqual([])
  })

  it('sets hasMore to false once a page comes back smaller than the page size', async () => {
    const row = makeBoutRow({ bout_date: '2026-03-01' })
    // Fewer rows than the page size signals there's nothing further back.
    mockFromSequence(fromMock, [
      { data: [row], error: null },
      { data: [row], error: null },
    ])

    const { result } = renderHook(() => useBoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasMore).toBe(false)
  })

  it('surfaces a fetch error', async () => {
    mockFromSequence(fromMock, [{ data: null, error: { message: 'network blip' } }])

    const { result } = renderHook(() => useBoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('network blip')
  })

  it('updateBout and deleteBout mutate the loaded list', async () => {
    const row = makeBoutRow({ id: 'bout-x', fencer_score: 5, opponent_score: 15 })
    mockFromSequence(fromMock, [
      { data: [row], error: null },
      { data: [row], error: null },
    ])

    const { result } = renderHook(() => useBoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const updated = { ...row, fencer_score: 15, opponent_score: 10 }
    mockFromSequence(fromMock, [{ data: updated, error: null }])
    await act(async () => {
      await result.current.updateBout('bout-x', { fencerScore: 15, opponentScore: 10 })
    })
    expect(result.current.bouts[0].fencer_score).toBe(15)

    mockFromSequence(fromMock, [{ data: null, error: null }])
    await act(async () => {
      await result.current.deleteBout('bout-x')
    })
    expect(result.current.bouts).toEqual([])
  })

  it('loadMore fetches strictly before the previous boundary date, and appends', async () => {
    const firstPageRows = Array.from({ length: PAGE_SIZE }, (_, i) =>
      makeBoutRow({ id: `page1-${i}`, bout_date: `2026-03-${String(20 - i).padStart(2, '0')}` }),
    )
    const firstBoundaryDate = firstPageRows[firstPageRows.length - 1].bout_date // '2026-03-01'

    mockFromSequence(fromMock, [
      { data: firstPageRows, error: null },
      { data: [firstPageRows[firstPageRows.length - 1]], error: null },
    ])

    const { result } = renderHook(() => useBoutHistory())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasMore).toBe(true)
    expect(result.current.bouts).toHaveLength(PAGE_SIZE)

    const secondPageRow = makeBoutRow({ id: 'page2-1', bout_date: '2026-02-15' })
    const pageBuilder = createQueryBuilder({ data: [secondPageRow], error: null })
    fromMock.mockReturnValueOnce(pageBuilder as unknown as ReturnType<typeof supabase.from>)
    mockFromSequence(fromMock, [{ data: [secondPageRow], error: null }])

    await act(async () => {
      await result.current.loadMore()
    })

    expect(pageBuilder.lt).toHaveBeenCalledWith('bout_date', firstBoundaryDate)
    expect(result.current.bouts).toHaveLength(PAGE_SIZE + 1)
    expect(result.current.bouts.at(-1)?.id).toBe('page2-1')
  })
})
