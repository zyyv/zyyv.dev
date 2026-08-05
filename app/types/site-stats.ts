export interface SiteStatsResponse {
  totalVisits: number | null
  onlineVisitors: number | null
}

export interface SiteVisitResponse {
  totalVisits: number | null
}

export type SiteVisitEventType = 'start' | 'navigate' | 'end'

export interface SiteVisitPayload {
  eventType: SiteVisitEventType
  visitId: string
  visitorId: string
  path?: string
  durationSeconds?: number
  referrerHost?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  language?: string
  timezone?: string
  screenWidth?: number
  screenHeight?: number
  viewportWidth?: number
  viewportHeight?: number
}

export interface SitePresenceMessage {
  onlineVisitors: number
}
