import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useScoreForm } from './useScoreForm'

describe('useScoreForm', () => {
  it('detects a draw when scores are equal', () => {
    const { result } = renderHook(() => useScoreForm(5, 5, 15))
    expect(result.current.isDraw).toBe(true)
  })

  it('does not show the draw error until a save attempt fails', () => {
    const { result } = renderHook(() => useScoreForm(0, 0, 15))
    expect(result.current.isDraw).toBe(true)
    expect(result.current.showDrawError).toBe(false)

    act(() => {
      result.current.checkCanSave()
    })
    expect(result.current.showDrawError).toBe(true)
  })

  it('checkCanSave returns false and surfaces the error for a draw', () => {
    const { result } = renderHook(() => useScoreForm(10, 10, 15))

    let canSave = true
    act(() => {
      canSave = result.current.checkCanSave()
    })
    expect(canSave).toBe(false)
    expect(result.current.showDrawError).toBe(true)
  })

  it('checkCanSave returns true and shows nothing for a non-draw', () => {
    const { result } = renderHook(() => useScoreForm(15, 10, 15))

    let canSave = false
    act(() => {
      canSave = result.current.checkCanSave()
    })
    expect(canSave).toBe(true)
    expect(result.current.showDrawError).toBe(false)
  })

  it('clears the draw error as soon as either score changes', () => {
    const { result } = renderHook(() => useScoreForm(10, 10, 15))

    act(() => {
      result.current.checkCanSave()
    })
    expect(result.current.showDrawError).toBe(true)

    act(() => {
      result.current.setFencerScore(12)
    })
    expect(result.current.showDrawError).toBe(false)
    expect(result.current.isDraw).toBe(false)
  })

  it('clamps both scores down when the target score is lowered', () => {
    const { result } = renderHook(() => useScoreForm(12, 8, 15))

    act(() => {
      result.current.setTargetScore(10)
    })
    expect(result.current.targetScore).toBe(10)
    expect(result.current.fencerScore).toBe(10)
    expect(result.current.opponentScore).toBe(8)
  })

  it('does not raise scores when the target score is increased', () => {
    const { result } = renderHook(() => useScoreForm(3, 2, 5))

    act(() => {
      result.current.setTargetScore(15)
    })
    expect(result.current.fencerScore).toBe(3)
    expect(result.current.opponentScore).toBe(2)
  })

  it('resetScores sets both scores and clears the draw error', () => {
    const { result } = renderHook(() => useScoreForm(10, 10, 15))

    act(() => {
      result.current.checkCanSave()
    })
    expect(result.current.showDrawError).toBe(true)

    act(() => {
      result.current.resetScores(0, 0)
    })
    expect(result.current.fencerScore).toBe(0)
    expect(result.current.opponentScore).toBe(0)
    expect(result.current.showDrawError).toBe(false)
  })
})
