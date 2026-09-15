import { forgetPreloadedImage, isImagePreloaded, preloadImage } from '~/utils/preloadImage'
import type { ImageLoadProgress } from '~/utils/preloadImage'

export type SuperImageResourceStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface SuperImageCacheEntry {
  status: SuperImageResourceStatus
  promise?: Promise<boolean>
}

const MAX_STATUS_ENTRIES = 128
const statusCache = new Map<string, SuperImageCacheEntry>()

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
    source && (isImagePreloaded(source) || statusCache.get(source)?.status === 'loaded'),
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
  if (cached?.status === 'loaded' || isImagePreloaded(source)) {
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
    } else {
      statusCache.delete(source)
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
}

export function forgetSuperImage(source: string) {
  if (!source) return
  statusCache.delete(source)
  forgetPreloadedImage(source)
}
