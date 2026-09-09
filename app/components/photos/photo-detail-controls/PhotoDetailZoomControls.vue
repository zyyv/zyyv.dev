<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const { zoomLabel, actions } = usePhotoDetailContext()
</script>

<template>
  <div class="photo-detail-zoom-controls" role="group" aria-label="Zoom controls">
    <PhotoDetailControlButton
      label="Zoom out"
      icon="i-hugeicons:zoom-out-area"
      @click="actions.zoomOut"
    />
    <PhotoDetailControlButton
      :label="`Reset image view, ${zoomLabel}`"
      :text="zoomLabel"
      variant="value"
      @click="actions.resetZoom"
    />
    <PhotoDetailControlButton
      label="Zoom in"
      icon="i-hugeicons:zoom-in-area"
      @click="actions.zoomIn"
    />
  </div>
</template>

<style scoped>
.photo-detail-zoom-controls {
  display: flex;
  min-width: 7.6rem;
  align-self: stretch;
}

.photo-detail-zoom-controls
  > :deep(.photo-detail-control-button)
  + :deep(.photo-detail-control-button) {
  border-left: 1px dashed var(--dialog-line, rgb(244 244 240 / 22%));
}
</style>
