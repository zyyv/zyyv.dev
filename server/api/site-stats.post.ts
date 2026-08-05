import type { SiteVisitPayload, SiteVisitResponse } from '~/types/site-stats'
import { useCloudflareBindings } from '../utils/cloudflare'
import { classifyTrafficSource, parseUserAgent } from '../utils/site-analytics'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EVENT_TYPES = new Set(['start', 'navigate', 'end'])

interface CloudflareLocation {
  city?: unknown
  continent?: unknown
  country?: unknown
  region?: unknown
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim().slice(0, maxLength)
  return cleaned || null
}

function cleanPath(value: unknown) {
  const path = cleanString(value, 512)
  return path?.startsWith('/') ? path : '/'
}

function cleanDimension(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) > 0 && Number(value) <= 20_000
    ? Number(value)
    : null
}

function cleanDuration(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Math.min(Number(value), 86_400) : 0
}

export default defineEventHandler(async (event): Promise<SiteVisitResponse> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const body = await readBody<Partial<SiteVisitPayload>>(event)
  if (
    !body?.visitId ||
    !UUID_PATTERN.test(body.visitId) ||
    !body.visitorId ||
    !UUID_PATTERN.test(body.visitorId) ||
    !body.eventType ||
    !EVENT_TYPES.has(body.eventType)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid visit payload' })
  }

  if (import.meta.dev) return { totalVisits: 0 }

  const { DB } = useCloudflareBindings(event)
  const now = Math.floor(Date.now() / 1000)
  const path = cleanPath(body.path)
  const durationSeconds = cleanDuration(body.durationSeconds)

  if (body.eventType === 'start') {
    const referrerHost = cleanString(body.referrerHost, 255)?.toLowerCase() ?? null
    const utmSource = cleanString(body.utmSource, 100)
    const utmMedium = cleanString(body.utmMedium, 100)
    const utmCampaign = cleanString(body.utmCampaign, 200)
    const utmTerm = cleanString(body.utmTerm, 200)
    const utmContent = cleanString(body.utmContent, 200)
    const location = (event.context.cf ?? {}) as CloudflareLocation
    const userAgent = getHeader(event, 'user-agent') ?? ''
    const device = parseUserAgent(userAgent)
    const hostname = getRequestHost(event, { xForwardedHost: true }).split(':')[0]!.toLowerCase()
    const sourceType = classifyTrafficSource({
      hostname,
      referrerHost,
      hasCampaign: Boolean(utmSource || utmMedium || utmCampaign),
    })

    await DB.prepare(
      `INSERT OR IGNORE INTO site_visits (
        visit_id, visitor_id, created_at, last_seen_at, landing_path, exit_path,
        page_view_count, duration_seconds, referrer_host, source_type,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        country_code, region, city, continent, device_type, operating_system, browser,
        language, timezone, screen_width, screen_height, viewport_width, viewport_height
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        body.visitId,
        body.visitorId,
        now,
        now,
        path,
        path,
        referrerHost,
        sourceType,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        cleanString(location.country, 2),
        cleanString(location.region, 100),
        cleanString(location.city, 100),
        cleanString(location.continent, 2),
        device.deviceType,
        device.operatingSystem,
        device.browser,
        cleanString(body.language, 35),
        cleanString(body.timezone, 100),
        cleanDimension(body.screenWidth),
        cleanDimension(body.screenHeight),
        cleanDimension(body.viewportWidth),
        cleanDimension(body.viewportHeight),
      )
      .run()

    await DB.prepare(
      `UPDATE site_visits
       SET visitor_id = COALESCE(visitor_id, ?), last_seen_at = ?, exit_path = ?,
           duration_seconds = MAX(duration_seconds, ?)
       WHERE visit_id = ? AND (visitor_id = ? OR visitor_id IS NULL)`,
    )
      .bind(body.visitorId, now, path, durationSeconds, body.visitId, body.visitorId)
      .run()
  } else {
    const pageViewIncrement = body.eventType === 'navigate' ? 1 : 0
    await DB.prepare(
      `UPDATE site_visits
       SET last_seen_at = ?, exit_path = ?,
           page_view_count = page_view_count + ?,
           duration_seconds = MAX(duration_seconds, ?)
       WHERE visit_id = ? AND visitor_id = ?`,
    )
      .bind(now, path, pageViewIncrement, durationSeconds, body.visitId, body.visitorId)
      .run()

    return { totalVisits: null }
  }

  const visitsResult = await DB.prepare('SELECT COUNT(*) AS total_visits FROM site_visits').all()
  const visits = visitsResult.results[0] as { total_visits?: number } | undefined

  return { totalVisits: visits?.total_visits ?? 0 }
})
