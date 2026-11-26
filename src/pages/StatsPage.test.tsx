import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StatsPage } from './StatsPage'
import { makeBout, makeOpponent } from '../test/fixtures'
import { setPageData } from '../test/pageMocks'

vi.mock('../hooks/useOpponents', async () => {
  const { pageData } = await import('../test/pageMocks')
  return { useOpponents: () => ({ opponents: pageData.opponents, loading: false, error: null }) }
})
vi.mock('../hooks/useBouts', async () => {
  const { pageData } = await import('../test/pageMocks')
  return { useBouts: () => ({ bouts: pageData.bouts, loading: false, error: null }) }
})

const alex = makeOpponent({ id: 'opp-alex', name: 'Alex' })
const sam = makeOpponent({ id: 'opp-sam', name: 'Sam' })

beforeEach(() => {
  setPageData({
    opponents: [alex, sam],
    bouts: [
      makeBout({ opponent_id: 'opp-alex', fencer_score: 15, opponent_score: 10 }), // win
      makeBout({ opponent_id: 'opp-sam', fencer_score: 8, opponent_score: 15 }), // loss
    ],
  })
})

describe('StatsPage filters', () => {
  it('"Clear all" resets every filter and only shows while one is set', () => {
    render(<StatsPage />)
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull()
    expect(screen.getByText('50%')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opp-alex' } })
    fireEvent.click(screen.getByRole('button', { name: 'To 15' }))
    expect(screen.getByRole('button', { name: /Filters \(2\)/ })).toBeTruthy()
    expect(screen.getByText('100%')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByRole('button', { name: /^Filters/ }).textContent).not.toMatch(/\(/)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('all')
    expect(screen.getByText('50%')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull()
  })
})
