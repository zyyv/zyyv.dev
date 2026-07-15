import type { PhotoListResponse } from '~/types'
import type { PhotoRow } from '../../../utils/photos'
import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { rowToNewPhoto } from '../../../utils/photos'

export default defineEventHandler(async (event): Promise<PhotoListResponse> => {
  await requireAdmin(event)
  const { DB } = useCloudflareBindings(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(48, Number(query.limit) || 24))
  const search = String(query.search || '').trim()
  const visibility =
    query.visibility === 'public' || query.visibility === 'private' ? query.visibility : 'all'
  const conditions: string[] = []
  const values: unknown[] = []

  if (search) {
    conditions.push("filename LIKE ? ESCAPE '\\'")
    values.push(
      `%${search.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`,
    )
  }
  if (visibility !== 'all') {
    conditions.push('is_private = ?')
    values.push(visibility === 'private' ? 1 : 0)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const countRow = await DB.prepare(`SELECT COUNT(*) AS total FROM photos ${where}`)
    .bind(...values)
    .first<{ total: number }>()
  const total = countRow?.total || 0
  const offset = (page - 1) * limit
  const result = await DB.prepare(
    `SELECT * FROM photos ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...values, limit, offset)
    .all<PhotoRow>()

  return {
    photos: (result.results || []).map(rowToNewPhoto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
