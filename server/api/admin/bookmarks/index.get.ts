import type { BookmarkListResponse } from '~/types'
import { requireAdmin } from '../../../utils/admin-auth'
import { listBookmarks } from '../../../utils/bookmarks'
import { useCloudflareBindings } from '../../../utils/cloudflare'

export default defineEventHandler(async (event): Promise<BookmarkListResponse> => {
  await requireAdmin(event)
  const { DB } = useCloudflareBindings(event)
  return { bookmarks: await listBookmarks(DB, true) }
})
