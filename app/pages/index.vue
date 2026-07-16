<script setup lang="ts">
import Home from '~/components/Home.vue'

const { data: photoResponse } = await usePublicPhotos()
const photos = computed(() => photoResponse.value.photos)

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
