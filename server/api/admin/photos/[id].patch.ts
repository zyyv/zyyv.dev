import type { PhotoExif } from '~/types'
import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { getPhotoRow, rowToPhoto } from '../../../utils/photos'

interface UpdatePhotoBody {
  filename?: string
  private?: boolean
  exif?: PhotoExif | null
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { DB } = useCloudflareBindings(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少图片 ID' })

  const current = await getPhotoRow(DB, id)
  if (!current) throw createError({ statusCode: 404, statusMessage: '图片不存在' })
  const body = await readBody<UpdatePhotoBody>(event)
  const filename = body.filename?.trim() || current.filename
  if (filename.length > 255) throw createError({ statusCode: 400, statusMessage: '文件名过长' })
  const isPrivate = typeof body.private === 'boolean' ? Number(body.private) : current.is_private
  const exifJson =
    body.exif === undefined ? current.exif_json : body.exif ? JSON.stringify(body.exif) : null

  await DB.prepare(
    'UPDATE photos SET filename = ?, is_private = ?, exif_json = ?, modified_at = ? WHERE id = ?',
  )
    .bind(filename, isPrivate, exifJson, new Date().toISOString(), id)
    .run()

  const updated = await getPhotoRow(DB, id)
  if (!updated) throw createError({ statusCode: 500, statusMessage: '更新后读取失败' })
  return rowToPhoto(updated)
})
