<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoCardImage from './PhotoCardImage.vue'
import PhotoCardVideo from './PhotoCardVideo.vue'

const props = withDefaults(defineProps<{ photo: Photo; loading?: 'eager' | 'lazy' }>(), {
  loading: 'lazy',
})
const isVideo = computed(() => props.photo.mediaType === 'video')
</script>

<template>
  <span class="photo-card-media">
    <PhotoCardVideo v-if="isVideo" :photo="props.photo" />
    <PhotoCardImage v-else :photo="props.photo" :loading="props.loading" />
  </span>
</template>

<style scoped>
.photo-card-media {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  aspect-ratio: var(--media-aspect-ratio);
  background: #11110f;
}

.photo-card-media :deep(.photo-card-media__visual) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.002);
  transition:
    transform 480ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 320ms ease;
}

@media (hover: hover) and (pointer: fine) {
  :global(.photo-card:hover) .photo-card-media :deep(.photo-card-media__visual) {
    filter: brightness(0.88) saturate(0.96);
    transform: scale(1.025);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-card-media :deep(.photo-card-media__visual) {
    transition: none;
  }
}
</style>
