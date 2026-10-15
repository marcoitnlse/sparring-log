import type { Bout } from '../hooks/useBouts'
import type { Opponent } from '../hooks/useOpponents'
import type { Database, Handedness } from '../types/database'

type BoutRow = Database['public']['Tables']['bouts']['Row']

let idCounter = 0
function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

/** Flattened, app-level Bout (as returned by useBouts) — for boutStats tests. */
export function makeBout(overrides: Partial<Bout> = {}): Bout {
  return {
    id: nextId('bout'),
    user_id: 'user-1',
    opponent_id: 'opp-1',
    weapon: 'epee',
    bout_format: 'timed',
    target_score: 15,
    fencer_score: 15,
    opponent_score: 10,
    bout_date: '2026-01-01',
    notes: null,
    created_at: '2026-01-01T12:00:00Z',
    opponent_name: 'Alex',
    opponent_handedness: null,
    ...overrides,
  }
}

/** Raw DB row shape with the nested `opponents` join, as the Supabase
 * client actually returns it — for useBouts hook tests, which map this
 * through `toBout`. */
export function makeBoutRow(
  overrides: Partial<BoutRow> = {},
  opponent: { name: string; handedness: Handedness | null } | null = { name: 'Alex', handedness: null },
): BoutRow & { opponents: typeof opponent } {
  return {
    id: nextId('bout'),
    user_id: 'user-1',
    opponent_id: 'opp-1',
    weapon: 'epee',
    bout_format: 'timed',
    target_score: 15,
    fencer_score: 15,
    opponent_score: 10,
    bout_date: '2026-01-01',
    notes: null,
    created_at: '2026-01-01T12:00:00Z',
    ...overrides,
    opponents: opponent,
  }
}

export function makeOpponent(overrides: Partial<Opponent> = {}): Opponent {
  return {
    id: nextId('opp'),
    user_id: 'user-1',
    name: 'Alex',
    handedness: null,
    notes: null,
    created_at: '2026-01-01T12:00:00Z',
    ...overrides,
  }
}
