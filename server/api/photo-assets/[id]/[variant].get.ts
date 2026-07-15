import { isAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { getPhotoRow } from '../../../utils/photos'

export default defineEventHandler(async (event) => {
  const { DB, PHOTOS } = useCloudflareBindings(event)
  const id = getRouterParam(event, 'id')
  const variant = getRouterParam(event, 'variant')
  if (!id || !variant || !['origin', 'compressed', 'thumbnail'].includes(variant)) {
    throw createError({ statusCode: 404, statusMessage: '图片资源不存在' })
  }

  const photo = await getPhotoRow(DB, id)
  if (!photo) throw createError({ statusCode: 404, statusMessage: '图片资源不存在' })
  if ((photo.is_private || variant === 'origin') && !(await isAdmin(event))) {
    throw createError({ statusCode: 404, statusMessage: '图片资源不存在' })
  }

  const key =
    variant === 'origin'
      ? photo.origin_key
      : variant === 'compressed'
        ? photo.compressed_key
        : photo.thumbnail_key
  const object = await PHOTOS.get(key)
  if (!object) throw createError({ statusCode: 404, statusMessage: 'R2 中未找到图片' })

  setHeader(event, 'Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  setHeader(
    event,
    'Cache-Control',
    variant === 'origin' ? 'private, no-store' : 'public, max-age=31536000, immutable',
  )
  setHeader(event, 'ETag', object.httpEtag)
  return sendStream(event, object.body)
})
