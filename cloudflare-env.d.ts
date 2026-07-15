import type { CloudflareBindings } from './server/types/cloudflare'

declare module 'h3' {
  interface H3EventContext {
    cloudflare?: {
      env: CloudflareBindings
      request: Request
      context: ExecutionContext
    }
  }
}

export {}
