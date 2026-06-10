import rss, { type RSSFeedItem } from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { getRssOptions } from '../i18n/pages'
import { defaultLang } from '../i18n/ui'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts'))
    .filter((post) => post.id.startsWith(`${defaultLang}/`))
    .toSorted((a, b) => b.data.date.getTime() - a.data.date.getTime())

  return rss({
    ...getRssOptions(defaultLang, context.site!),
    items: posts.map((post): RSSFeedItem => {
      const slug = post.id.split('/').slice(1).join('/')
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        link: `/posts/${slug}/`,
      }
    }),
  })
}
