import { beforeEach, describe, expect, it, vi } from 'vitest'
import { insertBout, updateBoutRow } from './boutsApi'
import { supabase } from './supabaseClient'
import { createQueryBuilder } from '../test/supabaseMock'
import { makeBoutRow } from '../test/fixtures'

vi.mock('./supabaseClient', () => ({ supabase: { from: vi.fn() } }))

const fromMock = vi.mocked(supabase.from)

function mockBuilder() {
  const builder = createQueryBuilder({ data: makeBoutRow(), error: null })
  fromMock.mockReturnValueOnce(builder as unknown as ReturnType<typeof supabase.from>)
  return builder as Record<string, ReturnType<typeof vi.fn>>
}

beforeEach(() => {
  fromMock.mockReset()
})

describe('insertBout', () => {
  it('maps the three note fields to their columns, defaulting to null', async () => {
    const builder = mockBuilder()
    await insertBout('user-1', {
      opponentId: 'opp-1',
      fencerScore: 15,
      opponentScore: 10,
      boutDate: '2026-11-24',
      notesWorked: 'flick to wrist',
    })
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ notes_worked: 'flick to wrist', notes_not_worked: null, notes_other: null }),
    )
  })
})

describe('updateBoutRow', () => {
  it('sends null for a cleared note so it is actually removed', async () => {
    const builder = mockBuilder()
    await updateBoutRow('bout-1', { notesWorked: 'moved here', notesOther: null })
    expect(builder.update).toHaveBeenCalledWith({ notes_worked: 'moved here', notes_other: null })
  })

  it('leaves out note fields that are undefined', async () => {
    const builder = mockBuilder()
    await updateBoutRow('bout-1', { fencerScore: 15 })
    expect(builder.update).toHaveBeenCalledWith({ fencer_score: 15 })
  })
})
