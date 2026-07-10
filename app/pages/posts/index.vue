<script setup lang="ts">
import PostsIndex from '~/components/posts/PostsIndex.vue'
import { toPostPreview } from '~/utils/posts'

const { data: postDocuments } = await useAsyncData('posts-index', () =>
  queryCollection('posts').order('date', 'DESC').all(),
)

const posts = computed(() => (postDocuments.value ?? []).map((post) => toPostPreview(post)))

useSeoMeta({
  title: 'Posts - Chris',
  description: 'In the flow of time, seeking resonance with the soul.',
  ogType: 'website',
  ogTitle: 'Posts - Chris',
  ogDescription: 'In the flow of time, seeking resonance with the soul.',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/posts',
  twitterTitle: 'Posts - Chris',
  twitterDescription: 'In the flow of time, seeking resonance with the soul.',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/posts' }],
})
</script>

<template>
  <div class="mxa w-65ch px-6">
    <PostsIndex :posts="posts" />
  </div>
</template>
