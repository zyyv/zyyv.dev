import nitro from '#nitro-output'
import { SitePresence } from './worker/site-presence'

export { SitePresence }

const PRESENCE_PATH = '/api/presence'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== PRESENCE_PATH) return nitro.fetch(request, env, ctx)

    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return Response.json({ error: 'WebSocket upgrade required' }, { status: 426 })
    }

    const visitorId = url.searchParams.get('visitorId')
    if (!visitorId || !UUID_PATTERN.test(visitorId)) {
      return Response.json({ error: 'Invalid visitor ID' }, { status: 400 })
    }

    return env.SITE_PRESENCE.getByName('site').fetch(request)
  },
}
