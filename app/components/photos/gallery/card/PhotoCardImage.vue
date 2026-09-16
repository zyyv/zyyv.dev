<script setup lang="ts">
import type { Photo } from '~/types'

interface Props {
  photo: Photo
  loading: 'eager' | 'lazy'
}

const props = defineProps<Props>()
</script>

<template>
  <SuperImage
    :resources="{
      arthash: props.photo.arthash,
      thumbnail: props.photo.thumbnail,
      compressed: props.photo.compressed,
      origin: props.photo.origin,
    }"
    :arthash-config="props.photo.arthashConfig"
    class="photo-card-media__visual"
    :alt="props.photo.filename"
    :loading="props.loading"
    :width="props.photo.width"
    :height="props.photo.height"
    :aspect-ratio="props.photo.width / props.photo.height"
  />
</template>
