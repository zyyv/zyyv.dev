import type { APIRoute } from 'astro'
import { photosData } from '../../../server/utils/data'

export const GET: APIRoute = ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit')) || 12))
  const offset = (page - 1) * limit

  const total = photosData.length
  const totalPages = Math.ceil(total / limit)
  const photos = photosData.slice(offset, offset + limit)

  return Response.json({
    photos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      count: photos.length,
    },
  })
}
