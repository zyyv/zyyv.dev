import type { PhotoPreviewVariant } from '~/types'
import { getPhotoDownloadFilename } from '~/utils/photoDownload'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { getPhotoRow } from '../../../utils/photos'

const downloadVariants = new Set<PhotoPreviewVariant>([
  'origin',
  'compressed',
  'thumbnail',
  'blurhash',
])

function getDownloadVariant(value: unknown): PhotoPreviewVariant {
  if (value === undefined) return 'origin'
  if (typeof value !== 'string' || !downloadVariants.has(value as PhotoPreviewVariant)) {
    throw createError({ statusCode: 400, statusMessage: '不支持的图片版本' })
  }
  return value as PhotoPreviewVariant
}

export default defineEventHandler(async (event) => {
  const photoId = getRouterParam(event, 'id')
  if (!photoId) throw createError({ statusCode: 400, statusMessage: '缺少图片 ID' })

  const { DB, PHOTOS } = useCloudflareBindings(event)
  const photo = await getPhotoRow(DB, photoId)
  if (!photo || photo.is_private) {
    throw createError({ statusCode: 404, statusMessage: '图片不存在' })
  }

  const variant = getDownloadVariant(getQuery(event).variant)
  const filename = getPhotoDownloadFilename(photo.filename, variant)
  const fallbackBaseFilename = `photo-${photo.id}${photo.filename.match(/\.[a-z0-9]{1,8}$/iu)?.[0] ?? ''}`
  const fallbackFilename = getPhotoDownloadFilename(fallbackBaseFilename, variant)
  const encodedFilename = encodeURIComponent(filename)

  if (variant === 'blurhash') {
    const blurhash = photo.blurhash
    setResponseHeaders(event, {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': String(new TextEncoder().encode(blurhash).byteLength),
      'Content-Type': 'text/plain; charset=utf-8',
    })

    return blurhash
  }

  const objectKey =
    variant === 'compressed'
      ? photo.compressed_key
      : variant === 'thumbnail'
        ? photo.thumbnail_key
        : photo.origin_key
  const object = await PHOTOS.get(objectKey)
  if (!object) throw createError({ statusCode: 404, statusMessage: 'R2 中未找到图片' })

  setResponseHeaders(event, {
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`,
    'Content-Length': String(object.size),
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    ETag: object.httpEtag,
  })

  return sendStream(event, object.body)
})
