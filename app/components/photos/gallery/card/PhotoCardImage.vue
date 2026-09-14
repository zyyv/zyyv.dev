<script setup lang="ts">
import type { Photo } from '~/types'

interface Props {
  photo: Photo
  loading: 'eager' | 'lazy'
}

const props = defineProps<Props>()
</script>

<template>
  <ImgBlurHash
    class="photo-card-media__visual"
    :src="props.photo.thumbnail"
    :alt="props.photo.filename"
    :loading="props.loading"
    :width="props.photo.width"
    :height="props.photo.height"
    :blurhash="props.photo.blurhash"
    :aspect-ratio="props.photo.width / props.photo.height"
  />
</template>
