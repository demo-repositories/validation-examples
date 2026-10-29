import type {Path} from 'sanity'

/**
 * React Hook Form names fields with dots and array indexes.
 * Sanity markers identify array items by `_key`, so convert that path before calling `setError`.
 */
export function markerFieldName(path: Path, document: Record<string, unknown>): string | undefined {
  if (path.length === 0) return undefined

  const parts: string[] = []
  let current: unknown = document

  for (const segment of path) {
    if (typeof segment === 'object' && !Array.isArray(segment)) {
      if (!Array.isArray(current)) return undefined
      const index = current.findIndex(
        (item) => Boolean(item && typeof item === 'object' && '_key' in item && item._key === segment._key),
      )
      if (index < 0) return undefined
      parts.push(String(index))
      current = current[index]
      continue
    }

    const key = String(Array.isArray(segment) ? segment[0] : segment)
    parts.push(key)
    current = current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
  }

  return parts.join('.')
}
