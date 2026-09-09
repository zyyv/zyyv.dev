<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import type { PhotoPreviewVariant } from '~/types'
import { getPhotoDownloadFilename, getPhotoDownloadUrl } from '~/utils/photoDownload'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const { detailPhoto, activePreviewVariant, downloadLoading, downloadProgress } =
  usePhotoDetailContext()
const photo = computed(() => detailPhoto.value)

const mediaLabel = computed(() => (photo.value?.mediaType === 'video' ? 'video' : 'image'))
const downloadVariant = computed<PhotoPreviewVariant>(() =>
  photo.value?.mediaType === 'image' ? activePreviewVariant.value : 'origin',
)
const isLoading = computed(() => downloadLoading.value && downloadVariant.value === 'compressed')
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
  !photo.value || isLoading.value
    ? undefined
    : getPhotoDownloadUrl(photo.value.id, downloadVariant.value, photo.value.blurhash),
)
const filename = computed(() =>
  getPhotoDownloadFilename(photo.value?.filename ?? 'photo', downloadVariant.value),
)
</script>

<template>
  <PhotoDetailControlButton
    :label="label"
    icon="i-hugeicons:download-04"
    :href="href"
    :download="filename"
    :loading="isLoading"
    :progress="downloadProgress"
  />
</template>
