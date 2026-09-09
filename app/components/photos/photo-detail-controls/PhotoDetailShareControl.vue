<script setup lang="ts">
import { play } from 'cuelume'
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const { detailPhoto } = usePhotoDetailContext()
const { copy, copied } = useClipboard({ legacy: true })
const mediaLabel = computed(() => (detailPhoto.value?.mediaType === 'video' ? 'video' : 'photo'))
const label = computed(() => `Copy link to this ${mediaLabel.value}`)
const icon = computed(() =>
  copied.value ? 'i-hugeicons:checkmark-circle-02' : 'i-hugeicons:share-08',
)

async function sharePhoto() {
  if (!detailPhoto.value) return

  const path = `/photos?photo=${encodeURIComponent(detailPhoto.value.id)}`
  try {
    await copy(new URL(path, window.location.origin).href)
    play('success', { volume: 0.85 })
  } catch {
    play('error', { volume: 0.85 })
  }
}
</script>

<template>
  <PhotoDetailControlButton
    :label="label"
    :title="copied ? 'Link copied' : label"
    :icon="icon"
    :tone="copied ? 'success' : 'default'"
    live="polite"
    @click="sharePhoto"
  />
</template>
