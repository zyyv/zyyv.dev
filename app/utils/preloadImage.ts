const MAX_CACHED_IMAGES = 4

interface CachedImage {
  image: HTMLImageElement
  promise: Promise<boolean>
}

const imageCache = new Map<string, CachedImage>()

function touchCache(src: string, entry: CachedImage) {
  imageCache.delete(src)
  imageCache.set(src, entry)

  while (imageCache.size > MAX_CACHED_IMAGES) {
    const oldestSrc = imageCache.keys().next().value
    if (oldestSrc) imageCache.delete(oldestSrc)
  }
}

export function preloadImage(src: string): Promise<boolean> {
  if (!import.meta.client) return Promise.resolve(false)

  const cached = imageCache.get(src)
  if (cached) {
    touchCache(src, cached)
    return cached.promise
  }

  const image = new Image()
  image.decoding = 'async'

  const promise = new Promise<boolean>((resolve) => {
    image.onload = () => {
      void image.decode().then(
        () => resolve(true),
        () => resolve(true),
      )
    }
    image.onerror = () => resolve(false)
    image.src = src
  })

  const entry = { image, promise }
  touchCache(src, entry)
  void promise.then((loaded) => {
    if (!loaded && imageCache.get(src) === entry) imageCache.delete(src)
  })
  return promise
}
