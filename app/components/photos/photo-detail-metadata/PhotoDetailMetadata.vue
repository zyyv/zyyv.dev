<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import PhotoDetailCapture from './PhotoDetailCapture.vue'
import PhotoDetailFile from './PhotoDetailFile.vue'
import PhotoDetailPalette from './PhotoDetailPalette.vue'
import PhotoDetailReactions from './PhotoDetailReactions.vue'
import PhotoPreviewPanel from './PhotoPreviewPanel.vue'

const { detailPhoto } = usePhotoDetailContext()
const photo = computed(() => detailPhoto.value!)
</script>

<template>
  <aside
    class="photo-dialog__details space-y-[clamp(1.5rem,3vh,2.5rem)] max-md:space-y-[1rem]"
    aria-label="Photo details"
  >
    <PhotoPreviewPanel v-if="photo.mediaType === 'image'" />
    <PhotoDetailFile :photo="photo" />
    <PhotoDetailCapture :photo="photo" />
    <PhotoDetailPalette :photo="photo" />
    <PhotoDetailReactions />
  </aside>
</template>
