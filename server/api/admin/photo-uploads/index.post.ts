import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import {
  type FinalizePhotoUploadBody,
  photoUploadKeys,
  validatePhotoFilename,
} from '../../../utils/photo-upload'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { DB, PHOTOS } = useCloudflareBindings(event)
  const body =
    await readBody<
      Pick<FinalizePhotoUploadBody, 'filename' | 'compressedContentType' | 'thumbnailContentType'>
    >(event)
  const filename = validatePhotoFilename(body.filename)
  const keys = photoUploadKeys(filename, body.compressedContentType, body.thumbnailContentType)
  const [record, original, compressed, thumbnail] = await Promise.all([
    DB.prepare(
      `SELECT id FROM photos
       WHERE origin_key = ? OR compressed_key = ? OR thumbnail_key = ?
       LIMIT 1`,
    )
      .bind(keys.originalKey, keys.compressedKey, keys.thumbnailKey)
      .first(),
    PHOTOS.head(keys.originalKey),
    PHOTOS.head(keys.compressedKey),
    PHOTOS.head(keys.thumbnailKey),
  ])
  if (record || original || compressed || thumbnail) {
    throw createError({ statusCode: 409, statusMessage: 'R2 中已存在同名图片，请先重命名' })
  }
  return { id: crypto.randomUUID() }
})
