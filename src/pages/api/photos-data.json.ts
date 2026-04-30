import type { APIRoute } from 'astro'
import { photosData } from '../../../server/utils/data'

export const prerender = true

export const GET: APIRoute = () => {
  return Response.json(photosData)
}
