<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const props = withDefaults(
  defineProps<{
    photo: Photo
    loading?: boolean
    progress?: number
  }>(),
  {
    loading: false,
    progress: 0,
  },
)

const mediaLabel = computed(() => (props.photo.mediaType === 'video' ? 'video' : 'image'))
const label = computed(() =>
  props.loading
    ? `Loading compressed ${mediaLabel.value}`
    : `Download original ${mediaLabel.value}`,
)
const href = computed(() => (props.loading ? undefined : `/api/photos/${props.photo.id}/download`))
</script>

<template>
  <PhotoDetailControlButton
    :label="label"
    icon="i-hugeicons:download-04"
    :href="href"
    :download="props.photo.filename"
    :loading="props.loading"
    :progress="props.progress"
  />
</template>
