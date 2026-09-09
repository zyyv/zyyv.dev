<script setup lang="ts">
import type {
  Photo,
  PhotoPreviewLoadingState,
  PhotoPreviewVariant,
  PhotoReactionCounts,
} from '~/types'
import PhotoDetailCapture from './PhotoDetailCapture.vue'
import PhotoDetailFile from './PhotoDetailFile.vue'
import PhotoDetailPalette from './PhotoDetailPalette.vue'
import PhotoDetailReactions from './PhotoDetailReactions.vue'
import PhotoPreviewPanel from './PhotoPreviewPanel.vue'

interface Props {
  photo: Photo
  reactionCounts: PhotoReactionCounts
  previewVariant: PhotoPreviewVariant
  previewLoading: PhotoPreviewLoadingState
}

interface Emits {
  previewChange: [variant: PhotoPreviewVariant]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <aside
    class="photo-dialog__details space-y-[clamp(1.5rem,3vh,2.5rem)] max-md:space-y-[1rem]"
    aria-label="Photo details"
  >
    <PhotoPreviewPanel
      v-if="props.photo.mediaType === 'image'"
      :photo="props.photo"
      :variant="props.previewVariant"
      :loading="props.previewLoading"
      @change="emit('previewChange', $event)"
    />
    <PhotoDetailFile :photo="photo" />
    <PhotoDetailCapture :photo="photo" />
    <PhotoDetailPalette :photo="photo" />
    <PhotoDetailReactions :reaction-counts="reactionCounts" />
  </aside>
</template>
