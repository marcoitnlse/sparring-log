import { useState } from 'react'
import type { TargetScore } from '../types/database'

/** Shared score-entry state/logic for the Log page and History's edit
 * form: draw detection (shown only after a failed save attempt, cleared
 * on the next edit), and clamping both scores to the target when it
 * changes. Extracted once this was duplicated verbatim in both places. */
export function useScoreForm(initialFencerScore: number, initialOpponentScore: number, initialTargetScore: TargetScore) {
  const [fencerScore, setFencerScoreState] = useState(initialFencerScore)
  const [opponentScore, setOpponentScoreState] = useState(initialOpponentScore)
  const [targetScore, setTargetScoreState] = useState(initialTargetScore)
  const [showDrawError, setShowDrawError] = useState(false)

  const isDraw = fencerScore === opponentScore

  function setFencerScore(value: number) {
    setFencerScoreState(value)
    setShowDrawError(false)
  }

  function setOpponentScore(value: number) {
    setOpponentScoreState(value)
    setShowDrawError(false)
  }

  function setTargetScore(next: TargetScore) {
    setTargetScoreState(next)
    setFencerScoreState((s) => Math.min(s, next))
    setOpponentScoreState((s) => Math.min(s, next))
  }

  function resetScores(fencer: number, opponent: number) {
    setFencerScoreState(fencer)
    setOpponentScoreState(opponent)
    setShowDrawError(false)
  }

  /** Call before saving — returns false (and surfaces the error) if the
   * current scores are a draw. */
  function checkCanSave(): boolean {
    if (isDraw) {
      setShowDrawError(true)
      return false
    }
    return true
  }

  return {
    fencerScore,
    opponentScore,
    targetScore,
    isDraw,
    showDrawError,
    setFencerScore,
    setOpponentScore,
    setTargetScore,
    resetScores,
    checkCanSave,
  }
}
