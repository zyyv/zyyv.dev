import type { MaybeRefOrGetter } from 'vue'
import type { Photo } from '~/types'

export interface ImageColor {
  hex: string
  share: number
}

export type ImageColorsStatus = 'idle' | 'analyzing' | 'ready' | 'error'

interface ColorBucket {
  red: number
  green: number
  blue: number
  count: number
}

const ANALYSIS_SIZE = 96
const QUANTIZATION_STEP = 24
const MAX_COLORS = 5
const MIN_COLOR_DISTANCE = 42

export function useImageColors(photo: MaybeRefOrGetter<Photo | null>) {
  const colors = shallowRef<ImageColor[]>([])
  const status = shallowRef<ImageColorsStatus>('idle')
  const error = shallowRef<string | null>(null)
  let requestId = 0
  let activeController: AbortController | null = null

  watch(
    () => toValue(photo)?.id,
    async (photoId, _previousId, onCleanup) => {
      const currentRequest = ++requestId
      activeController?.abort()
      colors.value = []
      error.value = null

      if (!import.meta.client || !photoId) {
        status.value = 'idle'
        return
      }

      const controller = new AbortController()
      activeController = controller
      onCleanup(() => {
        controller.abort()
        if (activeController === controller) activeController = null
      })
      status.value = 'analyzing'

      try {
        const currentPhoto = toValue(photo)
        if (!currentPhoto) {
          status.value = 'idle'
          return
        }

        const image = await loadAnalysisImage(currentPhoto, controller.signal)
        if (controller.signal.aborted || currentRequest !== requestId) return

        colors.value = extractColors(image)
        status.value = colors.value.length ? 'ready' : 'error'
        if (!colors.value.length) error.value = 'No colors could be sampled from this image.'
      } catch (cause) {
        if (controller.signal.aborted || currentRequest !== requestId) return
        status.value = 'error'
        error.value = cause instanceof Error ? cause.message : 'Color analysis failed.'
      } finally {
        if (activeController === controller) activeController = null
      }
    },
    { immediate: true },
  )

  function analyze() {
    const currentPhoto = toValue(photo)
    if (!currentPhoto) return

    const currentRequest = ++requestId
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller
    void analyzePhoto(currentPhoto, currentRequest, controller)
  }

  onBeforeUnmount(() => {
    requestId += 1
    activeController?.abort()
  })

  async function analyzePhoto(
    currentPhoto: Photo,
    currentRequest: number,
    controller: AbortController,
  ) {
    status.value = 'analyzing'
    error.value = null

    try {
      const image = await loadAnalysisImage(currentPhoto, controller.signal)
      if (currentRequest !== requestId) return
      colors.value = extractColors(image)
      status.value = colors.value.length ? 'ready' : 'error'
      if (!colors.value.length) error.value = 'No colors could be sampled from this image.'
    } catch (cause) {
      if (currentRequest !== requestId) return
      status.value = 'error'
      error.value = cause instanceof Error ? cause.message : 'Color analysis failed.'
    } finally {
      if (activeController === controller) activeController = null
    }
  }

  return {
    colors: readonly(colors),
    status: readonly(status),
    error: readonly(error),
    analyze,
  }
}

async function loadAnalysisImage(photo: Photo, signal: AbortSignal): Promise<HTMLImageElement> {
  const image = new Image()
  image.decoding = 'async'
  const variant = photo.mediaType === 'image' ? 'compressed' : 'thumbnail'
  const source = `/api/photo-assets/${encodeURIComponent(photo.id)}/${variant}`

  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      cleanup()
      image.src = ''
      reject(new DOMException('Color analysis was cancelled.', 'AbortError'))
    }
    const onLoad = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('The image preview could not be loaded.'))
    }
    const cleanup = () => {
      signal.removeEventListener('abort', onAbort)
      image.removeEventListener('load', onLoad)
      image.removeEventListener('error', onError)
    }

    signal.addEventListener('abort', onAbort, { once: true })
    image.addEventListener('load', onLoad, { once: true })
    image.addEventListener('error', onError, { once: true })
    if (signal.aborted) {
      onAbort()
      return
    }
    image.src = source
  })

  if (signal.aborted) throw new DOMException('Color analysis was cancelled.', 'AbortError')
  await image.decode().catch(() => undefined)
  return image
}

function extractColors(image: HTMLImageElement): ImageColor[] {
  const scale = Math.min(
    1,
    ANALYSIS_SIZE / Math.max(1, image.naturalWidth),
    ANALYSIS_SIZE / Math.max(1, image.naturalHeight),
  )
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('The browser could not create an image analysis canvas.')
  context.drawImage(image, 0, 0, width, height)

  const pixels = context.getImageData(0, 0, width, height).data
  const buckets = new Map<string, ColorBucket>()
  let sampledPixels = 0

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0
    if (alpha < 180) continue

    const red = pixels[index] ?? 0
    const green = pixels[index + 1] ?? 0
    const blue = pixels[index + 2] ?? 0
    const bucketRed = Math.floor(red / QUANTIZATION_STEP) * QUANTIZATION_STEP
    const bucketGreen = Math.floor(green / QUANTIZATION_STEP) * QUANTIZATION_STEP
    const bucketBlue = Math.floor(blue / QUANTIZATION_STEP) * QUANTIZATION_STEP
    const key = `${bucketRed},${bucketGreen},${bucketBlue}`
    const bucket = buckets.get(key) || {
      red: 0,
      green: 0,
      blue: 0,
      count: 0,
    }

    bucket.red += red
    bucket.green += green
    bucket.blue += blue
    bucket.count += 1
    buckets.set(key, bucket)
    sampledPixels += 1
  }

  const candidates = [...buckets.values()]
    .sort((first, second) => second.count - first.count)
    .map((bucket) => {
      const red = Math.round(bucket.red / bucket.count)
      const green = Math.round(bucket.green / bucket.count)
      const blue = Math.round(bucket.blue / bucket.count)
      return {
        red,
        green,
        blue,
        count: bucket.count,
        hex: toHex(red, green, blue),
      }
    })

  const selected: typeof candidates = []
  for (const candidate of candidates) {
    if (selected.length >= MAX_COLORS) break
    if (!selectedColorsTooClose(candidate, selected)) selected.push(candidate)
  }

  return selected.map((color) => ({
    hex: color.hex,
    share: Math.max(1, Math.round((color.count / Math.max(1, sampledPixels)) * 100)),
  }))
}

function selectedColorsTooClose(
  candidate: { red: number; green: number; blue: number },
  selected: Array<{ red: number; green: number; blue: number }>,
) {
  return selected.some((color) => {
    const red = candidate.red - color.red
    const green = candidate.green - color.green
    const blue = candidate.blue - color.blue
    return Math.sqrt(red * red + green * green + blue * blue) < MIN_COLOR_DISTANCE
  })
}

function toHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}
