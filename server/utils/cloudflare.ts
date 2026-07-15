import type { H3Event } from 'h3'
import type { CloudflareBindings } from '../types/cloudflare'

export function useCloudflareBindings(event: H3Event): CloudflareBindings {
  const bindings = event.context.cloudflare?.env

  if (!bindings?.DB || !bindings.PHOTOS || !bindings.IMAGES) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Cloudflare bindings DB, PHOTOS and IMAGES are required',
    })
  }

  return bindings
}

export function useOptionalDatabase(event: H3Event) {
  return event.context.cloudflare?.env.DB
}
