<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/photos/detail/usePhotoDetailContext'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const { detailPhoto, actions } = usePhotoDetailContext()
const mediaLabel = computed(() => (detailPhoto.value?.mediaType === 'video' ? 'video' : 'photo'))
const label = computed(() => `Close this ${mediaLabel.value}`)
</script>

<template>
  <PhotoDetailControlButton
    :label="label"
    title="Close"
    icon="i-hugeicons:cancel-01"
    sound="droplet"
    @click="actions.close"
  />
</template>
