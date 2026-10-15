import { describe, expect, it } from 'vitest'
import { computeBoutStats, filterBouts, groupBoutsByOpponent, outcomeOf } from './boutStats'
import { makeBout } from '../test/fixtures'

describe('outcomeOf', () => {
  it('is a win when fencer scored more', () => {
    expect(outcomeOf(makeBout({ fencer_score: 15, opponent_score: 10 }))).toBe('win')
  })

  it('is a loss when fencer scored less', () => {
    expect(outcomeOf(makeBout({ fencer_score: 8, opponent_score: 15 }))).toBe('loss')
  })

})

describe('computeBoutStats', () => {
  it('returns all-null/zero stats for an empty list', () => {
    const stats = computeBoutStats([])
    expect(stats).toEqual({
      total: 0,
      wins: 0,
      losses: 0,
      winRatePct: null,
      avgScored: null,
      avgConceded: null,
      avgMargin: null,
      recentForm: [],
    })
  })

  it('tallies wins and losses', () => {
    const bouts = [
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ fencer_score: 8, opponent_score: 15 }), // loss
    ]
    const stats = computeBoutStats(bouts)
    expect(stats.total).toBe(3)
    expect(stats.wins).toBe(2)
    expect(stats.losses).toBe(1)
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

describe('filterBouts', () => {
  const allAll = { opponentId: 'all', format: 'all', targetScore: 'all', handedness: 'all' } as const

  it('returns everything when every filter is "all"', () => {
    const bouts = [makeBout(), makeBout(), makeBout()]
    expect(filterBouts(bouts, allAll)).toEqual(bouts)
  })

  it('narrows by opponent', () => {
    const match = makeBout({ opponent_id: 'opp-a' })
    const other = makeBout({ opponent_id: 'opp-b' })
    expect(filterBouts([match, other], { ...allAll, opponentId: 'opp-a' })).toEqual([match])
  })

  it('narrows by match format', () => {
    const free = makeBout({ bout_format: 'free' })
    const timed = makeBout({ bout_format: 'timed' })
    expect(filterBouts([free, timed], { ...allAll, format: 'timed' })).toEqual([timed])
  })

  it('narrows by target score', () => {
    const to5 = makeBout({ target_score: 5 })
    const to15 = makeBout({ target_score: 15 })
    expect(filterBouts([to5, to15], { ...allAll, targetScore: 5 })).toEqual([to5])
  })

  it('narrows by opponent handedness', () => {
    const vsLefty = makeBout({ opponent_handedness: 'left' })
    const vsRighty = makeBout({ opponent_handedness: 'right' })
    expect(filterBouts([vsLefty, vsRighty], { ...allAll, handedness: 'left' })).toEqual([vsLefty])
  })

  it('excludes bouts with no handedness on record when filtering by handedness', () => {
    const unknown = makeBout({ opponent_handedness: null })
    expect(filterBouts([unknown], { ...allAll, handedness: 'left' })).toEqual([])
  })

  it('combines filters with AND, not OR', () => {
    const matchesBoth = makeBout({ opponent_id: 'opp-a', bout_format: 'timed' })
    const matchesOnlyOpponent = makeBout({ opponent_id: 'opp-a', bout_format: 'free' })
    const matchesOnlyFormat = makeBout({ opponent_id: 'opp-b', bout_format: 'timed' })

    const result = filterBouts([matchesBoth, matchesOnlyOpponent, matchesOnlyFormat], {
      ...allAll,
      opponentId: 'opp-a',
      format: 'timed',
    })

    expect(result).toEqual([matchesBoth])
  })
})
