<script setup lang="ts">
import type { Photo } from '~/types'
import PhotosGallery from '~/components/photos/Photos.vue'
import RipplablePhotos from '~/components/photos/RipplablePhotos.vue'

const { data: photos } = await useFetch<Photo[]>('/api/photos-data.json', {
  key: 'photos-page',
  default: () => [],
})

const { mode } = usePhotosViewMode()

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
  <div class="photos-page">
    <PhotosGallery v-if="mode === 'waterfall'" :photos="photos" />
    <RipplablePhotos v-else :photos="photos" />
  </div>
</template>

<style scoped>
.photos-page {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
</style>
