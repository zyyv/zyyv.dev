import { photosData } from '../utils/data'
import { useOptionalDatabase } from '../utils/cloudflare'
import { listPublicPhotos } from '../utils/photos'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(50, Number(query.limit) || 12))
  const offset = (page - 1) * limit

  const database = useOptionalDatabase(event)
  const source = database ? await listPublicPhotos(database) : photosData
  const total = source.length
  const totalPages = Math.ceil(total / limit)
  const photos = source.slice(offset, offset + limit)

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
