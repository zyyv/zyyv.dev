import type { PhotoReactionResponse, PhotoReactionType } from '~/types'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import {
  addDevelopmentPhotoReaction,
  getPhotoReactionResponse,
  getReactionVisitorId,
  isPhotoReactionType,
  requirePublicPhoto,
} from '../../../utils/photo-reactions'

interface ReactionBody {
  reaction?: PhotoReactionType
}

export default defineEventHandler(async (event): Promise<PhotoReactionResponse> => {
  const photoId = getRouterParam(event, 'id')
  if (!photoId) throw createError({ statusCode: 400, statusMessage: '缺少图片 ID' })

  const body = await readBody<ReactionBody>(event)
  if (!isPhotoReactionType(body?.reaction)) {
    throw createError({ statusCode: 400, statusMessage: '不支持的图片表情' })
  }

  if (import.meta.dev) return addDevelopmentPhotoReaction(photoId, body.reaction)

  const { DB } = useCloudflareBindings(event)
  await requirePublicPhoto(DB, photoId)
  const visitorId = getReactionVisitorId(event)
  const now = new Date().toISOString()
  await DB.prepare(
    `INSERT INTO photo_reactions (photo_id, visitor_id, reaction, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(photoId, visitorId, body.reaction, now, now)
    .run()

  return getPhotoReactionResponse(DB, photoId)
})
