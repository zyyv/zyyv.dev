import { useCloudflareBindings } from '../../../utils/cloudflare'
import { getPhotoRow } from '../../../utils/photos'

export default defineEventHandler(async (event) => {
  const photoId = getRouterParam(event, 'id')
  if (!photoId) throw createError({ statusCode: 400, statusMessage: '缺少图片 ID' })

  const { DB, PHOTOS } = useCloudflareBindings(event)
  const photo = await getPhotoRow(DB, photoId)
  if (!photo || photo.is_private) {
    throw createError({ statusCode: 404, statusMessage: '图片不存在' })
  }

  const object = await PHOTOS.get(photo.origin_key)
  if (!object) throw createError({ statusCode: 404, statusMessage: 'R2 中未找到图片' })

  const extension = photo.filename.match(/\.[a-z0-9]{1,8}$/iu)?.[0] ?? ''
  const fallbackFilename = `photo-${photo.id}${extension}`
  const encodedFilename = encodeURIComponent(photo.filename)

  setResponseHeaders(event, {
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`,
    'Content-Length': String(object.size),
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    ETag: object.httpEtag,
  })

  return sendStream(event, object.body)
})
