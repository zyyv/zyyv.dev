<script setup lang="ts">
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

interface Props {
  zoomLabel: string
}

interface Emits {
  zoomIn: []
  zoomOut: []
  reset: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="photo-detail-zoom-controls" role="group" aria-label="Zoom controls">
    <PhotoDetailControlButton
      label="Zoom out"
      icon="i-hugeicons:zoom-out-area"
      @click="emit('zoomOut')"
    />
    <PhotoDetailControlButton
      :label="`Reset image view, ${props.zoomLabel}`"
      :text="props.zoomLabel"
      variant="value"
      @click="emit('reset')"
    />
    <PhotoDetailControlButton
      label="Zoom in"
      icon="i-hugeicons:zoom-in-area"
      @click="emit('zoomIn')"
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
