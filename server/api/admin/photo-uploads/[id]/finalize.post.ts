import { requireAdmin } from '../../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../../utils/cloudflare'
import {
  deletePhotoUpload,
  type FinalizePhotoUploadBody,
  PHOTO_UPLOAD_LIMITS,
  photoUploadKeys,
  validatePhotoFilename,
  validatePhotoUploadId,
} from '../../../../utils/photo-upload'
import { getPhotoRow, rowToNewPhoto } from '../../../../utils/photos'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { DB, PHOTOS } = useCloudflareBindings(event)
  const id = validatePhotoUploadId(getRouterParam(event, 'id'))
  const body = await readBody<FinalizePhotoUploadBody>(event)
  const filename = validatePhotoFilename(body.filename)
  const width = Number(body.width)
  const height = Number(body.height)
  const blurhash = body.blurhash?.trim()

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw createError({ statusCode: 400, statusMessage: '图片尺寸无效' })
  }
  if (!blurhash || blurhash.length > 200) {
    throw createError({ statusCode: 400, statusMessage: '无法读取图片 BlurHash' })
  }
  if (await getPhotoRow(DB, id)) {
    throw createError({ statusCode: 409, statusMessage: '图片记录已存在' })
  }

  const keys = photoUploadKeys(filename)
  const [origin, compressed, thumbnail] = await Promise.all([
    PHOTOS.head(keys.originalKey),
    PHOTOS.head(keys.compressedKey),
    PHOTOS.head(keys.thumbnailKey),
  ])
  if (!origin || !compressed || !thumbnail) {
    throw createError({ statusCode: 400, statusMessage: '图片文件尚未完整上传' })
  }
  if (
    origin.size > PHOTO_UPLOAD_LIMITS.origin ||
    compressed.size > PHOTO_UPLOAD_LIMITS.compressed ||
    thumbnail.size > PHOTO_UPLOAD_LIMITS.thumbnail
  ) {
    await deletePhotoUpload(PHOTOS, filename)
    throw createError({ statusCode: 413, statusMessage: '图片文件超过大小限制' })
  }

  const now = new Date().toISOString()
  try {
    await DB.prepare(
      `INSERT INTO photos (
        id, filename, origin_key, origin_size, compressed_key, compressed_size,
        thumbnail_key, thumbnail_size, width, height, blurhash, is_private,
        exif_json, created_at, modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        filename,
        keys.originalKey,
        origin.size,
        keys.compressedKey,
        compressed.size,
        keys.thumbnailKey,
        thumbnail.size,
        width,
        height,
        blurhash,
        body.private ? 1 : 0,
        body.exif ? JSON.stringify(body.exif) : null,
        now,
        now,
      )
      .run()
  } catch (error) {
    await deletePhotoUpload(PHOTOS, filename).catch(() => undefined)
    throw error
  }

  const row = await getPhotoRow(DB, id)
  if (!row) throw createError({ statusCode: 500, statusMessage: '图片已上传，但记录读取失败' })
  setResponseStatus(event, 201)
  return rowToNewPhoto(row)
})
