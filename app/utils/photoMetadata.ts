import type { PhotoExif } from '~/types'
import type { ArthashConfig } from '#shared/constants/arthash'
import { encodeArthash } from '~/utils/arthash'
import exifr from 'exifr'

type LoadedImage = ImageBitmap | HTMLImageElement
type MediaType = 'image' | 'video'

async function loadBitmap(file: File): Promise<LoadedImage> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file, { imageOrientation: 'from-image' })
  }

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function createArthash(image: LoadedImage, config?: ArthashConfig) {
  const width = image.width
  const height = image.height
  const sampleWidth = Math.min(32, width)
  const sampleHeight = Math.max(1, Math.round(sampleWidth * (height / width)))
  const canvas = document.createElement('canvas')
  canvas.width = sampleWidth
  canvas.height = sampleHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('浏览器无法创建图片画布')
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight)
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data
  return encodeArthash(
    new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength),
    sampleWidth,
    sampleHeight,
    config,
  )
}

async function createVideoArthash(video: HTMLVideoElement, config?: ArthashConfig) {
  const sampleWidth = Math.min(32, video.videoWidth)
  const sampleHeight = Math.max(1, Math.round(sampleWidth * (video.videoHeight / video.videoWidth)))
  const canvas = document.createElement('canvas')
  canvas.width = sampleWidth
  canvas.height = sampleHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('浏览器无法创建视频封面画布')
  context.drawImage(video, 0, 0, sampleWidth, sampleHeight)
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data
  return encodeArthash(
    new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength),
    sampleWidth,
    sampleHeight,
    config,
  )
}

function variantFilename(filename: string, suffix: string) {
  const extensionIndex = filename.lastIndexOf('.')
  const baseName = extensionIndex <= 0 ? filename : filename.slice(0, extensionIndex)
  return `${baseName}.${suffix}.webp`
}

function canvasToFile(canvas: HTMLCanvasElement, filename: string, contentType: string) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('浏览器无法生成图片预览'))
          return
        }
        resolve(new File([blob], filename, { type: blob.type || contentType }))
      },
      contentType,
      contentType === 'image/png' ? undefined : 0.8,
    )
  })
}

function createVariant(image: LoadedImage, file: File, maxWidth: number, suffix: string) {
  const scale = Math.min(1, maxWidth / image.width)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器无法创建图片画布')
  context.drawImage(image, 0, 0, width, height)
  return canvasToFile(canvas, variantFilename(file.name, suffix), 'image/webp')
}

function createVideoPoster(video: HTMLVideoElement, file: File, maxWidth: number, suffix: string) {
  const scale = Math.min(1, maxWidth / video.videoWidth)
  const width = Math.max(1, Math.round(video.videoWidth * scale))
  const height = Math.max(1, Math.round(video.videoHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器无法创建视频封面画布')
  context.drawImage(video, 0, 0, width, height)
  return canvasToFile(canvas, variantFilename(file.name, suffix), 'image/webp')
}

function waitForVideoEvent(video: HTMLVideoElement, eventName: 'loadeddata' | 'seeked') {
  return new Promise<void>((resolve, reject) => {
    const onSuccess = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('浏览器无法读取该视频，请尝试 MP4 或 WebM 格式'))
    }
    const cleanup = () => {
      video.removeEventListener(eventName, onSuccess)
      video.removeEventListener('error', onError)
    }
    video.addEventListener(eventName, onSuccess, { once: true })
    video.addEventListener('error', onError, { once: true })
  })
}

async function prepareVideoUpload(file: File, config?: ArthashConfig) {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.preload = 'auto'
  video.playsInline = true
  video.src = url

  try {
    await waitForVideoEvent(video, 'loadeddata')
    if (!video.videoWidth || !video.videoHeight) throw new Error('无法读取视频尺寸')

    const posterTime = Number.isFinite(video.duration) ? Math.min(0.25, video.duration / 2) : 0
    if (posterTime > 0) {
      const seeked = waitForVideoEvent(video, 'seeked')
      video.currentTime = posterTime
      await seeked
    }

    const [compressed, thumbnail, arthash] = await Promise.all([
      createVideoPoster(video, file, 2560, 'poster'),
      createVideoPoster(video, file, 600, 'thumbnail'),
      createVideoArthash(video, config),
    ])
    return {
      mediaType: 'video' as const,
      arthash,
      exif: undefined,
      width: video.videoWidth,
      height: video.videoHeight,
      compressed,
      thumbnail,
    }
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}

function toIsoString(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  return typeof value === 'string' ? value : undefined
}

async function readExif(file: File): Promise<PhotoExif | undefined> {
  const data = await exifr.parse(file, {
    pick: [
      'Make',
      'Model',
      'ExposureTime',
      'FNumber',
      'ISO',
      'FocalLength',
      'LensModel',
      'DateTime',
      'DateTimeOriginal',
      'GPSLatitude',
      'GPSLongitude',
    ],
  })
  if (!data) return undefined

  const exif: PhotoExif = {
    make: data.Make,
    model: data.Model,
    exposureTime: data.ExposureTime,
    fNumber: data.FNumber,
    iso: data.ISO,
    focalLength: data.FocalLength,
    lens: data.LensModel,
    dateTime: toIsoString(data.DateTimeOriginal || data.DateTime),
  }
  if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
    exif.gps = { latitude: data.latitude, longitude: data.longitude }
  }
  return exif
}

async function prepareImageUpload(file: File, config?: ArthashConfig) {
  const [image, exif] = await Promise.all([loadBitmap(file), readExif(file)])
  try {
    const [compressed, thumbnail, arthash] = await Promise.all([
      createVariant(image, file, 2560, 'compressed'),
      createVariant(image, file, 600, 'thumbnail'),
      createArthash(image, config),
    ])
    return {
      mediaType: 'image' as const,
      arthash,
      exif,
      width: image.width,
      height: image.height,
      compressed,
      thumbnail,
    }
  } finally {
    if ('close' in image && typeof image.close === 'function') image.close()
  }
}

export function getMediaType(file: File): MediaType | null {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'image'
  if (['video/mp4', 'video/webm'].includes(file.type)) return 'video'
  return null
}

export interface PreparedMediaUpload {
  mediaType: MediaType
  arthash: string
  width: number
  height: number
  compressed: File
  thumbnail: File
  exif?: PhotoExif
}

export async function prepareMediaUpload(file: File, config?: ArthashConfig) {
  const mediaType = getMediaType(file)
  if (mediaType === 'video') return prepareVideoUpload(file, config)
  if (mediaType === 'image') return prepareImageUpload(file, config)
  throw new Error('仅支持 JPEG、PNG、WebP 图片，以及 MP4、WebM 视频')
}

export async function regenerateMediaArthash(file: File, config?: ArthashConfig) {
  const mediaType = getMediaType(file)
  if (mediaType === 'image') {
    const image = await loadBitmap(file)
    try {
      return await createArthash(image, config)
    } finally {
      if ('close' in image && typeof image.close === 'function') image.close()
    }
  }

  if (mediaType === 'video') {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.preload = 'auto'
    video.playsInline = true
    video.src = url
    try {
      await waitForVideoEvent(video, 'loadeddata')
      if (!video.videoWidth || !video.videoHeight) throw new Error('无法读取视频尺寸')
      const posterTime = Number.isFinite(video.duration) ? Math.min(0.25, video.duration / 2) : 0
      if (posterTime > 0) {
        const seeked = waitForVideoEvent(video, 'seeked')
        video.currentTime = posterTime
        await seeked
      }
      return createVideoArthash(video, config)
    } finally {
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
    }
  }

  throw new Error('仅支持 JPEG、PNG、WebP 图片，以及 MP4、WebM 视频')
}
