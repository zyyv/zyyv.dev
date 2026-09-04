<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { Photo, PhotoReactionType } from '~/types'
import { isImagePreloaded, preloadImage } from '~/utils/preloadImage'
import PhotoReactions from './PhotoReactions.vue'
import PhotoVideoPlayer from './PhotoVideoPlayer.vue'

type SwitchDirection = 'prev' | 'next' | 'direct'

const COMPRESSED_IMAGE_MAX_WIDTH = 2560

interface Props {
  photo: Photo
  photos: Photo[]
  reactionError: string | null
  reactionSaving: boolean
}

interface Emits {
  displayedChange: [photo: Photo]
  react: [reaction: PhotoReactionType]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const preferredMotion = usePreferredReducedMotion()
const { copy, copied } = useClipboard({ legacy: true })
const displayedPhoto = shallowRef<Photo | null>(null)
const displayedImageSrc = shallowRef('')
const compressedImageSrc = shallowRef('')
const isFullImageLoaded = shallowRef(false)
const previousPhoto = shallowRef<Photo | null>(null)
const previousImageSrc = shallowRef('')
const previousImageStyle = shallowRef<CSSProperties>()
const direction = shallowRef<SwitchDirection>('direct')
const isAnimating = shallowRef(false)
const showLoading = shallowRef(false)
const loadProgress = shallowRef(0)
const loadFailed = shallowRef(false)
const useCheckerboard = shallowRef(false)
const showReactions = shallowRef(false)
const reactionControl = useTemplateRef<HTMLElement>('reactionControl')
const {
  canvasRef,
  imageStyle,
  isDragging,
  zoomLabel,
  zoomIn,
  zoomOut,
  resetCanvas,
  handleWheel,
  handlePointerDown,
  handlePointerMove,
  handlePointerEnd,
} = useImageCanvas()
const { width: canvasWidth, height: canvasHeight } = useElementSize(canvasRef)
const { width: viewportWidth, height: viewportHeight } = useWindowSize()

let requestId = 0
let transitionTimer: ReturnType<typeof setTimeout> | undefined

const canvasClasses = computed(() => ({
  'has-previous': Boolean(previousPhoto.value),
  'is-animating': isAnimating.value,
  'is-checkerboard': useCheckerboard.value,
  'is-dragging': isDragging.value,
  'is-video': displayedPhoto.value?.mediaType === 'video',
  [`is-${direction.value}`]: true,
}))
const isDisplayedVideo = computed(() => displayedPhoto.value?.mediaType === 'video')
const progressStyle = computed<CSSProperties>(() => ({
  strokeDashoffset: `${50.27 * (1 - loadProgress.value / 100)}`,
}))
const currentImageStyle = computed<CSSProperties>(() => {
  const photo = displayedPhoto.value
  return photo ? getCompressedImageStyle(photo, imageStyle.value) : imageStyle.value
})
onClickOutside(reactionControl, () => {
  showReactions.value = false
})

onKeyStroke('Escape', () => {
  showReactions.value = false
})

watch(
  () => props.photo,
  (photo) => {
    showReactions.value = false
    void displayPhoto(photo)
  },
  { immediate: true },
)

function getPhotoIndex(photo: Photo | null): number {
  if (!photo) return -1
  return props.photos.findIndex((item) => item.id === photo.id)
}

function getDirection(from: Photo | null, to: Photo): SwitchDirection {
  const fromIndex = getPhotoIndex(from)
  const toIndex = getPhotoIndex(to)
  if (fromIndex < 0 || toIndex < 0 || Math.abs(toIndex - fromIndex) !== 1) return 'direct'
  return toIndex > fromIndex ? 'next' : 'prev'
}

function preloadNeighbors(photo: Photo) {
  const index = getPhotoIndex(photo)
  if (index < 0) return

  const neighbors = [props.photos[index - 1], props.photos[index + 1]].filter((p) => !!p)

  Promise.all(
    neighbors.map((neighbor) =>
      preloadImage(neighbor.compressed, {
        expectedBytes: neighbor.compressedSize,
      }),
    ),
  )
}

function getCompressedImageStyle(photo: Photo, transformStyle: CSSProperties): CSSProperties {
  const compressedScale = Math.min(1, COMPRESSED_IMAGE_MAX_WIDTH / photo.width)
  const compressedWidth = Math.max(1, Math.round(photo.width * compressedScale))
  const compressedHeight = Math.max(1, Math.round(photo.height * compressedScale))

  if (canvasWidth.value <= 0 || canvasHeight.value <= 0) return transformStyle

  const isMobile = viewportWidth.value < 768
  const horizontalPadding = isMobile ? 64 : Math.min(160, Math.max(80, viewportWidth.value * 0.12))
  const verticalPadding = isMobile ? 72 : Math.min(128, Math.max(88, viewportHeight.value * 0.15))
  const availableWidth = Math.max(1, canvasWidth.value - horizontalPadding)
  const availableHeight = Math.max(1, canvasHeight.value - verticalPadding)
  const containScale = Math.min(
    1,
    availableWidth / compressedWidth,
    availableHeight / compressedHeight,
  )

  return {
    width: `${Math.max(1, Math.round(compressedWidth * containScale))}px`,
    height: `${Math.max(1, Math.round(compressedHeight * containScale))}px`,
    ...transformStyle,
  }
}

function shareDisplayedPhoto() {
  if (!displayedPhoto.value) return
  const path = `/photos?photo=${encodeURIComponent(displayedPhoto.value.id)}`
  void copy(new URL(path, window.location.origin).href)
}

function stopLoadingIndicator() {
  showLoading.value = false
}

function scheduleTransitionCleanup(photoId: string) {
  if (transitionTimer) clearTimeout(transitionTimer)

  const duration = preferredMotion.value === 'reduce' ? 1 : 520
  transitionTimer = setTimeout(() => {
    if (displayedPhoto.value?.id !== photoId) return
    previousPhoto.value = null
    previousImageSrc.value = ''
    previousImageStyle.value = undefined
    isAnimating.value = false
  }, duration)
}

async function displayPhoto(photo: Photo) {
  const currentRequest = ++requestId
  const outgoingPhoto = displayedPhoto.value
  if (outgoingPhoto?.id === photo.id) return
  const compressedSrc = photo.compressed
  const hasCachedCompressedImage = isImagePreloaded(compressedSrc)

  if (previousPhoto.value) {
    previousPhoto.value = null
    previousImageSrc.value = ''
    previousImageStyle.value = undefined
    isAnimating.value = false
  }

  if (transitionTimer) clearTimeout(transitionTimer)

  direction.value = getDirection(outgoingPhoto, photo)
  previousPhoto.value = outgoingPhoto
  previousImageSrc.value =
    (isFullImageLoaded.value ? compressedImageSrc.value : displayedImageSrc.value) ||
    outgoingPhoto?.thumbnail ||
    ''
  previousImageStyle.value = outgoingPhoto ? { ...currentImageStyle.value } : undefined
  isAnimating.value = false
  displayedPhoto.value = photo
  displayedImageSrc.value = photo.thumbnail
  compressedImageSrc.value = hasCachedCompressedImage ? compressedSrc : ''
  isFullImageLoaded.value = hasCachedCompressedImage
  loadProgress.value = hasCachedCompressedImage ? 100 : 0
  loadFailed.value = false
  showLoading.value = !hasCachedCompressedImage
  resetCanvas()
  emit('displayedChange', photo)

  const loadingPromise = hasCachedCompressedImage
    ? null
    : preloadImage(compressedSrc, {
        expectedBytes: photo.compressedSize,
        onProgress(progress) {
          if (currentRequest === requestId) loadProgress.value = progress.percentage
        },
      })
  preloadNeighbors(photo)

  await nextTick()
  if (currentRequest !== requestId) return

  if (!outgoingPhoto || preferredMotion.value === 'reduce') {
    previousPhoto.value = null
    previousImageSrc.value = ''
    previousImageStyle.value = undefined
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (currentRequest !== requestId) return
        isAnimating.value = true
        scheduleTransitionCleanup(photo.id)
      })
    })
  }

  if (!loadingPromise) return

  const loaded = await loadingPromise
  if (currentRequest !== requestId) return

  stopLoadingIndicator()
  if (!loaded) {
    loadFailed.value = true
    return
  }

  loadProgress.value = 100
  compressedImageSrc.value = compressedSrc

  await nextTick()
  if (currentRequest !== requestId) return

  if (preferredMotion.value === 'reduce') {
    isFullImageLoaded.value = true
    return
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (currentRequest === requestId) isFullImageLoaded.value = true
    })
  })
}

onBeforeUnmount(() => {
  requestId += 1
  if (transitionTimer) clearTimeout(transitionTimer)
})
</script>

<template>
  <figure
    ref="imageCanvas"
    class="photo-detail-canvas"
    :class="canvasClasses"
    @wheel="isDisplayedVideo ? undefined : handleWheel($event)"
    @pointerdown="isDisplayedVideo ? undefined : handlePointerDown($event)"
    @pointermove="isDisplayedVideo ? undefined : handlePointerMove($event)"
    @pointerup="isDisplayedVideo ? undefined : handlePointerEnd($event)"
    @pointercancel="isDisplayedVideo ? undefined : handlePointerEnd($event)"
  >
    <template v-if="!useCheckerboard">
      <div
        v-if="previousPhoto"
        class="photo-detail-canvas__background photo-detail-canvas__background--previous"
      >
        <img
          :src="previousPhoto.thumbnail"
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable="false"
        />
      </div>

      <div
        v-if="displayedPhoto"
        class="photo-detail-canvas__background photo-detail-canvas__background--current"
      >
        <img
          class="photo-detail-canvas__background-image"
          :src="displayedImageSrc"
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable="false"
        />
      </div>
    </template>

    <div
      v-if="previousPhoto"
      class="photo-detail-canvas__media photo-detail-canvas__media--previous"
    >
      <img
        class="photo-detail-canvas__image"
        :src="previousImageSrc"
        :alt="previousPhoto.filename"
        decoding="async"
        draggable="false"
        :style="previousImageStyle"
      />
    </div>

    <div
      v-if="displayedPhoto"
      class="photo-detail-canvas__media photo-detail-canvas__media--current"
    >
      <PhotoVideoPlayer
        v-if="isDisplayedVideo"
        :key="displayedPhoto.id"
        :photo="displayedPhoto"
        @pointerdown.stop
        @pointermove.stop
        @pointerup.stop
        @pointercancel.stop
        @wheel.stop
      />
      <img
        v-else
        :key="displayedPhoto.id"
        ref="canvasImage"
        class="photo-detail-canvas__image photo-detail-canvas__image--current photo-detail-canvas__image--thumbnail"
        :class="{
          'is-hidden': isFullImageLoaded,
          'is-transition-source': !isFullImageLoaded,
        }"
        :src="displayedImageSrc"
        :alt="displayedPhoto.filename"
        decoding="async"
        draggable="false"
        :style="currentImageStyle"
      />
      <img
        v-if="compressedImageSrc && !isDisplayedVideo"
        class="photo-detail-canvas__image photo-detail-canvas__image--current photo-detail-canvas__image--compressed"
        :class="{
          'is-visible': isFullImageLoaded,
          'is-transition-source': isFullImageLoaded,
        }"
        :src="compressedImageSrc"
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable="false"
        :style="currentImageStyle"
      />
    </div>

    <figcaption>
      <span>{{
        isDisplayedVideo ? 'Use the player controls to play video' : 'Scroll to zoom · Drag to move'
      }}</span>
      <span v-if="loadFailed" class="photo-detail-canvas__load-error" role="status">
        Compressed image unavailable · showing thumbnail
      </span>
    </figcaption>

    <div ref="reactionControl" class="photo-detail-canvas__control-stack" @pointerdown.stop>
      <Transition name="reaction-popover">
        <PhotoReactions
          v-show="showReactions"
          class="photo-detail-canvas__reactions"
          :busy="reactionSaving"
          :disabled="!displayedPhoto"
          :error="reactionError"
          @react="emit('react', $event)"
        />
      </Transition>

      <div class="photo-detail-canvas__controls" aria-label="Media controls">
        <button
          type="button"
          :aria-label="`React to this ${isDisplayedVideo ? 'video' : 'photo'}`"
          aria-haspopup="dialog"
          :aria-expanded="showReactions"
          title="React to this photo"
          @click.stop="showReactions = !showReactions"
        >
          <i class="i-hugeicons:smile" aria-hidden="true" />
        </button>
        <button
          v-if="!isDisplayedVideo"
          type="button"
          :aria-label="
            useCheckerboard
              ? 'Use blurred image background'
              : 'Use transparency checkerboard background'
          "
          :aria-pressed="useCheckerboard"
          :title="
            useCheckerboard
              ? 'Use blurred image background'
              : 'Use transparency checkerboard background'
          "
          @click.stop="useCheckerboard = !useCheckerboard"
        >
          <i
            :class="useCheckerboard ? 'i-hugeicons:blur' : 'i-hugeicons:grid-table'"
            aria-hidden="true"
          />
        </button>
        <button
          v-if="!isDisplayedVideo"
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          @click.stop="zoomOut"
        >
          <i class="i-hugeicons:zoom-out-area" aria-hidden="true" />
        </button>
        <button
          v-if="!isDisplayedVideo"
          type="button"
          class="photo-detail-canvas__zoom-value"
          aria-label="Reset image view"
          title="Reset image view"
          @click.stop="resetCanvas"
        >
          {{ zoomLabel }}
        </button>
        <button
          v-if="!isDisplayedVideo"
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          @click.stop="zoomIn"
        >
          <i class="i-hugeicons:zoom-in-area" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Copy link to this photo"
          :aria-live="copied ? 'polite' : undefined"
          :title="copied ? 'Link copied' : 'Copy link to this photo'"
          @click.stop="shareDisplayedPhoto"
        >
          <i
            :class="copied ? 'i-hugeicons:checkmark-circle-02 text-green' : 'i-hugeicons:share-08'"
            aria-hidden="true"
          />
        </button>
        <button
          v-if="displayedPhoto && showLoading && !isDisplayedVideo"
          type="button"
          class="photo-detail-canvas__download-progress"
          :aria-label="`Loading compressed image, ${loadProgress}%`"
          title="Loading compressed image"
          disabled
        >
          <svg
            viewBox="0 0 20 20"
            role="progressbar"
            aria-label="Loading compressed image"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="loadProgress"
          >
            <circle class="photo-detail-canvas__progress-track" cx="10" cy="10" r="8" />
            <circle
              class="photo-detail-canvas__progress-value"
              cx="10"
              cy="10"
              r="8"
              :style="progressStyle"
            />
          </svg>
        </button>
        <a
          v-else-if="displayedPhoto"
          :href="`/api/photos/${displayedPhoto.id}/download`"
          :download="displayedPhoto.filename"
          :aria-label="`Download original ${isDisplayedVideo ? 'video' : 'image'}`"
          :title="`Download original ${isDisplayedVideo ? 'video' : 'image'}`"
          @pointerdown.stop
          @click.stop
        >
          <i class="i-hugeicons:download-04" aria-hidden="true" />
        </a>
      </div>
    </div>
  </figure>
</template>

<style scoped>
.photo-detail-canvas {
  --enter-x: 0;
  --exit-x: 0;

  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  box-sizing: border-box;
  background-color: var(--dialog-canvas);
  cursor: grab;
  place-items: center;
  touch-action: none;
}

.photo-detail-canvas.is-next {
  --enter-x: 1rem;
  --exit-x: -0.5rem;
}

.photo-detail-canvas.is-prev {
  --enter-x: -1rem;
  --exit-x: 0.5rem;
}

.photo-detail-canvas.is-checkerboard {
  background-image:
    linear-gradient(45deg, var(--dialog-checker) 25%, transparent 25%),
    linear-gradient(-45deg, var(--dialog-checker) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--dialog-checker) 75%),
    linear-gradient(-45deg, transparent 75%, var(--dialog-checker) 75%);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
}

.photo-detail-canvas.is-dragging {
  cursor: grabbing;
}

.photo-detail-canvas.is-video {
  cursor: default;
  touch-action: auto;
}

.photo-detail-canvas__background,
.photo-detail-canvas__media {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: opacity, transform;
}

.photo-detail-canvas__background {
  z-index: 0;
  transition:
    opacity 480ms ease,
    transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-detail-canvas__background--current {
  opacity: 1;
  transform: scale(1.06);
}

.photo-detail-canvas__background--previous {
  opacity: 1;
  transform: scale(1.06);
}

.photo-detail-canvas.has-previous .photo-detail-canvas__background--current {
  opacity: 0;
  transform: scale(1.1);
}

.photo-detail-canvas.is-animating .photo-detail-canvas__background--current {
  opacity: 1;
  transform: scale(1.06);
}

.photo-detail-canvas.is-animating .photo-detail-canvas__background--previous {
  opacity: 0;
  transform: scale(1.03);
}

.photo-detail-canvas__background img {
  position: absolute;
  inset: -3rem;
  display: block;
  width: calc(100% + 6rem);
  height: calc(100% + 6rem);
  object-fit: cover;
  opacity: 0.72;
  filter: blur(2rem) saturate(0.72);
  user-select: none;
  will-change: opacity;
}

.photo-detail-canvas__media {
  z-index: 1;
  display: grid;
  opacity: 1;
  place-items: center;
  transform: translate3d(0, 0, 0) scale(1);
  transition:
    opacity 240ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-detail-canvas__media--current {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.photo-detail-canvas.has-previous .photo-detail-canvas__media--current {
  opacity: 0;
  transform: translate3d(var(--enter-x), 0, 0) scale(0.985);
}

.photo-detail-canvas.is-animating .photo-detail-canvas__media--current {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.photo-detail-canvas.is-animating .photo-detail-canvas__media--previous {
  opacity: 0;
  transform: translate3d(var(--exit-x), 0, 0) scale(0.992);
}

.photo-detail-canvas__image {
  position: absolute;
  inset: 0;
  display: block;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
  object-fit: contain;
  pointer-events: none;
  transform-origin: center;
  user-select: none;
  will-change: transform;
}

.photo-detail-canvas__image--thumbnail,
.photo-detail-canvas__image--compressed {
  transition: opacity 520ms ease;
  will-change: opacity, transform;
}

.photo-detail-canvas__image--thumbnail.is-hidden {
  opacity: 0;
}

.photo-detail-canvas__image--compressed {
  z-index: 1;
  opacity: 0;
}

.photo-detail-canvas__image--compressed.is-visible {
  opacity: 1;
}

.photo-detail-canvas__image--current.is-transition-source {
  view-transition-name: photo-detail-image;
}

.photo-detail-canvas figcaption {
  position: absolute;
  z-index: 3;
  top: 1rem;
  left: 1.1rem;
  display: flex;
  align-items: center;
  margin: 0;
  gap: 0.65rem;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  pointer-events: none;
  text-transform: uppercase;
  user-select: none;
}

.photo-detail-canvas__load-error {
  color: color-mix(in srgb, #d64545 78%, var(--dialog-text));
}

.photo-detail-canvas__control-stack {
  position: absolute;
  z-index: 3;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.photo-detail-canvas__reactions {
  position: absolute;
  bottom: calc(100% + 0.55rem);
  left: 50%;
  transform: translateX(-50%);
}

.photo-detail-canvas__controls {
  display: flex;
  min-height: 2rem;
  overflow: hidden;
  border: 1px dashed var(--dialog-line);
  background: var(--dialog-control);
  backdrop-filter: blur(0.75rem);
}

.photo-detail-canvas__controls button,
.photo-detail-canvas__controls a {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dialog-text);
  font: inherit;
  cursor: pointer;
  place-items: center;
  text-decoration: none;
}

.photo-detail-canvas__controls > button:not(:first-child),
.photo-detail-canvas__controls > a:not(:first-child) {
  border-left: 1px dashed var(--dialog-line);
}

.photo-detail-canvas__controls i {
  font-size: 0.82rem;
}

.photo-detail-canvas__download-progress:disabled {
  cursor: wait;
  opacity: 1;
}

.photo-detail-canvas__download-progress svg {
  width: 1.05rem;
  height: 1.05rem;
  overflow: visible;
  transform: rotate(-90deg);
}

.photo-detail-canvas__download-progress circle {
  fill: none;
  stroke-width: 1.5;
}

.photo-detail-canvas__progress-track {
  stroke: color-mix(in srgb, var(--dialog-text) 18%, transparent);
}

.photo-detail-canvas__progress-value {
  stroke: var(--dialog-text);
  stroke-dasharray: 50.27;
  stroke-dashoffset: 50.27;
  stroke-linecap: round;
  transition: stroke-dashoffset 140ms linear;
}

.photo-detail-canvas__controls .photo-detail-canvas__zoom-value {
  width: 3.6rem;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  user-select: none;
}

.reaction-popover-enter-active,
.reaction-popover-leave-active {
  transition:
    opacity 160ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.reaction-popover-enter-from,
.reaction-popover-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.45rem) scale(0.98);
}

@media (hover: hover) and (pointer: fine) {
  .photo-detail-canvas__controls button:hover,
  .photo-detail-canvas__controls a:hover {
    background: var(--dialog-checker);
  }
}

.photo-detail-canvas__controls button:focus-visible,
.photo-detail-canvas__controls a:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.35rem;
}

@media (max-width: 767.9px) {
  .photo-detail-canvas {
    min-height: 0;
  }

  .photo-detail-canvas figcaption {
    top: 0.75rem;
    left: 0.8rem;
    font-size: 0.5rem;
  }

  .photo-detail-canvas__controls {
    bottom: auto;
  }

  .photo-detail-canvas__control-stack {
    bottom: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-detail-canvas__background,
  .photo-detail-canvas__background img,
  .photo-detail-canvas__media,
  .photo-detail-canvas__image--thumbnail,
  .photo-detail-canvas__image--compressed,
  .photo-detail-canvas__controls button {
    transition-duration: 1ms;
  }

  .reaction-popover-enter-active,
  .reaction-popover-leave-active {
    transition-duration: 1ms;
  }

  .photo-detail-canvas__progress-value {
    transition-duration: 1ms;
  }
}
</style>
