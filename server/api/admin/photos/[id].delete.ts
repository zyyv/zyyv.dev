import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { getPhotoRow } from '../../../utils/photos'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { DB, PHOTOS } = useCloudflareBindings(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少图片 ID' })

  const photo = await getPhotoRow(DB, id)
  if (!photo) throw createError({ statusCode: 404, statusMessage: '图片不存在' })

  await PHOTOS.delete([photo.origin_key, photo.compressed_key, photo.thumbnail_key])
  await DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run()
  setResponseStatus(event, 204)
  return null
})
