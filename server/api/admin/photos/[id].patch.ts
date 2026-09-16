import type { PhotoExif } from '~/types'
import { serializeArthashConfig } from '#shared/constants/arthash'
import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { getPhotoRow, rowToPhoto } from '../../../utils/photos'
import { MAX_ARTHASH_LENGTH } from '../../../utils/photo-upload'

interface UpdatePhotoBody {
  filename?: string
  private?: boolean
  exif?: PhotoExif | null
  arthash?: string
  arthashConfig?: unknown
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
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
  const arthash = body.arthash?.trim() || current.arthash
  if (!arthash || arthash.length > MAX_ARTHASH_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Arthash 数据无效' })
  }
  const arthashConfigJson =
    body.arthashConfig === undefined
      ? current.arthash_config_json
      : serializeArthashConfig(body.arthashConfig)
  if (body.arthashConfig !== undefined && !arthashConfigJson) {
    throw createError({ statusCode: 400, statusMessage: 'Arthash 配置格式不正确' })
  }

  const modifiedAt = new Date().toISOString()
  const hasArthashConfigColumn = Object.prototype.hasOwnProperty.call(
    current,
    'arthash_config_json',
  )

  if (hasArthashConfigColumn) {
    await DB.prepare(
      `UPDATE photos SET
        filename = ?, is_private = ?, exif_json = ?, arthash = ?, arthash_config_json = ?,
        modified_at = ? WHERE id = ?`,
    )
      .bind(filename, isPrivate, exifJson, arthash, arthashConfigJson, modifiedAt, id)
      .run()
  } else {
    // Keep edits working while an existing deployment catches up with 0009.
    // The Arthash config is skipped only when this older schema has no column.
    await DB.prepare(
      `UPDATE photos SET
        filename = ?, is_private = ?, exif_json = ?, arthash = ?, modified_at = ? WHERE id = ?`,
    )
      .bind(filename, isPrivate, exifJson, arthash, modifiedAt, id)
      .run()
  }

  const updated = await getPhotoRow(DB, id)
  if (!updated) throw createError({ statusCode: 500, statusMessage: '更新后读取失败' })
  return rowToPhoto(updated)
})
