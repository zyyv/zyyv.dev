import type {
  SitePresenceMessage,
  SiteStatsResponse,
  SiteVisitEventType,
  SiteVisitPayload,
  SiteVisitResponse,
} from '~/types/site-stats'

const VISITOR_ID_KEY = 'zyyv:visitor-id'
const VISIT_ID_KEY = 'zyyv:visit-id'
const VISIT_STARTED_AT_KEY = 'zyyv:visit-started-at'
const MAX_RECONNECT_DELAY = 30_000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function useSiteStats() {
  const route = useRoute()
  const stats = useState<SiteStatsResponse>('site-stats', () => ({
    totalVisits: null,
    onlineVisitors: null,
  }))
  const isStarted = useState('site-stats-started', () => false)

  async function recordVisit(payload: SiteVisitPayload) {
    try {
      const response = await $fetch<SiteVisitResponse>('/api/site-stats', {
        method: 'POST',
        body: payload,
      })
      if (response.totalVisits !== null) {
        stats.value = { ...stats.value, totalVisits: response.totalVisits }
      }
    } catch {
      // Analytics should never interrupt navigation or footer interactions.
    }
  }

  function getReferrerHost() {
    if (!document.referrer) return undefined
    try {
      return new URL(document.referrer).hostname
    } catch {
      return undefined
    }
  }

  function getCampaignValue(name: string) {
    return new URLSearchParams(location.search).get(name) || undefined
  }

  function getDurationSeconds(startedAt: number) {
    return Math.max(0, Math.round((Date.now() - startedAt) / 1000))
  }

  function createPayload(options: {
    eventType: SiteVisitEventType
    visitId: string
    visitorId: string
    startedAt: number
  }): SiteVisitPayload {
    const base = {
      eventType: options.eventType,
      visitId: options.visitId,
      visitorId: options.visitorId,
      path: route.path,
      durationSeconds: getDurationSeconds(options.startedAt),
    }

    if (options.eventType !== 'start') return base

    return {
      ...base,
      referrerHost: getReferrerHost(),
      utmSource: getCampaignValue('utm_source'),
      utmMedium: getCampaignValue('utm_medium'),
      utmCampaign: getCampaignValue('utm_campaign'),
      utmTerm: getCampaignValue('utm_term'),
      utmContent: getCampaignValue('utm_content'),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  }

  function start() {
    if (!import.meta.client || isStarted.value) return
    isStarted.value = true

    let visitorId = localStorage.getItem(VISITOR_ID_KEY)
    if (!visitorId || !UUID_PATTERN.test(visitorId)) {
      visitorId = crypto.randomUUID()
      localStorage.setItem(VISITOR_ID_KEY, visitorId)
    }
    const presenceVisitorId = visitorId

    let visitId = sessionStorage.getItem(VISIT_ID_KEY)
    if (!visitId || !UUID_PATTERN.test(visitId)) {
      visitId = crypto.randomUUID()
      sessionStorage.setItem(VISIT_ID_KEY, visitId)
    }

    const storedStartedAtValue = sessionStorage.getItem(VISIT_STARTED_AT_KEY)
    const storedStartedAt = storedStartedAtValue ? Number(storedStartedAtValue) : Number.NaN
    const startedAt =
      Number.isSafeInteger(storedStartedAt) && storedStartedAt > 0 && storedStartedAt <= Date.now()
        ? storedStartedAt
        : Date.now()
    sessionStorage.setItem(VISIT_STARTED_AT_KEY, String(startedAt))

    void recordVisit(createPayload({ eventType: 'start', visitId, visitorId, startedAt }))

    const stopRouteWatcher = watch(
      () => route.path,
      () => {
        void recordVisit(createPayload({ eventType: 'navigate', visitId, visitorId, startedAt }))
      },
    )

    const endVisit = () => {
      const payload = createPayload({ eventType: 'end', visitId, visitorId, startedAt })
      navigator.sendBeacon(
        '/api/site-stats',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      )
    }
    window.addEventListener('pagehide', endVisit)

    if (import.meta.dev) {
      stats.value = { ...stats.value, onlineVisitors: 1 }
    }

    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let reconnectAttempts = 0
    let disposed = false

    function connectPresence() {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = new URL('/api/presence', `${protocol}//${location.host}`)
      url.searchParams.set('visitorId', presenceVisitorId)
      socket = new WebSocket(url)

      socket.addEventListener('open', () => {
        reconnectAttempts = 0
        socket?.send('presence')
      })
      socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') return
        try {
          const message = JSON.parse(event.data) as Partial<SitePresenceMessage>
          if (!Number.isSafeInteger(message.onlineVisitors) || message.onlineVisitors! < 0) return
          stats.value = { ...stats.value, onlineVisitors: message.onlineVisitors! }
        } catch {
          // Ignore malformed presence updates and keep the last valid count.
        }
      })
      socket.addEventListener('close', () => {
        if (disposed) return
        const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY)
        reconnectAttempts += 1
        reconnectTimer = window.setTimeout(connectPresence, delay)
      })
      socket.addEventListener('error', () => socket?.close())
    }

    if (!import.meta.dev) connectPresence()

    onScopeDispose(() => {
      disposed = true
      stopRouteWatcher()
      window.removeEventListener('pagehide', endVisit)
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
      socket?.close(1000, 'Page closed')
    })
  }

  return {
    stats: readonly(stats),
    start,
  }
}
