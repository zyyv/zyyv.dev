import type { Photo, PhotoExif, PhotoReactionCounts } from '~/types'
import { createEmptyPhotoReactionCounts } from '#shared/constants/photo-reactions'
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

export function rowToPhoto(
  row: PhotoRow,
  reactions: PhotoReactionCounts = createEmptyPhotoReactionCounts(),
): Photo {
  const origin = imageCdnUrl(row.origin_key)
  return {
    id: row.id,
    filename: row.filename,
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
    reactions,
  }
}

export async function getPhotoRow(database: D1DatabaseBinding, id: string) {
  return database.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first<PhotoRow>()
}

export async function listPublicPhotos(database: D1DatabaseBinding) {
  const [photosResult, reactionsResult] = await database.batch([
    database.prepare(
      "SELECT * FROM photos WHERE is_private = 0 ORDER BY COALESCE(json_extract(exif_json, '$.dateTime'), created_at) DESC",
    ),
    database.prepare(
      `SELECT photo_reactions.photo_id, photo_reactions.reaction, COUNT(*) AS count
       FROM photo_reactions
       INNER JOIN photos ON photos.id = photo_reactions.photo_id
       WHERE photos.is_private = 0
       GROUP BY photo_reactions.photo_id, photo_reactions.reaction`,
    ),
  ])
  const reactionsByPhoto = new Map<string, PhotoReactionCounts>()

  for (const row of reactionsResult.results as unknown as Array<{
    photo_id: string
    reaction: keyof PhotoReactionCounts
    count: number
  }>) {
    const counts = reactionsByPhoto.get(row.photo_id) || createEmptyPhotoReactionCounts()
    counts[row.reaction] = Number(row.count)
    reactionsByPhoto.set(row.photo_id, counts)
  }

  return (photosResult.results as unknown as PhotoRow[]).map((row) =>
    rowToPhoto(row, reactionsByPhoto.get(row.id)),
  )
}
