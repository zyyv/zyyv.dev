import { requireAdmin } from '../../../utils/admin-auth'
import { getBookmarkRow } from '../../../utils/bookmarks'
import { useCloudflareBindings } from '../../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { DB } = useCloudflareBindings(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少书签 ID' })
  if (!(await getBookmarkRow(DB, id))) {
    throw createError({ statusCode: 404, statusMessage: '书签不存在' })
  }

  await DB.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run()
  setResponseStatus(event, 204)
  return null
})
