<script setup lang="ts">
import type { Photo } from '~/types'
import PhotosGallery from '~/components/photos/Photos.vue'
import RipplablePhotos from '~/components/photos/RipplablePhotos.vue'

const { data: photos } = await useFetch<Photo[]>('/api/photos-data.json', {
  key: 'photos-page',
  default: () => [],
})

const { mode, isTransitioning } = usePhotosViewMode()

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
    <Transition name="photos-view" mode="out-in" :css="!isTransitioning">
      <PhotosGallery v-if="mode === 'waterfall'" key="waterfall" :photos="photos" />
      <RipplablePhotos v-else key="ripplable" :photos="photos" />
    </Transition>
  </div>
</template>

<style scoped>
.photos-page {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  contain: layout;
}

.photos-view-enter-active,
.photos-view-leave-active {
  transition:
    opacity 220ms ease,
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photos-view-enter-from {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.992);
}

.photos-view-leave-to {
  opacity: 0;
  transform: translateY(-0.45rem) scale(0.996);
}

@media (prefers-reduced-motion: reduce) {
  .photos-view-enter-active,
  .photos-view-leave-active {
    transition-duration: 1ms;
  }
}
</style>
