import type { PhotoReactionResponse } from '~/types'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import {
  getDevelopmentPhotoReactionResponse,
  getPhotoReactionResponse,
  requirePublicPhoto,
} from '../../../utils/photo-reactions'

export default defineEventHandler(async (event): Promise<PhotoReactionResponse> => {
  const photoId = getRouterParam(event, 'id')
  if (!photoId) throw createError({ statusCode: 400, statusMessage: '缺少图片 ID' })

  if (import.meta.dev) return getDevelopmentPhotoReactionResponse(photoId)

  const { DB } = useCloudflareBindings(event)
  await requirePublicPhoto(DB, photoId)
  return getPhotoReactionResponse(DB, photoId)
})
