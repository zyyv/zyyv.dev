<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import PhotoDetailBackgroundControl from './PhotoDetailBackgroundControl.vue'
import PhotoDetailCloseControl from './PhotoDetailCloseControl.vue'
import PhotoDetailDetailsControl from './PhotoDetailDetailsControl.vue'
import PhotoDetailDownloadControl from './PhotoDetailDownloadControl.vue'
import PhotoDetailMultiControl from './PhotoDetailMultiControl.vue'
import PhotoDetailReactionControl from './PhotoDetailReactionControl.vue'
import PhotoDetailShareControl from './PhotoDetailShareControl.vue'

interface Props {
  variant?: 'dialog' | 'media'
  detailsOpen?: boolean
  showDetailsToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dialog',
  detailsOpen: false,
  showDetailsToggle: false,
})
const emit = defineEmits<{
  toggleDetails: []
}>()
const { isVideo } = usePhotoDetailContext()
const controlsClasses = computed(() => [
  'photo-detail-controls',
  `photo-detail-controls--${props.variant}`,
])
</script>

<template>
  <div :class="controlsClasses" role="group" aria-label="Media actions" @pointerdown.stop>
    <template v-if="props.variant === 'dialog'">
      <div class="photo-detail-controls__rail">
        <div class="photo-detail-controls__item photo-detail-controls__item--multi">
          <PhotoDetailMultiControl />
        </div>

        <div v-if="props.showDetailsToggle" class="photo-detail-controls__item">
          <PhotoDetailDetailsControl :open="props.detailsOpen" @toggle="emit('toggleDetails')" />
        </div>

        <div class="photo-detail-controls__item">
          <PhotoDetailShareControl />
        </div>

        <div class="photo-detail-controls__item photo-detail-controls__item--close">
          <PhotoDetailCloseControl />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="photo-detail-controls__item">
        <PhotoDetailReactionControl />
      </div>

      <div v-if="!isVideo" class="photo-detail-controls__item">
        <PhotoDetailBackgroundControl />
      </div>

      <div class="photo-detail-controls__item">
        <PhotoDetailShareControl />
      </div>

      <div class="photo-detail-controls__item">
        <PhotoDetailDownloadControl />
      </div>
    </template>
  </div>
</template>

<style scoped>
.photo-detail-controls {
  --photo-detail-control-color: var(--dialog-text, var(--media-text-color, #f4f4f0));
  --photo-detail-control-active: color-mix(
    in srgb,
    var(--dialog-text, var(--media-text-color, #f4f4f0)) 54%,
    #e3a06b
  );
  --photo-detail-control-hover-background: var(
    --dialog-checker,
    var(--media-control-hover-background, rgb(244 244 240 / 8%))
  );

  display: flex;
  flex: 0 0 auto;
  min-height: 2rem;
  overflow: visible;
  color: var(--photo-detail-control-color);
}

.photo-detail-controls--dialog {
  --photo-detail-control-size: 2.2rem;

  width: max-content;
  min-height: 0;
  align-items: center;
  justify-content: flex-end;
  border: 0;
  background: transparent;
  backdrop-filter: none;
}

.photo-detail-controls__rail {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.22rem;
}

.photo-detail-controls__item {
  display: flex;
  min-width: 0;
  align-items: stretch;
}

.photo-detail-controls--dialog .photo-detail-controls__item {
  flex: 0 0 var(--photo-detail-control-size);
}

.photo-detail-controls--dialog .photo-detail-controls__item--multi {
  flex-basis: auto;
}

.photo-detail-controls--dialog .photo-detail-controls__item--close {
  margin-left: 0.1rem;
}

.photo-detail-controls--dialog :deep(.photo-detail-control-button) {
  width: var(--photo-detail-control-size);
  min-height: var(--photo-detail-control-size);
  border-radius: 50%;
}

.photo-detail-controls--dialog :deep(.photo-detail-control-button.is-pressed) {
  background: color-mix(in srgb, var(--photo-detail-control-active) 16%, transparent);
}

.photo-detail-controls--dialog :deep(.photo-detail-control-button.is-success) {
  background: color-mix(in srgb, var(--photo-detail-control-success, #4b9b68) 14%, transparent);
}

.photo-detail-controls--dialog :deep(.photo-detail-control-button i) {
  width: 1.18rem;
  height: 1.18rem;
  font-size: 1.18rem;
}

.photo-detail-controls--dialog
  .photo-detail-controls__item--close
  :deep(.photo-detail-control-button) {
  color: color-mix(in srgb, var(--dialog-text) 68%, transparent);
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

@media (prefers-reduced-transparency: reduce) {
  .photo-detail-controls--dialog :deep(.photo-detail-control-button) {
    background: var(--dialog-bg);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
</style>
