import { DurableObject } from 'cloudflare:workers'

interface ConnectionAttachment {
  visitorId: string
}

interface PresenceMessage {
  onlineVisitors: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class SitePresence extends DurableObject<Env> {
  override async fetch(request: Request): Promise<Response> {
    const visitorId = new URL(request.url).searchParams.get('visitorId')
    if (!visitorId || !UUID_PATTERN.test(visitorId)) {
      return Response.json({ error: 'Invalid visitor ID' }, { status: 400 })
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    server.serializeAttachment({ visitorId } satisfies ConnectionAttachment)
    this.ctx.acceptWebSocket(server)
    this.broadcastCount()

    return new Response(null, { status: 101, webSocket: client })
  }

  override webSocketMessage(socket: WebSocket): void {
    socket.send(JSON.stringify(this.getPresenceMessage()))
  }

  override webSocketClose(): void {
    this.broadcastCount()
  }

  override webSocketError(): void {
    this.broadcastCount()
  }

  private getPresenceMessage(): PresenceMessage {
    const visitors = new Set<string>()

    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState !== WebSocket.OPEN) continue
      const attachment = socket.deserializeAttachment() as ConnectionAttachment | null
      if (attachment?.visitorId) visitors.add(attachment.visitorId)
    }

    return { onlineVisitors: visitors.size }
  }

  private broadcastCount(): void {
    const message = JSON.stringify(this.getPresenceMessage())

    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState !== WebSocket.OPEN) continue
      try {
        socket.send(message)
      } catch (error) {
        console.warn(
          JSON.stringify({
            level: 'warn',
            message: 'Unable to broadcast site presence',
            error: error instanceof Error ? error.message : String(error),
          }),
        )
      }
    }
  }
}
