<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import PhotoDetailControls from './photo-detail-controls/PhotoDetailControls.vue'

const { detailPhoto } = usePhotoDetailContext()
const photo = computed(() => detailPhoto.value!)

const video = useTemplateRef<HTMLVideoElement>('video')
const ready = shallowRef(false)
const loadFailed = shallowRef(false)

function attemptAutoplay() {
  const player = video.value

  if (!player || !player.paused) return

  void player.play().catch(() => {
    player.muted = true
    void player.play().catch(() => {})
  })
}

onMounted(async () => {
  try {
    await Promise.all([
      import('media-chrome/media-controller'),
      import('media-chrome/media-control-bar'),
      import('media-chrome/media-play-button'),
      import('media-chrome/media-mute-button'),
      import('media-chrome/media-volume-range'),
      import('media-chrome/media-time-range'),
      import('media-chrome/media-time-display'),
      import('media-chrome/media-playback-rate-button'),
      import('media-chrome/media-fullscreen-button'),
      import('media-chrome/media-loading-indicator'),
    ])
    ready.value = true
  } catch {
    loadFailed.value = true
  }
})

watch(ready, async (isReady) => {
  if (!isReady) return

  await nextTick()
  attemptAutoplay()
})
</script>

<template>
  <media-controller v-if="ready" class="photo-video-player" autohide="2">
    <video
      slot="media"
      ref="video"
      class="photo-video-player__video"
      :src="photo.origin"
      :poster="photo.compressed"
      :aria-label="photo.filename"
      preload="metadata"
      autoplay
      playsinline
      @canplay="attemptAutoplay"
    />
    <media-loading-indicator slot="centered-chrome" />
    <media-control-bar class="photo-video-player__control-bar">
      <media-play-button
        class="photo-video-player__button photo-video-player__button--play"
        notooltip
      >
        <i slot="play" class="photo-video-player__icon i-hugeicons:play" aria-hidden="true" />
        <i slot="pause" class="photo-video-player__icon i-hugeicons:pause" aria-hidden="true" />
      </media-play-button>
      <media-mute-button
        class="photo-video-player__button photo-video-player__button--mute"
        notooltip
      >
        <i slot="off" class="photo-video-player__icon i-hugeicons:volume-off" aria-hidden="true" />
        <i slot="low" class="photo-video-player__icon i-hugeicons:volume-low" aria-hidden="true" />
        <i
          slot="medium"
          class="photo-video-player__icon i-hugeicons:volume-high"
          aria-hidden="true"
        />
        <i
          slot="high"
          class="photo-video-player__icon i-hugeicons:volume-high"
          aria-hidden="true"
        />
      </media-mute-button>
      <media-volume-range class="photo-video-player__volume" />
      <media-time-display class="photo-video-player__time" showduration notoggle />
      <media-time-range class="photo-video-player__seek" />
      <media-playback-rate-button
        class="photo-video-player__button photo-video-player__speed"
        notooltip
      />
      <media-fullscreen-button
        class="photo-video-player__button photo-video-player__fullscreen"
        notooltip
      >
        <i
          slot="enter"
          class="photo-video-player__icon i-hugeicons:fullscreen"
          aria-hidden="true"
        />
        <i slot="exit" class="photo-video-player__icon i-hugeicons:shrink" aria-hidden="true" />
      </media-fullscreen-button>
      <PhotoDetailControls variant="media" />
    </media-control-bar>
  </media-controller>
  <video
    v-else-if="loadFailed"
    ref="video"
    class="photo-video-player photo-video-player__video"
    :src="photo.origin"
    :poster="photo.compressed"
    :aria-label="photo.filename"
    preload="metadata"
    autoplay
    playsinline
    controls
    @canplay="attemptAutoplay"
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
  --media-primary-color: #f4f4f0;
  --media-text-color: #f4f4f0;
  --media-icon-color: #f4f4f0;
  --media-control-height: 1.15rem;
  --media-control-padding: 0.45rem;
  --media-button-padding: 0.5rem;
  --media-control-background: transparent;
  --media-control-hover-background: transparent;
  --media-range-track-background: rgb(255 255 255 / 24%);
  --media-range-bar-color: #f4f4f0;
  --media-range-track-height: 0.25rem;
  --media-range-track-border-radius: 999px;
  --media-range-thumb-width: 0.7rem;
  --media-range-thumb-height: 0.7rem;
  --media-range-thumb-background: #f4f4f0;
  --media-range-thumb-border: 2px solid rgb(8 8 8 / 30%);
  --media-range-thumb-border-radius: 999px;
  --media-range-thumb-box-shadow: 0 1px 5px rgb(0 0 0 / 30%);
  --media-range-thumb-opacity: 0;
  --media-range-thumb-transition: opacity 180ms ease, transform 180ms ease;
  --media-focus-box-shadow: 0 0 0 2px rgb(255 255 255 / 85%);
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

.photo-video-player__control-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  box-sizing: border-box;
  padding: 2.5rem 0.75rem 0.75rem;
  background: linear-gradient(180deg, transparent 0%, rgb(8 8 8 / 45%) 38%, rgb(8 8 8 / 92%) 100%);
}

.photo-video-player__button {
  flex: 0 0 auto;
  border-radius: 0.65rem;
  --media-button-padding: 0.5rem;
  --media-control-padding: 0.5rem;
}

.photo-video-player__button--play {
  color: #f4f4f0;
  --media-primary-color: #f4f4f0;
  --media-text-color: #f4f4f0;
  --media-icon-color: #f4f4f0;
  --media-control-background: transparent;
  --media-control-hover-background: transparent;
}

.photo-video-player__icon {
  display: block;
  width: 1.05rem;
  height: 1.05rem;
  color: currentColor;
}

.photo-video-player__volume {
  flex: 0 0 5.25rem;
  width: 5.25rem;
  border-radius: 0.65rem;
  --media-range-padding-left: 0.15rem;
  --media-range-padding-right: 0.45rem;
  --media-range-thumb-opacity: 0;
}

.photo-video-player__volume:focus-within,
.photo-video-player__seek:focus-within {
  --media-range-thumb-opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .photo-video-player__volume:hover,
  .photo-video-player__seek:hover {
    --media-range-thumb-opacity: 1;
  }
}

.photo-video-player__time {
  flex: 0 0 auto;
  padding: 0 0.15rem 0 0.35rem;
  color: rgb(244 244 240 / 78%);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.015em;
  white-space: nowrap;
}

.photo-video-player__seek {
  min-width: 5rem;
  flex: 1 1 auto;
  border-radius: 0.65rem;
}

.photo-video-player__speed {
  /* min-width: 2.7rem; */
  color: rgb(244 244 240 / 84%);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.photo-video-player__fullscreen {
  margin-left: 0.05rem;
}

@media (max-width: 767.9px) {
  .photo-video-player {
    width: 100%;
    height: 100%;
  }

  .photo-video-player__volume,
  .photo-video-player__button--mute,
  .photo-video-player__speed {
    display: none;
  }

  .photo-video-player__control-bar {
    gap: 0.35rem;
    padding: 2.25rem 0.55rem 0.55rem;
  }

  .photo-video-player__time {
    padding-left: 0.15rem;
    font-size: 0.65rem;
  }
}
</style>
