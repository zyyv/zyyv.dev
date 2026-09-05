<script setup lang="ts">
import type { Photo } from '~/types'

const props = defineProps<{ photo: Photo }>()
const video = useTemplateRef<HTMLVideoElement>('video')
const isVideo = computed(() => props.photo.mediaType === 'video')
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${pad(minutes)}:${pad(remainingSeconds)}`
}
const duration = ref(formatDuration(0))

async function playPreview() {
  if (!isVideo.value || !video.value) return
  video.value.muted = true
  try {
    await video.value.play()
  } catch {
    // Browsers may decline autoplay while the page is backgrounded.
  }
}

function stopPreview() {
  if (!video.value) return
  video.value.pause()
  video.value.currentTime = 0
}

onBeforeUnmount(stopPreview)

function handleVideoLoadedMetadata(event: Event) {
  const target = event.target as HTMLVideoElement
  duration.value = formatDuration(target.duration)
}
</script>

<template>
  <span class="photo-card-media" @pointerenter="playPreview" @pointerleave="stopPreview">
    <video
      v-if="isVideo"
      ref="video"
      class="photo-card-media__visual"
      :src="photo.origin"
      :poster="photo.thumbnail"
      :aria-label="photo.filename"
      muted
      loop
      playsinline
      preload="none"
      @loadedmetadata="handleVideoLoadedMetadata"
    />
    <ImgBlurHash
      v-else
      :src="photo.thumbnail"
      :blurhash="photo.blurhash"
      :aspect-ratio="photo.width / photo.height"
      class="photo-card-media__visual"
    />
  </span>
  <span v-if="isVideo" class="photo-card-media__badge" aria-hidden="true">
    <i class="i-hugeicons:video-ai" />
    {{ duration }}
  </span>
</template>

<style scoped>
.photo-card-media {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  aspect-ratio: var(--media-aspect-ratio);
  background: #11110f;
}

.photo-card-media__visual {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.002);
  transition:
    transform 480ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 320ms ease;
}

.photo-card-media__badge {
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

.photo-card-media__badge i {
  width: 0.7rem;
  height: 0.7rem;
}

@media (hover: hover) and (pointer: fine) {
  :global(.photo-card:hover) .photo-card-media__visual {
    filter: brightness(0.88) saturate(0.96);
    transform: scale(1.025);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-card-media__visual {
    transition: none;
  }
}
</style>
