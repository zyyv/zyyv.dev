import type { H3Event } from 'h3'
import type { CloudflareBindings } from '../types/cloudflare'

export function useCloudflareBindings(event: H3Event): CloudflareBindings {
  const bindings = event.context.cloudflare?.env

  if (!bindings?.DB || !bindings.PHOTOS) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Cloudflare bindings DB and PHOTOS are required',
    })
  }

  return bindings
}
