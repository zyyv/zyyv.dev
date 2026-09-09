const STORAGE_KEY = 'zyyv:photo-dialog-filmstrip-scroll'
const MAX_PERSISTED_ENTRIES = 12
const memoryCache = new Map<string, number>()
const pendingCache = new Map<string, number>()

let persistTimer: ReturnType<typeof setTimeout> | undefined

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readPersistedCache(): Record<string, number> {
  if (!import.meta.client) return {}

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}

    const entries: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        entries[key] = value
      }
    }
    return entries
  } catch {
    return {}
  }
}

function persistCache() {
  if (!import.meta.client || !pendingCache.size) return

  const entries = readPersistedCache()
  for (const [key, value] of pendingCache) entries[key] = value

  const limitedEntries = Object.fromEntries(Object.entries(entries).slice(-MAX_PERSISTED_ENTRIES))

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(limitedEntries))
    pendingCache.clear()
  } catch {
    // Memory cache remains available when storage is blocked or full.
  }
}

function schedulePersistence() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = undefined
    persistCache()
  }, 120)
}

export function getPhotoFilmstripCacheKey(photoIds: readonly string[]): string {
  let hash = 2166136261

  for (const photoId of photoIds) {
    for (let index = 0; index < photoId.length; index += 1) {
      hash = Math.imul(hash ^ photoId.charCodeAt(index), 16777619)
    }
    hash = Math.imul(hash ^ 124, 16777619)
  }

  return `${photoIds.length}:${(hash >>> 0).toString(36)}`
}

export function usePhotoFilmstripScroll() {
  function read(key: string): number | null {
    const memoryValue = memoryCache.get(key)
    if (memoryValue !== undefined) return memoryValue

    const persistedValue = readPersistedCache()[key]
    if (persistedValue === undefined) return null

    memoryCache.set(key, persistedValue)
    return persistedValue
  }

  function save(key: string, scrollLeft: number) {
    if (!import.meta.client || !Number.isFinite(scrollLeft)) return

    const value = Math.max(0, Math.round(scrollLeft))
    memoryCache.set(key, value)
    pendingCache.set(key, value)
    schedulePersistence()
  }

  function flush(key: string) {
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = undefined
    }

    const memoryValue = memoryCache.get(key)
    if (memoryValue !== undefined) pendingCache.set(key, memoryValue)
    persistCache()
  }

  return { read, save, flush }
}
