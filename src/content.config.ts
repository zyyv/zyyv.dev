import { defineCollection, z } from 'astro:content'

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
