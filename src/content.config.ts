import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    lang: z.string(),
  }),
})

export const collections = {
  posts,
}
