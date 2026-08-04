export interface SiteStatsResponse {
  totalViews: number | null
  onlineVisitors: number | null
}

export interface SiteVisitResponse {
  totalViews: number
}

export interface SitePresenceMessage {
  onlineVisitors: number
}
