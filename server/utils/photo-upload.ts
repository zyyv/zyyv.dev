import type { PhotoExif } from '~/types'
import type { R2BucketBinding } from '../types/cloudflare'

export type PhotoUploadVariant = 'origin' | 'compressed' | 'thumbnail'

export interface FinalizePhotoUploadBody {
  filename?: string
  compressedContentType?: string
  thumbnailContentType?: string
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

export function validatePhotoFilename(value: string | undefined) {
  const filename = value?.trim()
  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: '缺少文件名' })
  }
  if (
    filename.length > 255 ||
    filename === '.' ||
    filename === '..' ||
    filename.includes('/') ||
    filename.includes('\\') ||
    Array.from(filename).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint <= 31 || codePoint === 127
    })
  ) {
    throw createError({ statusCode: 400, statusMessage: '文件名无效' })
  }
  return filename
}

export function validatePhotoUploadContentType(
  value: string | undefined,
  variant: PhotoUploadVariant,
) {
  const contentType = value?.trim().toLowerCase()
  if (!contentType || !PHOTO_UPLOAD_CONTENT_TYPES[variant].has(contentType)) {
    throw createError({ statusCode: 415, statusMessage: '仅支持 JPEG、PNG 和 WebP 图片' })
  }
  return contentType
}

function filenameForContentType(filename: string, contentType: string) {
  const extension =
    contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/png' ? 'png' : 'webp'
  const extensionIndex = filename.lastIndexOf('.')
  const basename = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename
  return `${basename}.${extension}`
}

export function photoUploadKey(
  filename: string,
  variant: PhotoUploadVariant,
  contentType?: string,
) {
  if (variant === 'origin') return `original/${filename}`
  const variantFilename = filenameForContentType(
    filename,
    validatePhotoUploadContentType(contentType, variant),
  )
  if (variant === 'compressed') return `compressed/${variantFilename}`
  return `thumbnail/${variantFilename}`
}

export function photoUploadKeys(
  filename: string,
  compressedContentType: string | undefined,
  thumbnailContentType: string | undefined,
) {
  return {
    originalKey: photoUploadKey(filename, 'origin'),
    compressedKey: photoUploadKey(filename, 'compressed', compressedContentType),
    thumbnailKey: photoUploadKey(filename, 'thumbnail', thumbnailContentType),
  }
}

export async function deletePhotoUpload(
  bucket: R2BucketBinding,
  filename: string,
  compressedContentType: string | undefined,
  thumbnailContentType: string | undefined,
) {
  const keys = photoUploadKeys(filename, compressedContentType, thumbnailContentType)
  await bucket.delete([keys.originalKey, keys.compressedKey, keys.thumbnailKey])
}
