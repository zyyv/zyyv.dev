import { onBeforeUnmount, readonly, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { Photo } from '~/types'

export type HistogramChannel = 'red' | 'green' | 'blue' | 'luminance'

export interface ImageHistogram {
  red: readonly number[]
  green: readonly number[]
  blue: readonly number[]
  luminance: readonly number[]
  sampleCount: number
  shadowClipping: number
  highlightClipping: number
}

export type ImageHistogramStatus = 'idle' | 'analyzing' | 'ready' | 'error'

const HISTOGRAM_SIZE = 256
const ANALYSIS_SIZE = 320
const HISTOGRAM_VERSION = 1

const memoryCache = new Map<string, ImageHistogram>()

export function useImageHistogram(photo: MaybeRefOrGetter<Photo | null>) {
  const histogram = shallowRef<ImageHistogram | null>(null)
  const status = shallowRef<ImageHistogramStatus>('idle')
  const error = shallowRef<string | null>(null)
  let requestId = 0
  let activeController: AbortController | null = null

  watch(
    () => {
      const currentPhoto = toValue(photo)
      return currentPhoto ? getPhotoCacheKey(currentPhoto) : null
    },
    (photoKey, _previousKey, onCleanup) => {
      const currentRequest = ++requestId
      activeController?.abort()
      histogram.value = null
      error.value = null

      if (!import.meta.client || !photoKey) {
        status.value = 'idle'
        return
      }

      const currentPhoto = toValue(photo)
      if (!currentPhoto || currentPhoto.mediaType !== 'image') {
        status.value = 'idle'
        return
      }

      const controller = new AbortController()
      activeController = controller
      onCleanup(() => {
        controller.abort()
        if (activeController === controller) activeController = null
      })

      void analyzePhoto(currentPhoto, currentRequest, controller)
    },
    { immediate: true },
  )

  function analyze() {
    const currentPhoto = toValue(photo)
    if (!currentPhoto || currentPhoto.mediaType !== 'image') return

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
      const cacheKey = getPhotoCacheKey(currentPhoto)
      const cachedHistogram = memoryCache.get(cacheKey)
      if (cachedHistogram) {
        if (currentRequest !== requestId || controller.signal.aborted) return
        histogram.value = cloneHistogram(cachedHistogram)
        status.value = 'ready'
        return
      }

      const image = await loadAnalysisImage(currentPhoto, controller.signal)
      if (currentRequest !== requestId || controller.signal.aborted) return

      const analyzedHistogram = extractHistogram(image)
      if (!analyzedHistogram.sampleCount) {
        status.value = 'error'
        error.value = 'No visible pixels could be sampled from this image.'
        return
      }

      memoryCache.set(cacheKey, analyzedHistogram)
      histogram.value = cloneHistogram(analyzedHistogram)
      status.value = 'ready'
    } catch (cause) {
      if (currentRequest !== requestId || controller.signal.aborted) return
      status.value = 'error'
      error.value = cause instanceof Error ? cause.message : 'Histogram analysis failed.'
    } finally {
      if (activeController === controller) activeController = null
    }
  }

  return {
    histogram: readonly(histogram),
    status: readonly(status),
    error: readonly(error),
    analyze,
  }
}

function getPhotoCacheKey(photo: Photo) {
  const modifiedAt =
    photo.modifiedAt instanceof Date ? String(photo.modifiedAt.getTime()) : String(photo.modifiedAt)

  return [HISTOGRAM_VERSION, photo.id, modifiedAt, ANALYSIS_SIZE].join(':')
}

async function loadAnalysisImage(photo: Photo, signal: AbortSignal): Promise<HTMLImageElement> {
  const image = new Image()
  image.decoding = 'async'
  const source = `/api/photo-assets/${encodeURIComponent(photo.id)}/compressed`

  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      cleanup()
      image.src = ''
      reject(new DOMException('Histogram analysis was cancelled.', 'AbortError'))
    }
    const onLoad = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('The compressed image could not be loaded.'))
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

  if (signal.aborted) throw new DOMException('Histogram analysis was cancelled.', 'AbortError')
  await image.decode().catch(() => undefined)
  return image
}

function extractHistogram(image: HTMLImageElement): ImageHistogram {
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  if (!sourceWidth || !sourceHeight) throw new Error('The image has no readable dimensions.')

  const scale = Math.min(1, ANALYSIS_SIZE / sourceWidth, ANALYSIS_SIZE / sourceHeight)
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('The browser could not create an image analysis canvas.')
  context.drawImage(image, 0, 0, width, height)

  const pixels = context.getImageData(0, 0, width, height).data
  const red = createBins()
  const green = createBins()
  const blue = createBins()
  const luminance = createBins()
  let sampleCount = 0
  let shadowPixels = 0
  let highlightPixels = 0

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0
    if (alpha < 180) continue

    const redValue = pixels[index] ?? 0
    const greenValue = pixels[index + 1] ?? 0
    const blueValue = pixels[index + 2] ?? 0
    const luminanceValue = Math.round(redValue * 0.2126 + greenValue * 0.7152 + blueValue * 0.0722)

    red[redValue] = (red[redValue] ?? 0) + 1
    green[greenValue] = (green[greenValue] ?? 0) + 1
    blue[blueValue] = (blue[blueValue] ?? 0) + 1
    luminance[luminanceValue] = (luminance[luminanceValue] ?? 0) + 1
    sampleCount += 1
    if (luminanceValue <= 2) shadowPixels += 1
    if (luminanceValue >= 253) highlightPixels += 1
  }

  return {
    red,
    green,
    blue,
    luminance,
    sampleCount,
    shadowClipping: toPercentage(shadowPixels, sampleCount),
    highlightClipping: toPercentage(highlightPixels, sampleCount),
  }
}

function createBins() {
  return Array.from({ length: HISTOGRAM_SIZE }, () => 0)
}

function toPercentage(value: number, total: number) {
  return Math.round((value / Math.max(1, total)) * 1000) / 10
}

function cloneHistogram(value: ImageHistogram): ImageHistogram {
  return {
    red: value.red.slice(),
    green: value.green.slice(),
    blue: value.blue.slice(),
    luminance: value.luminance.slice(),
    sampleCount: value.sampleCount,
    shadowClipping: value.shadowClipping,
    highlightClipping: value.highlightClipping,
  }
}
