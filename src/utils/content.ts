import { getCollection, type CollectionEntry } from 'astro:content'
import { languages } from '../i18n/ui'
import { getLocaleFromLang, type Lang } from '../i18n/utils'

export type PostEntry = CollectionEntry<'posts'>

export function getPostSlug(id: string) {
  return id.split('/').slice(1).join('/')
}

export function getPostOgImagePath(id: string) {
  const [lang, ...rest] = id.split('/')
  const slug = rest.join('/')
  return `/og/posts/${lang}/${slug}.png`
}

export async function getPostPaths(lang: Lang) {
  const posts = await getCollection('posts')
  return posts
    .filter((post) => post.id.startsWith(`${lang}/`))
    .map((post) => ({
      params: { slug: getPostSlug(post.id) },
      props: { post },
    }))
}

export async function getPostsByLang(lang: Lang) {
  const posts = await getCollection('posts')
  return posts
    .filter((post) => post.id.startsWith(`${lang}/`))
    .map((post) => ({
      ...post,
      slug: getPostSlug(post.id),
    }))
    .toSorted((a, b) => b.data.date.getTime() - a.data.date.getTime())
}

export async function getAvailableLangsForPost(slug: string) {
  const posts = await getCollection('posts')
  const langKeys = Object.keys(languages) as Lang[]
  return langKeys.filter((lang) =>
    posts.some((post) => post.id === `${lang}/${slug}`)
  )
}

export function formatDate(date: Date, lang: Lang) {
  return date.toLocaleDateString(getLocaleFromLang(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
