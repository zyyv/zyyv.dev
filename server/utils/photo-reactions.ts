import type { H3Event } from 'h3'
import type { PhotoReactionResponse, PhotoReactionType } from '~/types'
import {
  createEmptyPhotoReactionCounts,
  PHOTO_REACTION_TYPES,
} from '#shared/constants/photo-reactions'
import type { D1DatabaseBinding } from '../types/cloudflare'

const VISITOR_COOKIE = 'photo-reaction-visitor'
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isPhotoReactionType(value: unknown): value is PhotoReactionType {
  return typeof value === 'string' && PHOTO_REACTION_TYPES.some((type) => type === value)
}

export function getReactionVisitorId(event: H3Event) {
  const current = getCookie(event, VISITOR_COOKIE)
  if (current && /^[0-9a-f-]{36}$/iu.test(current)) return current

  const visitorId = crypto.randomUUID()
  setCookie(event, VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: VISITOR_COOKIE_MAX_AGE,
  })
  return visitorId
}

export async function getDevelopmentPhotoReactionResponse(
  photoId: string,
): Promise<PhotoReactionResponse> {
  const stored = await useStorage('photo-reactions').getItem<PhotoReactionResponse>(photoId)
  return stored ?? { counts: createEmptyPhotoReactionCounts() }
}

export async function addDevelopmentPhotoReaction(
  photoId: string,
  reaction: PhotoReactionType,
): Promise<PhotoReactionResponse> {
  const current = await getDevelopmentPhotoReactionResponse(photoId)
  const response = {
    counts: {
      ...current.counts,
      [reaction]: current.counts[reaction] + 1,
    },
  }
  await useStorage('photo-reactions').setItem(photoId, response)
  return response
}

export async function requirePublicPhoto(database: D1DatabaseBinding, photoId: string) {
  const photo = await database
    .prepare('SELECT id FROM photos WHERE id = ? AND is_private = 0')
    .bind(photoId)
    .first<{ id: string }>()

  if (!photo) throw createError({ statusCode: 404, statusMessage: '图片不存在' })
}

export async function getPhotoReactionResponse(
  database: D1DatabaseBinding,
  photoId: string,
): Promise<PhotoReactionResponse> {
  const countsResult = await database
    .prepare(
      'SELECT reaction, COUNT(*) AS count FROM photo_reactions WHERE photo_id = ? GROUP BY reaction',
    )
    .bind(photoId)
    .all()
  const counts = createEmptyPhotoReactionCounts()

  for (const row of countsResult.results as unknown as Array<{
    reaction: PhotoReactionType
    count: number
  }>) {
    if (isPhotoReactionType(row.reaction)) counts[row.reaction] = Number(row.count)
  }

  return { counts }
}
