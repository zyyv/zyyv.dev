<script setup lang="ts">
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
  <div v-if="post">
    <article class="prose dark:prose-invert mxa peer text-3.75 py-20">
      <h1>{{ post.title }}</h1>
      <ContentRenderer :value="post" />
      <Back class="mt-8" />
    </article>

    <aside v-if="tocLinks.length" class="pf right-10 top-40 op-36 trans">
      <Toc :links="tocLinks" :highlights="[]" />
    </aside>
  </div>
</template>
