<script setup lang="ts">
import type { Photo } from '~/types'
import Home from '~/components/Home.vue'
import { toPostPreview } from '~/utils/posts'

const { data: postDocuments } = await useAsyncData('home-posts', () =>
  queryCollection('posts').order('date', 'DESC').limit(10).all(),
)
const { data: photos } = await useFetch<Photo[]>('/api/photos-data.json', {
  key: 'home-photos',
  default: () => [],
})

const posts = computed(() => (postDocuments.value ?? []).map((post) => toPostPreview(post)))

useSeoMeta({
  title: 'Chris',
  description: 'Regardless of the past, do not ask the future.',
  ogType: 'website',
  ogTitle: 'Chris',
  ogDescription: 'Regardless of the past, do not ask the future.',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/',
  twitterTitle: 'Chris',
  twitterDescription: 'Regardless of the past, do not ask the future.',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  bodyAttrs: {
    class: 'home-page',
  },
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/' }],
})
</script>

<template>
  <Home :posts="posts" :photos="photos" />
</template>
