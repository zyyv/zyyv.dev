import type { PostPreview } from '~/types'

export interface PostDocument {
  id: string
  path: string
  stem: string
  title: string
  description: string
  date: string | Date
  tags: string[]
  lang: string
  body?: unknown
}

function extractText(node: unknown): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join(' ')
  if (!node || typeof node !== 'object') return ''

  return Object.values(node).map(extractText).join(' ')
}

export function getPostPath(post: Pick<PostDocument, 'path'>) {
  return post.path
}

export function calculateReadingTime(body?: unknown): number {
  const words = extractText(body).trim().split(/\s+/u).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function toPostPreview(post: PostDocument): PostPreview {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    path: getPostPath(post),
    date: new Date(post.date).toISOString(),
    tags: post.tags,
    lang: post.lang,
    readingMinutes: calculateReadingTime(post.body),
  }
}
