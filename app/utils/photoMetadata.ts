import type { PhotoExif } from '~/types'
import { encode } from 'blurhash'
import exifr from 'exifr'

type LoadedImage = ImageBitmap | HTMLImageElement

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

function createBlurhash(image: LoadedImage) {
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
  return encode(pixels, sampleWidth, sampleHeight, 4, 4)
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
  if (typeof data.GPSLatitude === 'number' && typeof data.GPSLongitude === 'number') {
    exif.gps = { latitude: data.GPSLatitude, longitude: data.GPSLongitude }
  }
  return exif
}

export async function preparePhotoUpload(file: File) {
  const [image, exif] = await Promise.all([loadBitmap(file), readExif(file)])
  try {
    const [compressed, thumbnail] = await Promise.all([
      createVariant(image, file, 2560, 'compressed'),
      createVariant(image, file, 600, 'thumbnail'),
    ])
    return {
      blurhash: createBlurhash(image),
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
