/** Extracts a readable message from anything that might be thrown —
 * a real Error, or a plain Postgrest-style error object ({ message, code }). */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message
  }
  return fallback
}
