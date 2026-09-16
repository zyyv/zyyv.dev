import type { Photo, PhotoReactionType } from '~/types'
import { createEmptyPhotoReactionCounts } from '#shared/constants/photo-reactions'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { isPhotoReactionType } from '../../../utils/photo-reactions'
import { rowToPhoto } from '../../../utils/photos'
import type { PhotoRow } from '../../../utils/photos'

export default defineEventHandler(async (event): Promise<Photo> => {
  const photoId = getRouterParam(event, 'id')
  if (!photoId) throw createError({ statusCode: 400, statusMessage: '缺少图片 ID' })

  const { DB } = useCloudflareBindings(event)
  const [photoResult, reactionsResult] = await DB.batch([
    DB.prepare('SELECT * FROM photos WHERE id = ?').bind(photoId),
    DB.prepare(
      'SELECT reaction, COUNT(*) AS count FROM photo_reactions WHERE photo_id = ? GROUP BY reaction',
    ).bind(photoId),
  ])

  const row = photoResult.results[0] as unknown as PhotoRow | undefined
  if (!row || row.is_private) {
    throw createError({ statusCode: 404, statusMessage: '图片不存在' })
  }

  const counts = createEmptyPhotoReactionCounts()
  for (const reactionRow of reactionsResult.results as unknown as Array<{
    reaction: PhotoReactionType
    count: number
  }>) {
    if (isPhotoReactionType(reactionRow.reaction)) {
      counts[reactionRow.reaction] = Number(reactionRow.count)
    }
  }

  setResponseHeaders(event, {
    'Cache-Control': 'no-store',
    'Cloudflare-CDN-Cache-Control': 'no-store',
    Vary: 'Accept-Encoding',
  })

  return rowToPhoto(row, counts)
})
