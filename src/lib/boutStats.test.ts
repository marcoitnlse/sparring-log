import { describe, expect, it } from 'vitest'
import { computeBoutStats, groupBoutsByOpponent, outcomeOf } from './boutStats'
import { makeBout } from '../test/fixtures'

describe('outcomeOf', () => {
  it('is a win when fencer scored more', () => {
    expect(outcomeOf(makeBout({ fencer_score: 15, opponent_score: 10 }))).toBe('win')
  })

  it('is a loss when fencer scored less', () => {
    expect(outcomeOf(makeBout({ fencer_score: 8, opponent_score: 15 }))).toBe('loss')
  })

  it('is a draw when scores are equal', () => {
    expect(outcomeOf(makeBout({ fencer_score: 5, opponent_score: 5 }))).toBe('draw')
  })
})

describe('computeBoutStats', () => {
  it('returns all-null/zero stats for an empty list', () => {
    const stats = computeBoutStats([])
    expect(stats).toEqual({
      total: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRatePct: null,
      avgScored: null,
      avgConceded: null,
      avgMargin: null,
      recentForm: [],
    })
  })

  it('tallies wins, losses, and draws', () => {
    const bouts = [
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ fencer_score: 8, opponent_score: 15 }), // loss
      makeBout({ fencer_score: 5, opponent_score: 5 }), // draw
    ]
    const stats = computeBoutStats(bouts)
    expect(stats.total).toBe(4)
    expect(stats.wins).toBe(2)
    expect(stats.losses).toBe(1)
    expect(stats.draws).toBe(1)
  })

  it('computes win rate as a rounded percentage', () => {
    const bouts = [
      makeBout({ fencer_score: 15, opponent_score: 10 }),
      makeBout({ fencer_score: 15, opponent_score: 10 }),
      makeBout({ fencer_score: 8, opponent_score: 15 }),
    ]
    // 2/3 = 66.666...% -> rounded to one decimal
    expect(computeBoutStats(bouts).winRatePct).toBe(66.7)
  })

  it('computes average scored/conceded/margin, rounded to one decimal', () => {
    const bouts = [
      makeBout({ fencer_score: 15, opponent_score: 12 }),
      makeBout({ fencer_score: 10, opponent_score: 15 }),
    ]
    const stats = computeBoutStats(bouts)
    expect(stats.avgScored).toBe(12.5)
    expect(stats.avgConceded).toBe(13.5)
    expect(stats.avgMargin).toBe(-1)
  })

  it('reports a negative margin when conceding more than scoring overall', () => {
    const bouts = [makeBout({ fencer_score: 5, opponent_score: 15 })]
    expect(computeBoutStats(bouts).avgMargin).toBe(-10)
  })

  it('takes recent form from the first 5 bouts, assuming newest-first input', () => {
    const bouts = [
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ fencer_score: 8, opponent_score: 15 }), // loss
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ fencer_score: 8, opponent_score: 15 }), // loss
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win, 6th — should be excluded
    ]
    expect(computeBoutStats(bouts).recentForm).toEqual(['win', 'loss', 'win', 'win', 'loss'])
  })

  it('does not pad recent form when there are fewer than 5 bouts', () => {
    const bouts = [makeBout({ fencer_score: 15, opponent_score: 10 })]
    expect(computeBoutStats(bouts).recentForm).toEqual(['win'])
  })
})

describe('groupBoutsByOpponent', () => {
  it('groups bouts under their opponent id', () => {
    const a1 = makeBout({ opponent_id: 'opp-a' })
    const a2 = makeBout({ opponent_id: 'opp-a' })
    const b1 = makeBout({ opponent_id: 'opp-b' })
    const grouped = groupBoutsByOpponent([a1, a2, b1])

    expect(grouped.get('opp-a')).toEqual([a1, a2])
    expect(grouped.get('opp-b')).toEqual([b1])
    expect(grouped.size).toBe(2)
  })

  it('preserves each bout\'s relative order within its group', () => {
    const first = makeBout({ opponent_id: 'opp-a', id: 'first' })
    const interleaved = makeBout({ opponent_id: 'opp-b', id: 'interleaved' })
    const second = makeBout({ opponent_id: 'opp-a', id: 'second' })
    const grouped = groupBoutsByOpponent([first, interleaved, second])

    expect(grouped.get('opp-a')?.map((b) => b.id)).toEqual(['first', 'second'])
  })

  it('returns an empty map for an empty list', () => {
    expect(groupBoutsByOpponent([]).size).toBe(0)
  })
})
