import type { PhotoExif } from '~/types'
import type { R2BucketBinding } from '../types/cloudflare'

export type PhotoUploadVariant = 'origin' | 'compressed' | 'thumbnail'

export interface FinalizePhotoUploadBody {
  filename?: string
  width?: number
  height?: number
  blurhash?: string
  private?: boolean
  exif?: PhotoExif
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const PHOTO_UPLOAD_LIMITS: Record<PhotoUploadVariant, number> = {
  origin: 50 * 1024 * 1024,
  compressed: 25 * 1024 * 1024,
  thumbnail: 10 * 1024 * 1024,
}

export const PHOTO_UPLOAD_CONTENT_TYPES: Record<PhotoUploadVariant, ReadonlySet<string>> = {
  origin: new Set(['image/jpeg', 'image/png', 'image/webp']),
  compressed: new Set(['image/jpeg', 'image/png', 'image/webp']),
  thumbnail: new Set(['image/jpeg', 'image/png', 'image/webp']),
}

export function validatePhotoUploadId(id: string | undefined) {
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, statusMessage: '图片上传 ID 无效' })
  }
  return id
}

export function isPhotoUploadVariant(value: string | undefined): value is PhotoUploadVariant {
  return value === 'origin' || value === 'compressed' || value === 'thumbnail'
}

export function photoUploadKey(id: string, variant: PhotoUploadVariant) {
  if (variant === 'origin') return `original/${id}/source`
  if (variant === 'compressed') return `compressed/${id}/display`
  return `thumbnail/${id}/thumbnail`
}

export function photoUploadKeys(id: string) {
  return {
    originalKey: photoUploadKey(id, 'origin'),
    compressedKey: photoUploadKey(id, 'compressed'),
    thumbnailKey: photoUploadKey(id, 'thumbnail'),
  }
}

export async function deletePhotoUpload(bucket: R2BucketBinding, id: string) {
  const keys = photoUploadKeys(id)
  await bucket.delete([keys.originalKey, keys.compressedKey, keys.thumbnailKey])
}
