<script setup lang="ts">
import type { Photo } from '~/types'

const props = defineProps<{
  photo: Photo
}>()
const video = useTemplateRef<HTMLVideoElement>('video')
const duration = shallowRef(formatDuration(0))

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(minutes)}:${pad(remainingSeconds)}`
}

async function playPreview() {
  const target = video.value
  if (!target) return

  target.muted = true
  try {
    await target.play()
  } catch {
    // Browsers may decline autoplay while the page is backgrounded.
  }
}

function stopPreview() {
  const target = video.value
  if (!target) return

  target.pause()
  target.currentTime = 0
}

function handleLoadedMetadata(event: Event) {
  duration.value = formatDuration((event.target as HTMLVideoElement).duration)
}

onBeforeUnmount(stopPreview)
</script>

<template>
  <span class="photo-card-video" @pointerenter="playPreview" @pointerleave="stopPreview">
    <video
      ref="video"
      class="photo-card-media__visual"
      :src="props.photo.origin"
      :poster="props.photo.thumbnail"
      :aria-label="props.photo.filename"
      muted
      loop
      playsinline
      preload="none"
      @loadedmetadata="handleLoadedMetadata"
    />
    <span class="photo-card-video__badge" aria-hidden="true">
      <i class="i-hugeicons:video-ai" />
      {{ duration }}
    </span>
  </span>
</template>

<style scoped>
.photo-card-video {
  position: absolute;
  inset: 0;
  display: block;
}

.photo-card-video__badge {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 4px 6px;
  border-radius: 999px;
  background: rgb(12 12 11 / 52%);
  color: white;
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  backdrop-filter: blur(0.75rem);
}

.photo-card-video__badge i {
  width: 0.7rem;
  height: 0.7rem;
}
</style>
