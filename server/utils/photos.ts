import type { NewPhoto, Photo, PhotoExif } from '~/types'
import { imageCdnUrl } from '#shared/constants/images'
import type { D1DatabaseBinding } from '../types/cloudflare'

export interface PhotoRow {
  id: string
  filename: string
  origin_key: string
  origin_size: number
  compressed_key: string
  compressed_size: number
  thumbnail_key: string
  thumbnail_size: number
  width: number
  height: number
  blurhash: string
  is_private: number
  exif_json: string | null
  created_at: string
  modified_at: string
}

export function formatPhotoSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

function parseExif(value: string | null): PhotoExif | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as PhotoExif
  } catch {
    return undefined
  }
}

export function rowToNewPhoto(row: PhotoRow): NewPhoto {
  const origin = imageCdnUrl(row.origin_key)
  return {
    id: row.id,
    filename: row.filename,
    src: origin,
    origin,
    originSize: row.origin_size,
    originSizeFormatted: formatPhotoSize(row.origin_size),
    compressed: imageCdnUrl(row.compressed_key),
    compressedSize: row.compressed_size,
    compressedSizeFormatted: formatPhotoSize(row.compressed_size),
    thumbnail: imageCdnUrl(row.thumbnail_key),
    thumbnailSize: row.thumbnail_size,
    thumbnailSizeFormatted: formatPhotoSize(row.thumbnail_size),
    width: row.width,
    height: row.height,
    blurhash: row.blurhash,
    private: Boolean(row.is_private),
    createdAt: row.created_at,
    modifiedAt: row.modified_at,
    exif: parseExif(row.exif_json),
  }
}

export function newPhotoToPublicPhoto(photo: NewPhoto): Photo {
  return {
    id: photo.id,
    filename: photo.filename,
    src: photo.compressed,
    thumbnail: photo.thumbnail,
    thumbnailSize: photo.thumbnailSize,
    thumbnailSizeFormatted: photo.thumbnailSizeFormatted,
    originalPath: photo.origin,
    size: photo.compressedSize,
    sizeFormatted: photo.compressedSizeFormatted,
    width: photo.width,
    height: photo.height,
    blurhash: photo.blurhash,
    createdAt: photo.createdAt,
    modifiedAt: photo.modifiedAt,
    exif: photo.exif,
  }
}

export async function getPhotoRow(database: D1DatabaseBinding, id: string) {
  return database.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first<PhotoRow>()
}

export async function listPublicPhotos(database: D1DatabaseBinding) {
  const result = await database
    .prepare(
      "SELECT * FROM photos WHERE is_private = 0 ORDER BY COALESCE(json_extract(exif_json, '$.dateTime'), created_at) DESC",
    )
    .all<PhotoRow>()
  return (result.results || []).map(rowToNewPhoto).map(newPhotoToPublicPhoto)
}
