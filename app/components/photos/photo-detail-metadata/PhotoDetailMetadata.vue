<script setup lang="ts">
import type { Photo, PhotoReactionCounts } from '~/types'
import PhotoPreviewPanel from '../PhotoPreviewPanel.vue'
import type { PhotoPreviewVariant } from '../photo-preview.types'
import PhotoDetailCapture from './PhotoDetailCapture.vue'
import PhotoDetailFile from './PhotoDetailFile.vue'
import PhotoDetailPalette from './PhotoDetailPalette.vue'
import PhotoDetailReactions from './PhotoDetailReactions.vue'

interface Props {
  photo: Photo
  reactionCounts: PhotoReactionCounts
  previewVariant: PhotoPreviewVariant
}

interface Emits {
  previewChange: [variant: PhotoPreviewVariant]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <aside class="photo-dialog__details space-y-[clamp(2rem,4vh,3.5rem)]" aria-label="Photo details">
    <PhotoPreviewPanel
      v-if="props.photo.mediaType === 'image'"
      :photo="props.photo"
      :variant="props.previewVariant"
      @change="emit('previewChange', $event)"
    />
    <PhotoDetailFile :photo="photo" />
    <PhotoDetailCapture :photo="photo" />
    <PhotoDetailPalette :photo="photo" />
    <PhotoDetailReactions :reaction-counts="reactionCounts" />
  </aside>
</template>
