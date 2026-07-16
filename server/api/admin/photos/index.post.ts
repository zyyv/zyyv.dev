import type { PhotoExif } from '~/types'
import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { processAndStorePhoto } from '../../../utils/photo-processing'
import { getPhotoRow, rowToNewPhoto } from '../../../utils/photos'

function parseBoolean(value: string | undefined) {
  return value === 'true' || value === '1'
}

function parseExif(value: string | undefined): PhotoExif | undefined {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as PhotoExif
    return parsed && typeof parsed === 'object' ? parsed : undefined
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'EXIF 数据格式不正确' })
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contentLength = Number(getHeader(event, 'content-length'))
  if (Number.isFinite(contentLength) && contentLength > 10 * 1024 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: '旧版 multipart 上传不支持大文件，请刷新管理页后重试',
    })
  }
  const { DB, PHOTOS, IMAGES } = useCloudflareBindings(event)
  const parts = await readMultipartFormData(event)
  const filePart = parts?.find((part) => part.name === 'file' && part.filename)
  const compressedPart = parts?.find((part) => part.name === 'compressed' && part.filename)
  const thumbnailPart = parts?.find((part) => part.name === 'thumbnail' && part.filename)
  if (!filePart) throw createError({ statusCode: 400, statusMessage: '请选择一张图片' })
  if (!compressedPart || !thumbnailPart) {
    throw createError({ statusCode: 400, statusMessage: '缺少压缩图或缩略图，请刷新管理页后重试' })
  }

  const getField = (name: string) => {
    const part = parts?.find((item) => item.name === name && !item.filename)
    return part ? new TextDecoder().decode(part.data) : undefined
  }

  const blurhash = getField('blurhash')?.trim()
  if (!blurhash || blurhash.length > 200) {
    throw createError({ statusCode: 400, statusMessage: '无法读取图片 BlurHash' })
  }

  const id = crypto.randomUUID()
  const stored = await processAndStorePhoto({
    bucket: PHOTOS,
    images: IMAGES,
    file: { filename: filePart.filename, type: filePart.type, data: filePart.data },
    compressed: {
      filename: compressedPart.filename,
      type: compressedPart.type,
      data: compressedPart.data,
    },
    thumbnail: {
      filename: thumbnailPart.filename,
      type: thumbnailPart.type,
      data: thumbnailPart.data,
    },
    width: Number(getField('width')),
    height: Number(getField('height')),
  })
  const now = new Date().toISOString()
  const exif = parseExif(getField('exif'))

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
        stored.filename,
        stored.originalKey,
        stored.originalSize,
        stored.compressedKey,
        stored.compressedSize,
        stored.thumbnailKey,
        stored.thumbnailSize,
        stored.width,
        stored.height,
        blurhash,
        parseBoolean(getField('private')) ? 1 : 0,
        exif ? JSON.stringify(exif) : null,
        now,
        now,
      )
      .run()
  } catch (error) {
    await PHOTOS.delete([stored.originalKey, stored.compressedKey, stored.thumbnailKey]).catch(
      () => undefined,
    )
    throw error
  }

  const row = await getPhotoRow(DB, id)
  if (!row) throw createError({ statusCode: 500, statusMessage: '图片已上传，但记录读取失败' })
  setResponseStatus(event, 201)
  return rowToNewPhoto(row)
})
