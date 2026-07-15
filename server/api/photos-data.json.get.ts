import { photosData } from '../utils/data'
import { useOptionalDatabase } from '../utils/cloudflare'
import { listPublicPhotos } from '../utils/photos'

export default defineEventHandler(async (event) => {
  const database = useOptionalDatabase(event)
  return database ? await listPublicPhotos(database) : photosData
})
