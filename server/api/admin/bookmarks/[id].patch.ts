import type { BookmarkInput } from '~/types'
import { requireAdmin } from '../../../utils/admin-auth'
import {
  getBookmarkRow,
  normalizeBookmarkInput,
  requireFolder,
  rowToBookmark,
} from '../../../utils/bookmarks'
import { useCloudflareBindings } from '../../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { DB } = useCloudflareBindings(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少书签 ID' })

  const current = await getBookmarkRow(DB, id)
  if (!current) throw createError({ statusCode: 404, statusMessage: '书签不存在' })
  const body = await readBody<Partial<BookmarkInput>>(event)
  if (current.kind === 'folder' && body.kind === 'bookmark') {
    const child = await DB.prepare('SELECT id FROM bookmarks WHERE parent_id = ? LIMIT 1')
      .bind(id)
      .first<{ id: string }>()
    if (child) throw createError({ statusCode: 400, statusMessage: '非空文件夹不能转换为书签' })
  }
  const input = normalizeBookmarkInput({
    kind: body.kind ?? current.kind,
    parentId: body.parentId === undefined ? current.parent_id : body.parentId,
    title: body.title ?? current.title,
    url: body.url === undefined ? current.url : body.url,
    description: body.description === undefined ? current.description : body.description,
    iconUrl: body.iconUrl === undefined ? current.icon_url : body.iconUrl,
    tags: body.tags ?? JSON.parse(current.tags_json),
    private: body.private ?? Boolean(current.is_private),
    sortOrder: body.sortOrder ?? current.sort_order,
  })
  await requireFolder(DB, input.parentId, id)

  await DB.prepare(
    `UPDATE bookmarks SET
      kind = ?, parent_id = ?, title = ?, url = ?, description = ?, icon_url = ?,
      tags_json = ?, is_private = ?, sort_order = ?, modified_at = ?
    WHERE id = ?`,
  )
    .bind(
      input.kind,
      input.parentId,
      input.title,
      input.url,
      input.description,
      input.iconUrl,
      JSON.stringify(input.tags),
      Number(input.private),
      input.sortOrder ?? current.sort_order,
      new Date().toISOString(),
      id,
    )
    .run()

  const updated = await getBookmarkRow(DB, id)
  if (!updated) throw createError({ statusCode: 500, statusMessage: '更新后读取失败' })
  return rowToBookmark(updated)
})
