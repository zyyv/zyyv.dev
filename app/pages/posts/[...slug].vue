<script setup lang="ts">
import { calculateReadingTime } from '~/utils/posts'

const route = useRoute()

const { data: post } = await useAsyncData(`post-${route.path}`, () =>
  queryCollection('posts').path(route.path).first(),
)

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found',
  })
}

const typedPost = computed(() => post.value!)
const tocLinks = computed(() => post.value?.body?.toc?.links ?? [])
const readingMinutes = computed(() => calculateReadingTime(post.value?.body))
const canonicalUrl = computed(() => `https://zyyv.dev${route.path}`)

useSeoMeta({
  title: () => `${typedPost.value.title} - Chris`,
  description: () => typedPost.value.description,
  ogType: 'article',
  ogTitle: () => typedPost.value.title,
  ogDescription: () => typedPost.value.description,
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: canonicalUrl,
  articlePublishedTime: () => new Date(typedPost.value.date).toISOString(),
  articleTag: () => typedPost.value.tags,
  twitterTitle: () => typedPost.value.title,
  twitterDescription: () => typedPost.value.description,
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead(() => ({
  htmlAttrs: {
    lang: typedPost.value.lang,
  },
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
}))
</script>

<template>
  <div v-if="post" class="post-page interior-shell">
    <article>
      <header class="post-header">
        <Back label="All posts" />

        <div class="post-header__meta">
          <time :datetime="new Date(post.date).toISOString()">
            {{ useDateFormat(post.date, 'MMMM DD, YYYY', { locales: 'en-US' }) }}
          </time>
          <span>{{ readingMinutes }} min read</span>
          <span>{{ post.lang }}</span>
        </div>

        <h1>{{ post.title }}</h1>
        <p class="post-header__description">{{ post.description }}</p>

        <ul class="post-header__tags" aria-label="Article tags">
          <li v-for="tag in post.tags" :key="tag">{{ tag }}</li>
        </ul>
      </header>

      <div class="post-layout">
        <div class="post-body prose dark:prose-invert">
          <ContentRenderer :value="post" />
        </div>

        <aside v-if="tocLinks.length" class="post-toc" aria-label="Table of contents">
          <p>On this page</p>
          <Toc :links="tocLinks" :highlights="[]" />
        </aside>
      </div>

      <footer class="post-footer">
        <p>End of article</p>
        <Back label="Back to posts" />
      </footer>
    </article>
  </div>
</template>

<style scoped>
.post-header {
  padding: clamp(6.5rem, 13vw, 9.5rem) 0 clamp(3.25rem, 7vw, 5.5rem);
  border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.post-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
  margin-top: clamp(3rem, 7vw, 5.5rem);
  font-size: 0.64rem;
  letter-spacing: 0.04em;
  opacity: 0.46;
  text-transform: uppercase;
}

.post-header h1 {
  max-width: 18ch;
  margin: 1.3rem 0 0;
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(2.5rem, 6.5vw, 5.25rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: -0.065em;
  text-wrap: balance;
}

.post-header__description {
  max-width: 52ch;
  margin: 1.5rem 0 0;
  font-size: clamp(0.9rem, 1.4vw, 1.05rem);
  line-height: 1.7;
  opacity: 0.58;
  text-wrap: pretty;
}

.post-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 1.75rem 0 0;
  padding: 0;
  list-style: none;
}

.post-header__tags li {
  padding: 0.24rem 0.5rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.2rem;
  font-size: 0.62rem;
  opacity: 0.56;
}

.post-layout {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 42rem) minmax(10rem, 13rem);
  justify-content: space-between;
  gap: clamp(4rem, 10vw, 9rem);
  padding: clamp(3.5rem, 8vw, 6.5rem) 0;
}

.post-body {
  width: 100%;
  max-width: 42rem;
  font-size: 0.94rem;
}

.post-toc {
  position: sticky;
  top: 6rem;
  align-self: start;
  max-height: calc(100dvh - 8rem);
  overflow: auto;
}

.post-toc > p {
  margin: 0 0 1rem;
  font-size: 0.62rem;
  letter-spacing: 0.07em;
  opacity: 0.38;
  text-transform: uppercase;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem 0 clamp(4rem, 9vw, 7rem);
  border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.post-footer p {
  margin: 0;
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  opacity: 0.38;
  text-transform: uppercase;
}

@media (max-width: 959.9px) {
  .post-layout {
    display: block;
  }

  .post-toc {
    display: none;
  }
}
</style>
