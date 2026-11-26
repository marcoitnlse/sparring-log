import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HistoryPage } from './HistoryPage'
import { NOTE_CATEGORIES } from '../lib/boutNotes'
import { makeBout } from '../test/fixtures'
import { setPageData, updateBout } from '../test/pageMocks'

vi.mock('../hooks/useBoutHistory', async () => {
  const { pageData, updateBout, deleteBout } = await import('../test/pageMocks')
  return {
    useBoutHistory: () => ({
      bouts: pageData.bouts,
      loading: false,
      loadingMore: false,
      hasMore: false,
      loadMore: () => {},
      error: null,
      updateBout,
      deleteBout,
    }),
  }
})

const [WORKED, NOT_WORKED, OTHER] = NOTE_CATEGORIES.map((c) => c.placeholder)

const bout = makeBout({
  id: 'bout-1',
  opponent_name: 'Sam',
  fencer_score: 15,
  opponent_score: 12,
  notes_worked: 'Counter-attacks to the arm',
  notes_not_worked: 'Fleche',
  notes_other: null,
})

function openEditForm() {
  render(<HistoryPage />)
  fireEvent.click(screen.getByText('Sam'))
}

beforeEach(() => {
  setPageData({ bouts: [bout] })
})

describe('HistoryPage edit form', () => {
  it('saves a cleared note as null so it is removed, not left unchanged', async () => {
    updateBout.mockResolvedValue({})
    openEditForm()
    expect((screen.getByPlaceholderText(WORKED) as HTMLTextAreaElement).value).toBe('Counter-attacks to the arm')

    fireEvent.change(screen.getByPlaceholderText(WORKED), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText(NOT_WORKED), { target: { value: '  Flèche, too early  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    // The form closes once the save succeeds.
    await screen.findByText('15–12')
    expect(screen.queryByPlaceholderText(WORKED)).toBeNull()
    expect(updateBout).toHaveBeenCalledWith(
      'bout-1',
      expect.objectContaining({ notesWorked: null, notesNotWorked: 'Flèche, too early', notesOther: null }),
    )
  })

  it('keeps the form open and shows the error when saving fails', async () => {
    updateBout.mockRejectedValue(new Error('permission denied'))
    openEditForm()
    fireEvent.change(screen.getByPlaceholderText(OTHER), { target: { value: 'New thought' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('permission denied')).toBeTruthy()
    expect((screen.getByPlaceholderText(OTHER) as HTMLTextAreaElement).value).toBe('New thought')
  })
})
