import type { BookmarkInput } from '~/types'
import { requireAdmin } from '../../../utils/admin-auth'
import {
  getBookmarkRow,
  nextSortOrder,
  normalizeBookmarkInput,
  requireFolder,
  rowToBookmark,
} from '../../../utils/bookmarks'
import { useCloudflareBindings } from '../../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { DB } = useCloudflareBindings(event)
  const input = normalizeBookmarkInput(await readBody<Partial<BookmarkInput>>(event))
  await requireFolder(DB, input.parentId)

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const sortOrder = input.sortOrder ?? (await nextSortOrder(DB, input.parentId))
  await DB.prepare(
    `INSERT INTO bookmarks (
      id, kind, parent_id, title, url, description, icon_url, tags_json,
      is_private, sort_order, created_at, modified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.kind,
      input.parentId,
      input.title,
      input.url,
      input.description,
      input.iconUrl,
      JSON.stringify(input.tags),
      Number(input.private),
      sortOrder,
      now,
      now,
    )
    .run()

  const created = await getBookmarkRow(DB, id)
  if (!created) throw createError({ statusCode: 500, statusMessage: '创建后读取失败' })
  setResponseStatus(event, 201)
  return rowToBookmark(created)
})
