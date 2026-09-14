<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoColorPalette from './PhotoColorPalette.vue'

interface Props {
  photo: Photo
}

const props = defineProps<Props>()
const {
  colors: imageColors,
  status: imageColorsStatus,
  error: imageColorsError,
  analyze: analyzeImageColors,
} = useImageColors(() => props.photo)
</script>

<template>
  <PhotoColorPalette
    :colors="imageColors"
    :status="imageColorsStatus"
    :error="imageColorsError"
    @retry="analyzeImageColors"
  />
</template>
