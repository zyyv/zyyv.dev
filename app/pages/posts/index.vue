<script setup lang="ts">
import PostsIndex from '~/components/posts/PostsIndex.vue'
import { toPostPreview } from '~/utils/posts'

const { data: postDocuments } = await useAsyncData('posts-index', () =>
  queryCollection('posts').order('date', 'DESC').all(),
)

const posts = computed(() => (postDocuments.value ?? []).map((post) => toPostPreview(post)))

useSeoMeta({
  title: 'Posts - Chris',
  description: 'Notes on front-end tooling, open source, and the details discovered along the way.',
  ogType: 'website',
  ogTitle: 'Posts - Chris',
  ogDescription:
    'Notes on front-end tooling, open source, and the details discovered along the way.',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/posts',
  twitterTitle: 'Posts - Chris',
  twitterDescription:
    'Notes on front-end tooling, open source, and the details discovered along the way.',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/posts' }],
})
</script>

<template>
  <div class="interior-shell interior-shell--reading">
    <PostsIndex :posts="posts" />
  </div>
</template>
