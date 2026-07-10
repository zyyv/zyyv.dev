import path from 'node:path'
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const posts = defineCollection({
  type: 'page',
  source: {
    cwd: path.resolve('./src/content/posts'),
    include: '**/*.md',
    prefix: '/posts',
  },
  schema: z.object({
    date: z.date(),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    lang: z.string(),
  }),
})

export default defineContentConfig({
  collections: {
    posts,
  },
})
