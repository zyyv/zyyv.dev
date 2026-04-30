import type { CollectionEntry } from 'astro:content'
import type { PostPreview } from '../../app/types'

export function getPostPath(post: CollectionEntry<'posts'>) {
  return `/posts/${post.id.replace(/\.md$/, '')}`
}

export function toPostPreview(post: CollectionEntry<'posts'>): PostPreview {
  return {
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    path: getPostPath(post),
    date: post.data.date.toISOString(),
    tags: post.data.tags,
    lang: post.data.lang,
    rawbody: post.body,
  }
}

export function sortPosts(posts: CollectionEntry<'posts'>[]) {
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/g).filter(Boolean).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export function formatPostDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date))
}
