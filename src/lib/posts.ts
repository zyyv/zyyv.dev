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
