<script setup lang="ts">
import type { Photo, PhotoReactionCounts } from '~/types'
import PhotoDetailCapture from './PhotoDetailCapture.vue'
import PhotoDetailFile from './PhotoDetailFile.vue'
import PhotoDetailPalette from './PhotoDetailPalette.vue'
import PhotoDetailReactions from './PhotoDetailReactions.vue'

interface Props {
  photo: Photo
  reactionCounts: PhotoReactionCounts
}

defineProps<Props>()
</script>

<template>
  <aside class="photo-dialog__details space-y-[clamp(2rem,4vh,3.5rem)]" aria-label="Photo details">
    <PhotoDetailFile :photo="photo" />
    <PhotoDetailCapture :photo="photo" />
    <PhotoDetailPalette :photo="photo" />
    <PhotoDetailReactions :reaction-counts="reactionCounts" />
  </aside>
</template>
