import { vi } from 'vitest'

export interface MockResult<T = unknown> {
  data: T
  error: { message: string; code?: string } | null
}

/** A chainable fake mimicking supabase-js's PostgrestFilterBuilder: every
 * query method returns itself, and the chain is awaitable directly (it
 * implements `.then`), matching how the real builder is both chainable
 * and a thenable — e.g. `.select().order().order()` is awaited with no
 * `.single()` in useBouts' refetch, while other call sites add `.single()`.
 * `.single()` is a no-op here; tests just set `data` to whatever shape
 * (array or single object) the call site expects back. */
export function createQueryBuilder<T>(result: MockResult<T>) {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'lt', 'order', 'limit', 'single']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (onFulfilled: (r: MockResult<T>) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  return builder
}

/** Queues one query-builder result per expected call to `supabase.from(...)`,
 * in call order — e.g. [initialFetchResult, mutationResult] for a hook that
 * fetches on mount and then performs one write. */
export function mockFromSequence(fromMock: ReturnType<typeof vi.fn>, results: MockResult[]) {
  for (const result of results) {
    fromMock.mockReturnValueOnce(createQueryBuilder(result))
  }
}
