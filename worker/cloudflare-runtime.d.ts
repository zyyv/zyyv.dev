declare module 'cloudflare:workers' {
  export class DurableObject<Bindings = unknown> {
    protected readonly ctx: DurableObjectState
    protected readonly env: Bindings

    constructor(ctx: DurableObjectState, env: Bindings)

    fetch(request: Request): Response | Promise<Response>
    webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void | Promise<void>
    webSocketClose(
      socket: WebSocket,
      code: number,
      reason: string,
      wasClean: boolean,
    ): void | Promise<void>
    webSocketError(socket: WebSocket, error: unknown): void | Promise<void>
  }
}

interface DurableObjectState {
  acceptWebSocket(socket: WebSocket, tags?: string[]): void
  getWebSockets(tag?: string): WebSocket[]
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
}

interface WebSocket {
  serializeAttachment(value: unknown): void
  deserializeAttachment(): unknown
}

declare class WebSocketPair {
  0: WebSocket
  1: WebSocket
}

interface ResponseInit {
  webSocket?: WebSocket | null
}
