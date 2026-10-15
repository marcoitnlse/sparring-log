import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOpponents } from './useOpponents'
import { supabase } from '../lib/supabaseClient'
import { mockFromSequence } from '../test/supabaseMock'
import { makeOpponent } from '../test/fixtures'

vi.mock('../lib/supabaseClient', () => ({ supabase: { from: vi.fn() } }))
// A stable `session` reference matters: useOpponents/useBouts depend on it
// in a useCallback/useEffect array, so a fresh object literal per call would
// retrigger the fetch effect on every render and drain the mocked queue.
vi.mock('./useAuth', () => {
  const session = { user: { id: 'user-1' } }
  return { useAuth: () => ({ session, loading: false }) }
})

const fromMock = vi.mocked(supabase.from)

beforeEach(() => {
  fromMock.mockReset()
})

describe('useOpponents', () => {
  it('fetches opponents on mount', async () => {
    const alex = makeOpponent({ name: 'Alex' })
    mockFromSequence(fromMock, [{ data: [alex], error: null }])

    const { result } = renderHook(() => useOpponents())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.opponents).toEqual([alex])
    expect(result.current.error).toBeNull()
  })

  it('surfaces a fetch error instead of silently showing an empty list', async () => {
    mockFromSequence(fromMock, [{ data: null, error: { message: 'network blip' } }])

    const { result } = renderHook(() => useOpponents())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('network blip')
  })

  it('createOpponent appends the new opponent and keeps the list sorted by name', async () => {
    const bob = makeOpponent({ name: 'Bob' })
    mockFromSequence(fromMock, [{ data: [bob], error: null }])

    const { result } = renderHook(() => useOpponents())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const alex = makeOpponent({ name: 'Alex' })
    mockFromSequence(fromMock, [{ data: alex, error: null }])

    await act(async () => {
      await result.current.createOpponent('Alex', null)
    })

    expect(result.current.opponents.map((o) => o.name)).toEqual(['Alex', 'Bob'])
  })

  it('updateOpponent replaces the matching opponent and re-sorts', async () => {
    const alex = makeOpponent({ id: 'opp-1', name: 'Alex' })
    mockFromSequence(fromMock, [{ data: [alex], error: null }])

    const { result } = renderHook(() => useOpponents())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const renamed = { ...alex, name: 'Zane' }
    mockFromSequence(fromMock, [{ data: renamed, error: null }])

    await act(async () => {
      await result.current.updateOpponent('opp-1', { name: 'Zane' })
    })

    expect(result.current.opponents).toEqual([renamed])
  })

  it('deleteOpponent removes the opponent on success', async () => {
    const alex = makeOpponent({ id: 'opp-1' })
    mockFromSequence(fromMock, [{ data: [alex], error: null }])

    const { result } = renderHook(() => useOpponents())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockFromSequence(fromMock, [{ data: null, error: null }])

    await act(async () => {
      await result.current.deleteOpponent('opp-1')
    })

    expect(result.current.opponents).toEqual([])
  })

  it('deleteOpponent surfaces a friendly message on a foreign-key violation', async () => {
    const alex = makeOpponent({ id: 'opp-1' })
    mockFromSequence(fromMock, [{ data: [alex], error: null }])

    const { result } = renderHook(() => useOpponents())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockFromSequence(fromMock, [
      { data: null, error: { message: 'update or delete violates foreign key constraint', code: '23503' } },
    ])

    await expect(result.current.deleteOpponent('opp-1')).rejects.toThrow(
      'This opponent has bouts logged against them — delete those from History first.',
    )
    // The opponent must still be in the list — the delete did not actually happen.
    expect(result.current.opponents).toEqual([alex])
  })

  it('deleteOpponent re-throws other errors unchanged', async () => {
    const alex = makeOpponent({ id: 'opp-1' })
    mockFromSequence(fromMock, [{ data: [alex], error: null }])

    const { result } = renderHook(() => useOpponents())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const dbError = { message: 'something else broke', code: '500' }
    mockFromSequence(fromMock, [{ data: null, error: dbError }])

    let caught: unknown
    try {
      await result.current.deleteOpponent('opp-1')
    } catch (e) {
      caught = e
    }
    expect(caught).toEqual(dbError)
  })
})
