import { vi } from 'vitest'
import type { Bout } from '../hooks/useBouts'
import type { Opponent } from '../hooks/useOpponents'

/** Shared fakes for page tests: each page test file vi.mock()s the data
 * hooks to return these, then sets `opponents`/`bouts` and inspects the
 * spies. Arrays are replaced (not mutated) per test via setPageData. */
export const pageData: { opponents: Opponent[]; bouts: Bout[] } = { opponents: [], bouts: [] }

export const createBout = vi.fn()
export const updateBout = vi.fn()
export const deleteBout = vi.fn()

export function setPageData(data: Partial<typeof pageData>) {
  Object.assign(pageData, { opponents: [], bouts: [] }, data)
  createBout.mockReset()
  updateBout.mockReset()
  deleteBout.mockReset()
}
