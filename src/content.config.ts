import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'

const posts = defineCollection({
  type: 'content',
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
