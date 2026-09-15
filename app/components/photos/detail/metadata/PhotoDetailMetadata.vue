<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import PhotoDetailCapture from './PhotoDetailCapture.vue'
import PhotoDetailFile from './PhotoDetailFile.vue'
import PhotoDetailPalette from './PhotoDetailPalette.vue'
import PhotoDetailReactions from './PhotoDetailReactions.vue'
import PhotoHistogramPanel from './PhotoHistogramPanel.vue'
import PhotoPreviewPanel from './PhotoPreviewPanel.vue'

const { detailPhoto } = usePhotoDetailContext()
const photo = computed(() => detailPhoto.value!)
const emit = defineEmits<{
  detailsTouchStart: [event: TouchEvent]
  detailsTouchMove: [event: TouchEvent]
  detailsTouchEnd: [event: TouchEvent]
  detailsTouchCancel: []
}>()
</script>

<template>
  <aside
    class="photo-dialog__details space-y-[clamp(1.5rem,3vh,2.5rem)] max-md:space-y-[1rem]"
    aria-label="Photo details"
  >
    <div
      class="photo-dialog__details-handle"
      aria-hidden="true"
      @touchstart.stop="emit('detailsTouchStart', $event)"
      @touchmove.stop="emit('detailsTouchMove', $event)"
      @touchend.stop="emit('detailsTouchEnd', $event)"
      @touchcancel.stop="emit('detailsTouchCancel')"
      @pointerdown.stop
      @pointermove.stop
      @pointerup.stop
      @pointercancel.stop
    />
    <PhotoPreviewPanel v-if="photo.mediaType === 'image'" />
    <PhotoDetailFile :photo="photo" />
    <PhotoDetailCapture :photo="photo" />
    <PhotoHistogramPanel v-if="photo.mediaType === 'image'" :photo="photo" />
    <PhotoDetailPalette :photo="photo" />
    <PhotoDetailReactions />
  </aside>
</template>

<style scoped>
.photo-dialog__details-handle {
  display: none;
}

@media (max-width: 767.9px) {
  .photo-dialog__details-handle {
    position: sticky;
    z-index: 1;
    top: 0;
    display: block;
    width: 3.25rem;
    height: 2.25rem;
    margin: -0.75rem auto 0.2rem;
    padding: 0;
    border: 0;
    background: var(--dialog-bg) linear-gradient(var(--dialog-muted), var(--dialog-muted)) center
      0.48rem / 2rem 0.18rem no-repeat;
    cursor: grab;
    touch-action: none;
  }

  .photo-dialog__details-handle:active {
    cursor: grabbing;
  }
}
</style>
