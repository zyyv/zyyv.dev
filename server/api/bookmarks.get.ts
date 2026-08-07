import type { BookmarkListResponse } from '~/types'
import { listBookmarks } from '../utils/bookmarks'
import { useCloudflareBindings } from '../utils/cloudflare'

export default defineEventHandler(async (event): Promise<BookmarkListResponse> => {
  const { DB } = useCloudflareBindings(event)
  const bookmarks = await listBookmarks(DB, false)

  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  return { bookmarks }
})
