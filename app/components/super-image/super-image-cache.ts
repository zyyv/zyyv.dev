import { isImagePreloaded, preloadImage } from '~/utils/preloadImage'
import type { ImageLoadProgress } from '~/utils/preloadImage'

export type SuperImageResourceStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface SuperImageCacheEntry {
  status: SuperImageResourceStatus
  promise?: Promise<boolean>
}

const MAX_STATUS_ENTRIES = 128
const statusCache = new Map<string, SuperImageCacheEntry>()

const MAX_RESOURCE_CACHE_ENTRIES = 128
const RESOURCE_SESSION_STORAGE_KEY = 'super-image:loaded-sources'
const loadedResourceCache = new Map<string, true>()
let resourceCacheHydrated = false

function getSessionStorage(): Storage | null {
  if (!import.meta.client) return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function persistResourceCache() {
  const storage = getSessionStorage()
  if (!storage) return

  try {
    storage.setItem(RESOURCE_SESSION_STORAGE_KEY, JSON.stringify([...loadedResourceCache.keys()]))
  } catch {
    // sessionStorage is optional. The in-memory cache remains authoritative.
  }
}

function hydrateResourceCache() {
  if (resourceCacheHydrated) return
  resourceCacheHydrated = true

  const storage = getSessionStorage()
  if (!storage) return

  try {
    const raw = storage.getItem(RESOURCE_SESSION_STORAGE_KEY)
    if (!raw) return

    const sources: unknown = JSON.parse(raw)
    if (!Array.isArray(sources)) return

    for (const source of sources) {
      if (typeof source !== 'string' || !source) continue
      loadedResourceCache.set(source, true)
      if (loadedResourceCache.size >= MAX_RESOURCE_CACHE_ENTRIES) break
    }
  } catch {
    // Ignore malformed or unavailable session storage and continue in memory.
  }
}

function touchResource(source: string) {
  loadedResourceCache.delete(source)
  loadedResourceCache.set(source, true)

  while (loadedResourceCache.size > MAX_RESOURCE_CACHE_ENTRIES) {
    const oldestSource = loadedResourceCache.keys().next().value
    if (!oldestSource) break
    loadedResourceCache.delete(oldestSource)
  }
}

/** The single process-wide cache used by every SuperImage instance. */
export const superImageResourceCache = {
  has(source: string): boolean {
    hydrateResourceCache()
    if (!source || !loadedResourceCache.has(source)) return false
    touchResource(source)
    return true
  },
  markLoaded(source: string) {
    hydrateResourceCache()
    if (!source) return
    touchResource(source)
    persistResourceCache()
  },
  forget(source: string) {
    hydrateResourceCache()
    if (!source || !loadedResourceCache.delete(source)) return
    persistResourceCache()
  },
}

function touch(source: string, entry: SuperImageCacheEntry) {
  statusCache.delete(source)
  statusCache.set(source, entry)

  if (statusCache.size <= MAX_STATUS_ENTRIES) return
  for (const [cachedSource, cachedEntry] of statusCache) {
    if (statusCache.size <= MAX_STATUS_ENTRIES) break
    if (cachedEntry.status !== 'loading') statusCache.delete(cachedSource)
  }
}

export function isSuperImageCached(source: string): boolean {
  return Boolean(
    source &&
    (superImageResourceCache.has(source) ||
      isImagePreloaded(source) ||
      statusCache.get(source)?.status === 'loaded'),
  )
}

export function preloadSuperImage(
  source: string,
  options: {
    fetchPriority?: 'high' | 'low' | 'auto'
    expectedBytes?: number
    onProgress?: (progress: ImageLoadProgress) => void
  } = {},
): Promise<boolean> {
  if (!source || !import.meta.client) return Promise.resolve(false)

  const cached = statusCache.get(source)
  if (cached?.status === 'loaded' || isSuperImageCached(source)) {
    if (cached) touch(source, cached)
    else statusCache.set(source, { status: 'loaded' })
    return Promise.resolve(true)
  }
  if (cached?.promise) {
    touch(source, cached)
    return cached.promise
  }

  const entry: SuperImageCacheEntry = { status: 'loading' }
  const request = preloadImage(source, {
    expectedBytes: options.expectedBytes,
    fetchPriority: options.fetchPriority,
    onProgress: options.onProgress,
  }).then((loaded) => {
    entry.status = loaded ? 'loaded' : 'error'
    entry.promise = undefined
    if (loaded) {
      touch(source, entry)
      superImageResourceCache.markLoaded(source)
    } else {
      statusCache.delete(source)
      superImageResourceCache.forget(source)
    }
    return loaded
  })

  entry.promise = request
  touch(source, entry)
  return request
}

export function markSuperImageLoaded(source: string) {
  if (!source) return
  const entry = statusCache.get(source) ?? { status: 'idle' as const }
  entry.status = 'loaded'
  entry.promise = undefined
  touch(source, entry)
  superImageResourceCache.markLoaded(source)
}

export function forgetSuperImage(source: string) {
  if (!source) return
  statusCache.delete(source)
  superImageResourceCache.forget(source)
}
