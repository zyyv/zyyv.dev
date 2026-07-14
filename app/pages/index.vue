<script setup lang="ts">
import type { Photo } from '~/types'
import Home from '~/components/Home.vue'

const { data: photos } = await useFetch<Photo[]>('/api/photos-data.json', {
  key: 'home-photos',
  default: () => [],
})

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
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/' }],
})
</script>

<template>
  <Home :photos="photos" />
</template>
