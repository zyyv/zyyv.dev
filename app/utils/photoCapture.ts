import type { Photo, PhotoExif } from '~/types'

export type PhotoDeviceType = 'camera' | 'phone'

export interface PhotoCaptureItem {
  label: string
  value: string
}

export interface PhotoCaptureSummary {
  deviceType?: PhotoDeviceType
  deviceName?: string
  fileFacts: string[]
  items: PhotoCaptureItem[]
}

const PHONE_MODEL_PATTERN =
  /\b(?:iphone|pixel|galaxy|oneplus|find\s*x|xiaomi|redmi|poco|mate|honor|magic|vivo|iqoo|realme|phone)\b/iu
const CAMERA_MODEL_PATTERN =
  /\b(?:ilce|dsc|eos|powershot|x-t\d|x-pro\d|gfx|dmc|dc-|om-\d|e-m\d|z\s?\d|d\d{3,4}|alpha)\b/iu

const PHONE_MAKES = new Set([
  'apple',
  'google',
  'huawei',
  'honor',
  'motorola',
  'nothing',
  'oneplus',
  'oppo',
  'realme',
  'samsung',
  'sony ericsson',
  'vivo',
  'xiaomi',
  'zte',
])

const CAMERA_MAKES = new Set([
  'canon',
  'fujifilm',
  'hasselblad',
  'leica',
  'nikon',
  'olympus',
  'om digital solutions',
  'panasonic',
  'pentax',
  'phase one',
  'ricoh',
  'sigma',
  'sony',
])

function normalize(value?: string) {
  return value?.trim().toLocaleLowerCase()
}

export function getPhotoDeviceType(exif?: PhotoExif): PhotoDeviceType | undefined {
  if (!exif) return undefined

  const make = normalize(exif.make)
  const model = normalize(exif.model)
  const device = [make, model].filter(Boolean).join(' ')

  if (PHONE_MODEL_PATTERN.test(device) || (make && PHONE_MAKES.has(make) && make !== 'sony')) {
    return 'phone'
  }
  if (CAMERA_MODEL_PATTERN.test(device) || (make && CAMERA_MAKES.has(make))) return 'camera'

  return undefined
}

export function formatExposureTime(time: number) {
  if (time >= 1) return `${Number(time.toFixed(1))}s`
  return `1/${Math.max(1, Math.round(1 / time))}s`
}

function formatNumber(value: number) {
  return Number(value.toFixed(1)).toString()
}

function getDeviceName(exif: PhotoExif) {
  const make = exif.make?.trim()
  const model = exif.model?.trim()

  if (model && make && !model.toLocaleLowerCase().startsWith(make.toLocaleLowerCase())) {
    return `${make} ${model}`
  }
  return model || make
}

function getFileFormat(filename: string) {
  const extension = filename.split('.').pop()?.toLocaleUpperCase()
  if (!extension) return undefined
  if (extension === 'JPG' || extension === 'JPEG') return 'JPEG'
  return extension
}

export function getPhotoCaptureSummary(photo: Photo): PhotoCaptureSummary {
  const exif = photo.exif
  const deviceType = getPhotoDeviceType(exif)
  const deviceName = exif ? getDeviceName(exif) : undefined
  const fileFacts = [
    getFileFormat(photo.filename),
    photo.width && photo.height ? `${photo.width}×${photo.height}` : undefined,
    photo.originSizeFormatted || undefined,
  ].filter((fact): fact is string => Boolean(fact))
  const items = [
    exif?.iso ? { label: 'ISO', value: String(exif.iso) } : null,
    exif?.exposureTime ? { label: 'SS', value: formatExposureTime(exif.exposureTime) } : null,
    exif?.fNumber ? { label: 'F', value: formatNumber(exif.fNumber) } : null,
    exif?.focalLength ? { label: 'FL', value: `${formatNumber(exif.focalLength)}mm` } : null,
  ].filter((item): item is PhotoCaptureItem => item !== null)

  return {
    deviceType,
    deviceName,
    fileFacts,
    items,
  }
}
