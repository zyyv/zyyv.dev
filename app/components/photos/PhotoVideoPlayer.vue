<script setup lang="ts">
import type { Photo } from '~/types'

defineProps<{ photo: Photo }>()

const ready = shallowRef(false)
const loadFailed = shallowRef(false)

onMounted(async () => {
  try {
    await Promise.all([
      import('media-chrome/media-controller'),
      import('media-chrome/media-control-bar'),
      import('media-chrome/media-play-button'),
      // import('media-chrome/media-mute-button'),
      import('media-chrome/media-volume-range'),
      import('media-chrome/media-time-range'),
      // import('media-chrome/media-time-display'),
      import('media-chrome/media-playback-rate-button'),
      // import('media-chrome/media-pip-button'),
      // import('media-chrome/media-fullscreen-button'),
      import('media-chrome/media-loading-indicator'),
    ])
    ready.value = true
  } catch {
    loadFailed.value = true
  }
})
</script>

<template>
  <media-controller v-if="ready" class="photo-video-player" autohide="2">
    <video
      slot="media"
      class="photo-video-player__video"
      :src="photo.origin"
      :poster="photo.compressed"
      :aria-label="photo.filename"
      preload="metadata"
      playsinline
    />
    <media-loading-indicator slot="centered-chrome" noautohide />
    <media-control-bar>
      <media-play-button>
        <div name="icon">11</div>
      </media-play-button>
      <!-- <media-mute-button /> -->
      <media-volume-range />
      <!-- <media-time-display showduration /> -->
      <media-time-range />
      <media-playback-rate-button />
      <!-- <media-pip-button /> -->
      <!-- <media-fullscreen-button /> -->
    </media-control-bar>
  </media-controller>
  <video
    v-else-if="loadFailed"
    class="photo-video-player photo-video-player__video"
    :src="photo.origin"
    :poster="photo.compressed"
    :aria-label="photo.filename"
    preload="metadata"
    playsinline
    controls
  />
  <div v-else class="photo-video-player photo-video-player--loading">
    <img :src="photo.compressed" alt="" />
    <i class="i-hugeicons:loading-03" aria-hidden="true" />
  </div>
</template>

<style scoped>
.photo-video-player {
  width: min(calc(100% - 7rem), 80rem);
  height: min(calc(100% - 4rem), 50rem);
  overflow: hidden;
  background: #080808;
  color: #f4f4f0;
  pointer-events: auto;
  --media-control-background: rgb(12 12 11 / 72%);
  --media-control-hover-background: rgb(255 255 255 / 16%);
  --media-range-track-background: rgb(255 255 255 / 28%);
  --media-range-bar-color: #f4f4f0;
}

.photo-video-player__video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.photo-video-player--loading {
  position: relative;
  display: grid;
  place-items: center;
}

.photo-video-player--loading img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.72;
}

.photo-video-player--loading i {
  z-index: 1;
  font-size: 1.5rem;
  animation: photo-video-spin 900ms linear infinite;
}

@keyframes photo-video-spin {
  to {
    transform: rotate(1turn);
  }
}

media-control-bar {
  width: 100%;
  background: linear-gradient(transparent, rgb(0 0 0 / 78%));
}

media-time-range {
  min-width: 5rem;
}

@media (max-width: 767.9px) {
  .photo-video-player {
    width: 100%;
    height: 100%;
  }

  media-volume-range,
  media-playback-rate-button,
  media-pip-button {
    display: none;
  }
}
</style>
