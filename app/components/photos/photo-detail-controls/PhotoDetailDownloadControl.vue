<script setup lang="ts">
import type { Photo, PhotoPreviewVariant } from '~/types'
import { getPhotoDownloadFilename, getPhotoDownloadUrl } from '~/utils/photoDownload'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const props = withDefaults(
  defineProps<{
    photo: Photo
    variant?: PhotoPreviewVariant
    loading?: boolean
    progress?: number
  }>(),
  {
    variant: 'origin',
    loading: false,
    progress: 0,
  },
)

const mediaLabel = computed(() => (props.photo.mediaType === 'video' ? 'video' : 'image'))
const downloadVariant = computed<PhotoPreviewVariant>(() =>
  props.photo.mediaType === 'image' ? props.variant : 'origin',
)
const isLoading = computed(() => props.loading && downloadVariant.value === 'compressed')
const variantLabel = computed(() => {
  if (downloadVariant.value === 'origin') return 'original'
  if (downloadVariant.value === 'blurhash') return 'BlurHash'
  return downloadVariant.value
})
const label = computed(() =>
  isLoading.value
    ? `Loading compressed ${mediaLabel.value}`
    : downloadVariant.value === 'blurhash'
      ? 'Download BlurHash'
      : `Download ${variantLabel.value} ${mediaLabel.value}`,
)
const href = computed(() =>
  isLoading.value
    ? undefined
    : getPhotoDownloadUrl(props.photo.id, downloadVariant.value, props.photo.blurhash),
)
const filename = computed(() =>
  getPhotoDownloadFilename(props.photo.filename, downloadVariant.value),
)
</script>

<template>
  <PhotoDetailControlButton
    :label="label"
    icon="i-hugeicons:download-04"
    :href="href"
    :download="filename"
    :loading="isLoading"
    :progress="props.progress"
  />
</template>
