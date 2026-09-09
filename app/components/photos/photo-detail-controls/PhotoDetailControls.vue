<script setup lang="ts">
import type { Photo, PhotoReactionType } from '~/types'
import PhotoDetailBackgroundControl from './PhotoDetailBackgroundControl.vue'
import PhotoDetailDownloadControl from './PhotoDetailDownloadControl.vue'
import PhotoDetailReactionControl from './PhotoDetailReactionControl.vue'
import PhotoDetailShareControl from './PhotoDetailShareControl.vue'
import PhotoDetailZoomControls from './PhotoDetailZoomControls.vue'

interface Props {
  photo: Photo
  variant?: 'dialog' | 'media'
  reactionError?: string | null
  reactionSaving?: boolean
  reactionDisabled?: boolean
  downloadLoading?: boolean
  downloadProgress?: number
  zoomLabel?: string
}

interface Emits {
  react: [reaction: PhotoReactionType]
  zoomIn: []
  zoomOut: []
  resetZoom: []
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dialog',
  reactionError: null,
  reactionSaving: false,
  reactionDisabled: false,
  downloadLoading: false,
  downloadProgress: 0,
  zoomLabel: '100%',
})
const emit = defineEmits<Emits>()
const checkerboard = defineModel<boolean>('checkerboard', { default: false })
const isVideo = computed(() => props.photo.mediaType === 'video')
const controlsClasses = computed(() => [
  'photo-detail-controls',
  `photo-detail-controls--${props.variant}`,
])
</script>

<template>
  <div :class="controlsClasses" role="group" aria-label="Media actions" @pointerdown.stop>
    <div class="photo-detail-controls__item">
      <PhotoDetailReactionControl
        :photo="props.photo"
        :disabled="props.reactionDisabled"
        :busy="props.reactionSaving"
        :error="props.reactionError"
        @react="emit('react', $event)"
      />
    </div>

    <div v-if="!isVideo" class="photo-detail-controls__item">
      <PhotoDetailBackgroundControl v-model="checkerboard" />
    </div>

    <div v-if="!isVideo" class="photo-detail-controls__item">
      <PhotoDetailZoomControls
        :zoom-label="props.zoomLabel"
        @zoom-in="emit('zoomIn')"
        @zoom-out="emit('zoomOut')"
        @reset="emit('resetZoom')"
      />
    </div>

    <div class="photo-detail-controls__item">
      <PhotoDetailShareControl :photo="props.photo" />
    </div>

    <div class="photo-detail-controls__item">
      <PhotoDetailDownloadControl
        :photo="props.photo"
        :loading="props.downloadLoading"
        :progress="props.downloadProgress"
      />
    </div>
  </div>
</template>

<style scoped>
.photo-detail-controls {
  --photo-detail-control-color: var(--dialog-text, var(--media-text-color, #f4f4f0));
  --photo-detail-control-hover-background: var(
    --dialog-checker,
    var(--media-control-hover-background, rgb(244 244 240 / 8%))
  );

  display: flex;
  flex: 0 0 auto;
  min-height: 2rem;
  overflow: visible;
  border: 1px dashed var(--dialog-line, rgb(244 244 240 / 22%));
  background: var(--dialog-control, rgb(8 8 8 / 88%));
  color: var(--photo-detail-control-color);
  backdrop-filter: blur(0.75rem);
}

.photo-detail-controls--media {
  --photo-detail-control-color: var(--media-text-color, var(--media-primary-color, #f4f4f0));
  --photo-detail-control-hover-background: var(--media-control-hover-background, transparent);
  --photo-detail-control-radius: 0.65rem;

  gap: 0.2rem;
  min-height: 0;
  border: 0;
  background: var(--media-control-background, transparent);
  backdrop-filter: none;
}

.photo-detail-controls__item {
  display: flex;
  min-width: 0;
  align-items: stretch;
}

.photo-detail-controls__item + .photo-detail-controls__item {
  border-left: 1px dashed var(--dialog-line, rgb(244 244 240 / 22%));
}

.photo-detail-controls--media .photo-detail-controls__item + .photo-detail-controls__item {
  border-left: 0;
}

@media (max-width: 767.9px) {
  .photo-detail-controls {
    min-height: 1.9rem;
  }
}
</style>
