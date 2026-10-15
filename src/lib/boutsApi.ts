import { supabase } from './supabaseClient'
import type { BoutFormat, Database, Handedness, TargetScore, Weapon } from '../types/database'

type BoutRow = Database['public']['Tables']['bouts']['Row']
type OpponentJoin = { name: string; handedness: Handedness | null } | null
export type Bout = BoutRow & { opponent_name: string; opponent_handedness: Handedness | null }

export interface CreateBoutInput {
  opponentId: string
  fencerScore: number
  opponentScore: number
  boutDate: string
  weapon?: Weapon
  boutFormat?: BoutFormat
  targetScore?: TargetScore
  notes?: string
}

const BOUT_SELECT = '*, opponents(name, handedness)'

function toBout(row: BoutRow & { opponents: OpponentJoin }): Bout {
  const { opponents, ...bout } = row
  return {
    ...bout,
    opponent_name: opponents?.name ?? 'Unknown',
    opponent_handedness: opponents?.handedness ?? null,
  }
}

/** Every bout, newest first — used where a full-history aggregate is
 * genuinely needed (Stats filters, Opponents head-to-head). */
export async function fetchAllBouts(): Promise<Bout[]> {
  const { data, error } = await supabase
    .from('bouts')
    .select(BOUT_SELECT)
    .order('bout_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row) => toBout(row as BoutRow & { opponents: OpponentJoin }))
}

/** One page of bouts, newest first, optionally only those strictly before
 * `beforeDate` (for paging further back). `limit` is a floor, not a hard
 * cap — see fetchBoutsForDate, used alongside this to avoid splitting a
 * single day's bouts across two pages. */
export async function fetchBoutsPage(opts: { limit: number; beforeDate?: string }): Promise<Bout[]> {
  let query = supabase
    .from('bouts')
    .select(BOUT_SELECT)
    .order('bout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(opts.limit)
  if (opts.beforeDate) query = query.lt('bout_date', opts.beforeDate)
  const { data, error } = await query
  if (error) throw error
  return data.map((row) => toBout(row as BoutRow & { opponents: OpponentJoin }))
}

/** All bouts on exactly one date — merged into a page's results so a
 * page boundary only ever falls between dates, never inside one. */
export async function fetchBoutsForDate(date: string): Promise<Bout[]> {
  const { data, error } = await supabase
    .from('bouts')
    .select(BOUT_SELECT)
    .eq('bout_date', date)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row) => toBout(row as BoutRow & { opponents: OpponentJoin }))
}

export async function insertBout(userId: string, input: CreateBoutInput): Promise<Bout> {
  const { data, error } = await supabase
    .from('bouts')
    .insert({
      user_id: userId,
      opponent_id: input.opponentId,
      fencer_score: input.fencerScore,
      opponent_score: input.opponentScore,
      bout_date: input.boutDate,
      weapon: input.weapon ?? 'epee',
      bout_format: input.boutFormat ?? 'timed',
      target_score: input.targetScore ?? 15,
      notes: input.notes ?? null,
    })
    .select(BOUT_SELECT)
    .single()
  if (error) throw error
  return toBout(data as BoutRow & { opponents: OpponentJoin })
}

export async function updateBoutRow(id: string, patch: Partial<CreateBoutInput>): Promise<Bout> {
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
    .select(BOUT_SELECT)
    .single()
  if (error) throw error
  return toBout(data as BoutRow & { opponents: OpponentJoin })
}

export async function deleteBoutRow(id: string): Promise<void> {
  const { error } = await supabase.from('bouts').delete().eq('id', id)
  if (error) throw error
}
