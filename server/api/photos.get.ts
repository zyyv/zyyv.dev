import { photosData } from '../utils/data'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(50, Number(query.limit) || 12))
  const offset = (page - 1) * limit

  const total = photosData.length
  const totalPages = Math.ceil(total / limit)
  const photos = photosData.slice(offset, offset + limit)

  return {
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
  }
})
