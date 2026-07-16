import type { PhotoListResponse } from '~/types'
import { useCloudflareBindings } from '../utils/cloudflare'
import { listPublicPhotos } from '../utils/photos'

const BROWSER_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300'
const EDGE_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=86400'

export default defineEventHandler(async (event): Promise<PhotoListResponse> => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const all = query.all === '1' || query.all === 'true'
  const requestedLimit = Math.max(1, Math.min(50, Number(query.limit) || 24))

  const { DB } = useCloudflareBindings(event)
  const source = await listPublicPhotos(DB)
  const total = source.length
  const limit = all ? total : requestedLimit
  const offset = (page - 1) * limit
  const totalPages = all ? (total ? 1 : 0) : Math.ceil(total / limit)
  const photos = all ? source : source.slice(offset, offset + limit)

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
