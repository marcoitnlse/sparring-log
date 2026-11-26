import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuickLogPage } from './QuickLogPage'
import { NextOpponentPage } from './NextOpponentPage'
import { NOTE_CATEGORIES } from '../lib/boutNotes'
import { clearQuickLogDraft } from '../lib/quickLogDraft'
import { makeOpponent } from '../test/fixtures'
import { createBout, setPageData } from '../test/pageMocks'

vi.mock('../hooks/useOpponents', async () => {
  const { pageData } = await import('../test/pageMocks')
  return { useOpponents: () => ({ opponents: pageData.opponents, loading: false, error: null }) }
})
vi.mock('../hooks/useBouts', async () => {
  const { pageData, createBout } = await import('../test/pageMocks')
  return { useBouts: () => ({ bouts: pageData.bouts, loading: false, error: null, createBout }) }
})

const alex = makeOpponent({ id: 'opp-alex', name: 'Alex' })
const sam = makeOpponent({ id: 'opp-sam', name: 'Sam' })

const [WORKED, NOT_WORKED, OTHER] = NOTE_CATEGORIES.map((c) => c.placeholder)

function renderLog() {
  return render(
    <MemoryRouter>
      <QuickLogPage />
    </MemoryRouter>,
  )
}

function opponentSelect() {
  return screen.getByRole('combobox') as HTMLSelectElement
}

function scoreInputs() {
  const [you, opponent] = screen.getAllByRole('spinbutton') as HTMLInputElement[]
  return { you, opponent }
}

function enterBout(opponentId: string, you: number, opponent: number) {
  fireEvent.change(opponentSelect(), { target: { value: opponentId } })
  fireEvent.change(scoreInputs().you, { target: { value: String(you) } })
  fireEvent.change(scoreInputs().opponent, { target: { value: String(opponent) } })
}

beforeEach(() => {
  clearQuickLogDraft()
  setPageData({ opponents: [alex, sam] })
})

describe('QuickLogPage', () => {
  it('saves the bout with trimmed notes, leaving empty ones out', async () => {
    createBout.mockResolvedValue({})
    renderLog()
    enterBout('opp-sam', 15, 12)
    fireEvent.click(screen.getByText('+ Add note'))
    fireEvent.change(screen.getByPlaceholderText(WORKED), { target: { value: '  Flèche worked  ' } })
    fireEvent.change(screen.getByPlaceholderText(OTHER), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save bout' }))

    expect(await screen.findByText('Bout logged: 15–12 vs. Sam')).toBeTruthy()
    expect(createBout).toHaveBeenCalledWith(
      expect.objectContaining({
        opponentId: 'opp-sam',
        fencerScore: 15,
        opponentScore: 12,
        notesWorked: 'Flèche worked',
        notesNotWorked: undefined,
        notesOther: undefined,
      }),
    )
  })

  it('after saving, keeps the opponent but resets scores and notes', async () => {
    createBout.mockResolvedValue({})
    renderLog()
    enterBout('opp-sam', 15, 12)
    fireEvent.click(screen.getByText('+ Add note'))
    fireEvent.change(screen.getByPlaceholderText(NOT_WORKED), { target: { value: 'Too many lunges' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save bout' }))
    await screen.findByText(/Bout logged/)

    expect(opponentSelect().value).toBe('opp-sam')
    expect(scoreInputs().you.value).toBe('0')
    expect(scoreInputs().opponent.value).toBe('0')
    // Notes collapse back behind the button, and reopen empty.
    fireEvent.click(screen.getByText('+ Add note'))
    expect((screen.getByPlaceholderText(NOT_WORKED) as HTMLTextAreaElement).value).toBe('')
  })

  it("shows the error and keeps what was entered when saving fails", async () => {
    createBout.mockRejectedValue(new Error('network down'))
    renderLog()
    enterBout('opp-alex', 10, 15)
    fireEvent.click(screen.getByRole('button', { name: 'Save bout' }))

    expect(await screen.findByText('Not saved: network down')).toBeTruthy()
    expect(scoreInputs().you.value).toBe('10')
    expect(scoreInputs().opponent.value).toBe('15')
  })

  it('refuses to save a draw', () => {
    renderLog()
    enterBout('opp-alex', 7, 7)
    fireEvent.click(screen.getByRole('button', { name: 'Save bout' }))

    expect(screen.getByText(/Scores can't be equal/)).toBeTruthy()
    expect(createBout).not.toHaveBeenCalled()
  })

  it('keeps an unsaved bout when switching tabs and coming back', () => {
    const first = renderLog()
    enterBout('opp-alex', 9, 4)
    fireEvent.click(screen.getByText('+ Add note'))
    fireEvent.change(screen.getByPlaceholderText(OTHER), { target: { value: 'Half-written thought' } })
    first.unmount() // leaving the tab unmounts the page

    renderLog()
    expect(opponentSelect().value).toBe('opp-alex')
    expect(scoreInputs().you.value).toBe('9')
    expect(scoreInputs().opponent.value).toBe('4')
    expect((screen.getByPlaceholderText(OTHER) as HTMLTextAreaElement).value).toBe('Half-written thought')
  })

  it('starts on the opponent picked in the Next tab', () => {
    const next = render(
      <MemoryRouter>
        <NextOpponentPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opp-sam' } })
    next.unmount()

    renderLog()
    expect(opponentSelect().value).toBe('opp-sam')
  })
})
