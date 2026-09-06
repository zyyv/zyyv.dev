import type { PhotoListResponse } from '~/types'
import { useCloudflareBindings } from '../utils/cloudflare'
import { listPublicPhotos } from '../utils/photos'

const BROWSER_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300'
const EDGE_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=86400'

export default defineEventHandler(async (event): Promise<PhotoListResponse> => {
  const query = getQuery(event)
  const page = Math.min(1_000_000, Math.max(1, Math.trunc(Number(query.page)) || 1))
  const all = query.all === '1' || query.all === 'true'
  const requestedLimit = Math.max(1, Math.min(50, Math.trunc(Number(query.limit)) || 24))

  const { DB } = useCloudflareBindings(event)
  const { photos, total } = await listPublicPhotos(
    DB,
    all ? undefined : { limit: requestedLimit, offset: (page - 1) * requestedLimit },
  )
  const limit = all ? total : requestedLimit
  const totalPages = all ? (total ? 1 : 0) : Math.ceil(total / limit)

  setResponseHeaders(event, {
    'Cache-Control': BROWSER_CACHE_CONTROL,
    'Cloudflare-CDN-Cache-Control': EDGE_CACHE_CONTROL,
    Vary: 'Accept-Encoding',
  })

  return {
    photos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: !all && page < totalPages,
      hasPrev: page > 1,
      count: photos.length,
    },
  }
})
