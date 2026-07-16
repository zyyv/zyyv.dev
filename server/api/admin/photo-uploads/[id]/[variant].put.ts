import { requireAdmin } from '../../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../../utils/cloudflare'
import {
  isPhotoUploadVariant,
  PHOTO_UPLOAD_CONTENT_TYPES,
  PHOTO_UPLOAD_LIMITS,
  photoUploadKey,
  validatePhotoUploadId,
} from '../../../../utils/photo-upload'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { PHOTOS } = useCloudflareBindings(event)
  const id = validatePhotoUploadId(getRouterParam(event, 'id'))
  const variant = getRouterParam(event, 'variant')
  if (!isPhotoUploadVariant(variant)) {
    throw createError({ statusCode: 404, statusMessage: '图片变体不存在' })
  }

  const body = await readRawBody(event, false)
  const contentType = getHeader(event, 'content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  const contentLength = Number(getHeader(event, 'content-length'))
  if (!body?.byteLength) {
    throw createError({ statusCode: 400, statusMessage: '图片内容不能为空' })
  }
  if (!contentType || !PHOTO_UPLOAD_CONTENT_TYPES[variant].has(contentType)) {
    throw createError({ statusCode: 415, statusMessage: '仅支持 JPEG、PNG 和 WebP 图片' })
  }
  if (!Number.isFinite(contentLength) || contentLength < 1) {
    throw createError({ statusCode: 411, statusMessage: '缺少有效的图片大小' })
  }
  if (contentLength > PHOTO_UPLOAD_LIMITS[variant]) {
    throw createError({ statusCode: 413, statusMessage: '图片文件超过大小限制' })
  }
  const bytes = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)

  try {
    await PHOTOS.put(photoUploadKey(id, variant), bytes, {
      httpMetadata: {
        contentType,
        cacheControl:
          variant === 'origin' ? 'private, no-store' : 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    console.error('R2 photo upload failed', { id, variant, message })
    throw createError({ statusCode: 500, statusMessage: `R2 上传失败：${message}` })
  }
  return { uploaded: true }
})
