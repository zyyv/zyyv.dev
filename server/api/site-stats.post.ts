import type { SiteVisitResponse } from '~/types/site-stats'
import { useCloudflareBindings } from '../utils/cloudflare'

interface SiteStatsHeartbeatBody {
  visitId?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event): Promise<SiteVisitResponse> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const body = await readBody<SiteStatsHeartbeatBody>(event)
  if (!body?.visitId || !UUID_PATTERN.test(body.visitId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid visit ID' })
  }

  if (import.meta.dev) return { totalViews: 0 }

  const { DB } = useCloudflareBindings(event)
  const now = Math.floor(Date.now() / 1000)
  const visitResult = await DB.prepare(
    'INSERT OR IGNORE INTO site_visits (visit_id, created_at) VALUES (?, ?)',
  )
    .bind(body.visitId, now)
    .run()

  if (visitResult.meta.changes > 0) {
    await DB.prepare(
      'UPDATE site_stats SET total_views = total_views + 1, updated_at = ? WHERE id = 1',
    )
      .bind(now)
      .run()
  }

  const viewsResult = await DB.prepare('SELECT total_views FROM site_stats WHERE id = 1').all()
  const views = viewsResult.results[0] as { total_views?: number } | undefined

  return { totalViews: views?.total_views ?? 0 }
})
