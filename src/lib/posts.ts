import type { CollectionEntry } from 'astro:content'
import type { PostPreview } from '../../app/types'

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
})

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
    month: 'short',
    day: '2-digit',
  }).format(new Date(date))
}

export function formatPostTimeAgo(date: string | Date) {
  const diffInSeconds = Math.round((new Date(date).getTime() - Date.now()) / 1000)
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  for (const [unit, seconds] of units) {
    if (Math.abs(diffInSeconds) >= seconds || unit === 'minute') {
      return relativeTimeFormatter.format(Math.round(diffInSeconds / seconds), unit)
    }
  }

  return relativeTimeFormatter.format(diffInSeconds, 'second')
}
