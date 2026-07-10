<script setup lang="ts">
import type { Photo } from '~/types'
import PhotosGallery from '~/components/photos/Photos.vue'

const { data: photos } = await useFetch<Photo[]>('/api/photos-data.json', {
  key: 'photos-page',
  default: () => [],
})

useSeoMeta({
  title: 'Photos - Chris',
  description: 'Chris的摄影作品集',
  ogType: 'website',
  ogTitle: 'Photos - Chris',
  ogDescription: 'Chris的摄影作品集',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/photos',
  twitterTitle: 'Photos - Chris',
  twitterDescription: 'Chris的摄影作品集',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/photos' }],
})
</script>

<template>
  <div class="h-screen">
    <PhotosGallery :photos="photos" />
  </div>
</template>
