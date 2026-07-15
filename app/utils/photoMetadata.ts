import type { PhotoExif } from '~/types'
import { encode } from 'blurhash'
import exifr from 'exifr'

async function loadBitmap(file: File) {
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

async function createBlurhash(file: File) {
  const image = await loadBitmap(file)
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
  if ('close' in image && typeof image.close === 'function') image.close()
  return encode(pixels, sampleWidth, sampleHeight, 4, 4)
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

export async function extractPhotoMetadata(file: File) {
  const [blurhash, exif] = await Promise.all([createBlurhash(file), readExif(file)])
  return { blurhash, exif }
}
