const MAX_CACHED_IMAGES = 6

export interface ImageLoadProgress {
  loadedBytes: number
  totalBytes: number
  percentage: number
}

interface PreloadImageOptions {
  expectedBytes?: number
  onProgress?: (progress: ImageLoadProgress) => void
}

interface CachedImage {
  image: HTMLImageElement
  promise: Promise<boolean>
  progress: ImageLoadProgress
  listeners: Set<(progress: ImageLoadProgress) => void>
  settled: boolean
}

const imageCache = new Map<string, CachedImage>()

function touchCache(src: string, entry: CachedImage) {
  imageCache.delete(src)
  imageCache.set(src, entry)

  if (imageCache.size <= MAX_CACHED_IMAGES) return

  for (const [cachedSrc, cachedEntry] of imageCache) {
    if (imageCache.size <= MAX_CACHED_IMAGES) break
    if (cachedEntry.settled) imageCache.delete(cachedSrc)
  }
}

function createProgress(loadedBytes: number, totalBytes: number): ImageLoadProgress {
  const percentage =
    totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 0
  return { loadedBytes, totalBytes, percentage }
}

function notifyProgress(entry: CachedImage, loadedBytes: number, totalBytes: number) {
  entry.progress = createProgress(loadedBytes, totalBytes)
  for (const listener of entry.listeners) listener(entry.progress)
}

async function decodeImage(image: HTMLImageElement, src: string): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    image.onload = () => {
      void image.decode().then(
        () => resolve(true),
        () => resolve(true),
      )
    }
    image.onerror = () => resolve(false)
    image.src = src
  })
}

async function fetchAndDecodeImage(
  src: string,
  expectedBytes: number,
  image: HTMLImageElement,
  entry: CachedImage,
): Promise<boolean> {
  try {
    const response = await fetch(src, { cache: 'force-cache' })
    if (!response.ok) return false

    const headerBytes = Number(response.headers.get('content-length'))
    const totalBytes = headerBytes > 0 ? headerBytes : expectedBytes
    const reader = response.body?.getReader()

    if (reader) {
      let loadedBytes = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        loadedBytes += value.byteLength
        notifyProgress(entry, loadedBytes, totalBytes)
      }
      notifyProgress(entry, totalBytes || loadedBytes, totalBytes || loadedBytes)
    } else {
      await response.arrayBuffer()
      notifyProgress(entry, totalBytes, totalBytes)
    }

    return await decodeImage(image, src)
  } catch {
    const loaded = await decodeImage(image, src)
    if (loaded) notifyProgress(entry, expectedBytes, expectedBytes)
    return loaded
  }
}

export function preloadImage(src: string, options: PreloadImageOptions = {}): Promise<boolean> {
  if (!import.meta.client) return Promise.resolve(false)

  const cached = imageCache.get(src)
  if (cached) {
    touchCache(src, cached)
    const progressListener = options.onProgress
    if (progressListener) {
      progressListener(cached.progress)
      cached.listeners.add(progressListener)
      void cached.promise.finally(() => cached.listeners.delete(progressListener))
    }
    return cached.promise
  }

  const expectedBytes = Math.max(0, options.expectedBytes ?? 0)
  const image = new Image()
  image.decoding = 'async'

  const entry: CachedImage = {
    image,
    promise: Promise.resolve(false),
    progress: createProgress(0, expectedBytes),
    listeners: new Set(),
    settled: false,
  }

  if (options.onProgress) entry.listeners.add(options.onProgress)
  entry.promise = fetchAndDecodeImage(src, expectedBytes, image, entry).then((loaded) => {
    entry.settled = true
    entry.listeners.clear()
    if (!loaded && imageCache.get(src) === entry) imageCache.delete(src)
    else if (imageCache.get(src) === entry) touchCache(src, entry)
    return loaded
  })

  touchCache(src, entry)
  options.onProgress?.(entry.progress)
  return entry.promise
}
