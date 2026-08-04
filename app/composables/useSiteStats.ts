import type { SitePresenceMessage, SiteStatsResponse, SiteVisitResponse } from '~/types/site-stats'

const VISITOR_ID_KEY = 'zyyv:visitor-id'
const VISIT_ID_KEY = 'zyyv:visit-id'
const MAX_RECONNECT_DELAY = 30_000

export function useSiteStats() {
  const stats = useState<SiteStatsResponse>('site-stats', () => ({
    totalViews: null,
    onlineVisitors: null,
  }))
  const isStarted = useState('site-stats-started', () => false)

  async function recordVisit(visitId: string) {
    try {
      const response = await $fetch<SiteVisitResponse>('/api/site-stats', {
        method: 'POST',
        body: { visitId },
      })
      stats.value = { ...stats.value, totalViews: response.totalViews }
    } catch {
      // Analytics should never interrupt navigation or footer interactions.
    }
  }

  function start() {
    if (!import.meta.client || isStarted.value) return
    isStarted.value = true

    let visitorId = localStorage.getItem(VISITOR_ID_KEY)
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      localStorage.setItem(VISITOR_ID_KEY, visitorId)
    }
    const presenceVisitorId = visitorId

    let visitId = sessionStorage.getItem(VISIT_ID_KEY)
    if (!visitId) {
      visitId = crypto.randomUUID()
      sessionStorage.setItem(VISIT_ID_KEY, visitId)
    }

    void recordVisit(visitId)

    if (import.meta.dev) {
      stats.value = { ...stats.value, onlineVisitors: 1 }
      return
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

    connectPresence()

    onScopeDispose(() => {
      disposed = true
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
      socket?.close(1000, 'Page closed')
    })
  }

  return {
    stats: readonly(stats),
    start,
  }
}
