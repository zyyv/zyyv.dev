<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

const props = defineProps<{ photo: Photo }>()
const { copy, copied } = useClipboard({ legacy: true })
const mediaLabel = computed(() => (props.photo.mediaType === 'video' ? 'video' : 'photo'))
const label = computed(() => `Copy link to this ${mediaLabel.value}`)
const icon = computed(() =>
  copied.value ? 'i-hugeicons:checkmark-circle-02' : 'i-hugeicons:share-08',
)

function sharePhoto() {
  const path = `/photos?photo=${encodeURIComponent(props.photo.id)}`
  void copy(new URL(path, window.location.origin).href)
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
