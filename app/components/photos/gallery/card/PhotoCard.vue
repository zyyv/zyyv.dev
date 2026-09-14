<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoCardHoverInfo from './PhotoCardHoverInfo.vue'
import PhotoCardMedia from './PhotoCardMedia.vue'

interface Props {
  photo: Photo
  loading: 'eager' | 'lazy'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  open: [photo: Photo, source: HTMLElement]
}>()

function openPreview(event: MouseEvent) {
  emit('open', props.photo, event.currentTarget as HTMLElement)
}
</script>

<template>
  <button
    type="button"
    class="photo-card"
    :data-photo-transition-id="props.photo.id"
    :aria-label="`View ${props.photo.filename}`"
    data-cuelume-toggle="page"
    @click="openPreview"
  >
    <PhotoCardMedia
      :photo="props.photo"
      :loading="props.loading"
      class="photo-card__image"
      :style="{ '--media-aspect-ratio': `${props.photo.width} / ${props.photo.height}` }"
    />
    <PhotoCardHoverInfo :photo="props.photo" />
  </button>
</template>

<style scoped>
.photo-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: zoom-in;
  outline: none;
}

.photo-card::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.photo-card:focus-visible {
  box-shadow: 0 0 0 2px currentColor;
}

.photo-card:focus-visible :deep(.photo-hover-info) {
  opacity: 1;
  transform: translateY(0);
}

@media (hover: hover) and (pointer: fine) {
  .photo-card:hover :deep(.photo-hover-info) {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
