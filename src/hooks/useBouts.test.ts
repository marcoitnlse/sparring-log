import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBouts } from './useBouts'
import { supabase } from '../lib/supabaseClient'
import { mockFromSequence } from '../test/supabaseMock'
import { createQueryBuilder } from '../test/supabaseMock'
import { makeBoutRow } from '../test/fixtures'

vi.mock('../lib/supabaseClient', () => ({ supabase: { from: vi.fn() } }))
// A stable `session` reference matters: useBouts depends on it in a
// useCallback/useEffect array, so a fresh object literal per call would
// retrigger the fetch effect on every render and drain the mocked queue.
vi.mock('./useAuth', () => {
  const session = { user: { id: 'user-1' } }
  return { useAuth: () => ({ session, loading: false }) }
})

const fromMock = vi.mocked(supabase.from)

beforeEach(() => {
  fromMock.mockReset()
})

describe('useBouts', () => {
  it('fetches bouts on mount by default, flattening the opponent join', async () => {
    const row = makeBoutRow({}, { name: 'Alex', handedness: 'left' })
    mockFromSequence(fromMock, [{ data: [row], error: null }])

    const { result } = renderHook(() => useBouts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.bouts).toHaveLength(1)
    expect(result.current.bouts[0].opponent_name).toBe('Alex')
    expect(result.current.bouts[0].opponent_handedness).toBe('left')
    expect(fromMock).toHaveBeenCalledWith('bouts')
  })

  it('falls back to "Unknown" when the opponent join is null', async () => {
    const row = makeBoutRow({}, null)
    mockFromSequence(fromMock, [{ data: [row], error: null }])

    const { result } = renderHook(() => useBouts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.bouts[0].opponent_name).toBe('Unknown')
    expect(result.current.bouts[0].opponent_handedness).toBeNull()
  })

  it('skips the initial fetch when skipInitialFetch is set', () => {
    const { result } = renderHook(() => useBouts({ skipInitialFetch: true }))

    expect(result.current.loading).toBe(false)
    expect(result.current.bouts).toEqual([])
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('createBout prepends the new bout, sorted newest-first by date', async () => {
    const { result } = renderHook(() => useBouts({ skipInitialFetch: true }))

    const older = makeBoutRow({ bout_date: '2026-01-01', fencer_score: 15, opponent_score: 10 })
    mockFromSequence(fromMock, [{ data: older, error: null }])
    await act(async () => {
      await result.current.createBout({
        opponentId: 'opp-1',
        fencerScore: 15,
        opponentScore: 10,
        boutDate: '2026-01-01',
      })
    })

    const newer = makeBoutRow({ bout_date: '2026-01-05', fencer_score: 8, opponent_score: 15 })
    mockFromSequence(fromMock, [{ data: newer, error: null }])
    await act(async () => {
      await result.current.createBout({
        opponentId: 'opp-1',
        fencerScore: 8,
        opponentScore: 15,
        boutDate: '2026-01-05',
      })
    })

    expect(result.current.bouts.map((b) => b.bout_date)).toEqual(['2026-01-05', '2026-01-01'])
  })

  it('createBout defaults weapon/format/target score when not provided', async () => {
    const { result } = renderHook(() => useBouts({ skipInitialFetch: true }))

    const builder = createQueryBuilder({ data: makeBoutRow(), error: null })
    fromMock.mockReturnValueOnce(builder as unknown as ReturnType<typeof supabase.from>)

    await act(async () => {
      await result.current.createBout({
        opponentId: 'opp-1',
        fencerScore: 15,
        opponentScore: 10,
        boutDate: '2026-01-01',
      })
    })

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ weapon: 'epee', bout_format: 'timed', target_score: 15 }),
    )
  })

  it('updateBout replaces the matching bout in place', async () => {
    const original = makeBoutRow({ id: 'bout-x', fencer_score: 5, opponent_score: 15 })
    mockFromSequence(fromMock, [{ data: [original], error: null }])

    const { result } = renderHook(() => useBouts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const updated = { ...original, fencer_score: 15, opponent_score: 10 }
    mockFromSequence(fromMock, [{ data: updated, error: null }])

    await act(async () => {
      await result.current.updateBout('bout-x', { fencerScore: 15, opponentScore: 10 })
    })

    expect(result.current.bouts[0].fencer_score).toBe(15)
    expect(result.current.bouts[0].opponent_score).toBe(10)
  })

  it('deleteBout removes the matching bout', async () => {
    const row = makeBoutRow({ id: 'bout-x' })
    mockFromSequence(fromMock, [{ data: [row], error: null }])

    const { result } = renderHook(() => useBouts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockFromSequence(fromMock, [{ data: null, error: null }])
    await act(async () => {
      await result.current.deleteBout('bout-x')
    })

    expect(result.current.bouts).toEqual([])
  })
})
