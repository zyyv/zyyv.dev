<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const { checkerboard, actions } = usePhotoDetailContext()
const label = computed(() =>
  checkerboard.value ? 'Use blurred image background' : 'Use transparency checkerboard background',
)
const icon = computed(() => (checkerboard.value ? 'i-hugeicons:blur' : 'i-hugeicons:grid-table'))
</script>

<template>
  <PhotoDetailControlButton
    :label="label"
    :icon="icon"
    :pressed="checkerboard"
    @click="actions.setCheckerboard(!checkerboard)"
  />
</template>
