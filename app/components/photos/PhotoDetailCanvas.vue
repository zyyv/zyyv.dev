<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { Photo, PhotoPreviewVariant, PhotoReactionType } from '~/types'
import { isImagePreloaded, preloadImage } from '~/utils/preloadImage'
import PhotoBlurhashPreview from './PhotoBlurhashPreview.vue'
const PhotoVideoPlayer = defineAsyncComponent(() => import('./PhotoVideoPlayer.vue'))

type SwitchDirection = 'prev' | 'next' | 'direct'
type SwipeDirection = 'prev' | 'next'

const COMPRESSED_IMAGE_MAX_WIDTH = 2560
const SWIPE_MIN_DISTANCE = 48
const SWIPE_AXIS_RATIO = 1.2

interface SwipeStart {
  pointerId: number
  x: number
  y: number
}

interface Props {
  photo: Photo
  photos: Photo[]
  reactionError: string | null
  reactionSaving: boolean
  previewVariant: PhotoPreviewVariant
}

interface Emits {
  displayedChange: [photo: Photo]
  loadingChange: [loading: boolean, progress: number]
  react: [reaction: PhotoReactionType]
  swipe: [direction: SwipeDirection]
  zoomChange: [label: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const preferredMotion = usePreferredReducedMotion()
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
const useCheckerboard = defineModel<boolean>('checkerboard', { default: false })
const {
  canvasRef,
  imageStyle,
  isDragging,
  isZoomed,
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
const isVariantPreviewVisible = computed(
  () => !isDisplayedVideo.value && props.previewVariant !== 'compressed',
)
const previewSrc = computed(() => {
  const photo = displayedPhoto.value
  if (!photo || props.previewVariant === 'blurhash') return ''
  if (props.previewVariant === 'thumbnail') return photo.thumbnail
  if (props.previewVariant === 'origin') return photo.origin
  return photo.compressed
})
const previewLabel = computed(() => {
  if (props.previewVariant === 'thumbnail') return 'Thumbnail preview'
  if (props.previewVariant === 'origin') return 'Original preview'
  if (props.previewVariant === 'blurhash') return 'BlurHash preview'
  return 'Compressed preview'
})
const currentImageStyle = computed<CSSProperties>(() => {
  const photo = displayedPhoto.value
  return photo ? getCompressedImageStyle(photo, imageStyle.value) : imageStyle.value
})
const previewImageStyle = computed<CSSProperties>(() => {
  const photo = displayedPhoto.value
  if (!photo) return imageStyle.value
  const maxWidth = props.previewVariant === 'thumbnail' ? 600 : Infinity
  return getImageStyle(photo, maxWidth, imageStyle.value)
})
const swipeStart = shallowRef<SwipeStart | null>(null)
const activeTouchPointers = new Set<number>()

watch(
  [showLoading, loadProgress],
  ([loading, progress]) => emit('loadingChange', loading, progress),
  { immediate: true },
)
watch(zoomLabel, (label) => emit('zoomChange', label), { immediate: true })

defineExpose({
  resetCanvas,
  zoomIn,
  zoomOut,
})

watch(
  () => props.photo,
  (photo) => {
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

function getImageStyle(
  photo: Photo,
  maxWidth: number,
  transformStyle: CSSProperties,
): CSSProperties {
  const scale = Math.min(1, maxWidth / photo.width)
  const imageWidth = Math.max(1, Math.round(photo.width * scale))
  const imageHeight = Math.max(1, Math.round(photo.height * scale))

  if (canvasWidth.value <= 0 || canvasHeight.value <= 0) return transformStyle

  const isMobile = viewportWidth.value < 768
  const horizontalPadding = isMobile ? 64 : Math.min(160, Math.max(80, viewportWidth.value * 0.12))
  const verticalPadding = isMobile ? 72 : Math.min(128, Math.max(88, viewportHeight.value * 0.15))
  const availableWidth = Math.max(1, canvasWidth.value - horizontalPadding)
  const availableHeight = Math.max(1, canvasHeight.value - verticalPadding)
  const containScale = Math.min(1, availableWidth / imageWidth, availableHeight / imageHeight)

  return {
    width: `${Math.max(1, Math.round(imageWidth * containScale))}px`,
    height: `${Math.max(1, Math.round(imageHeight * containScale))}px`,
    ...transformStyle,
  }
}

function getCompressedImageStyle(photo: Photo, transformStyle: CSSProperties): CSSProperties {
  return getImageStyle(photo, COMPRESSED_IMAGE_MAX_WIDTH, transformStyle)
}

function handleCanvasPointerDown(event: PointerEvent) {
  if (isDisplayedVideo.value) return

  if (event.pointerType === 'touch') {
    activeTouchPointers.add(event.pointerId)
    swipeStart.value =
      activeTouchPointers.size === 1 && !isZoomed.value
        ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
        : null
  }

  handlePointerDown(event)
}

function handleCanvasPointerEnd(event: PointerEvent) {
  const start = swipeStart.value
  swipeStart.value = null
  if (event.pointerType === 'touch') activeTouchPointers.delete(event.pointerId)
  handlePointerEnd(event)

  if (!start || start.pointerId !== event.pointerId || isZoomed.value) return

  const deltaX = event.clientX - start.x
  const deltaY = event.clientY - start.y
  const isHorizontalSwipe =
    Math.abs(deltaX) >= SWIPE_MIN_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_AXIS_RATIO

  if (isHorizontalSwipe) emit('swipe', deltaX > 0 ? 'prev' : 'next')
}

function handleCanvasPointerCancel(event: PointerEvent) {
  swipeStart.value = null
  if (event.pointerType === 'touch') activeTouchPointers.delete(event.pointerId)
  handlePointerEnd(event)
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
    @pointerdown="handleCanvasPointerDown"
    @pointermove="isDisplayedVideo ? undefined : handlePointerMove($event)"
    @pointerup="isDisplayedVideo ? undefined : handleCanvasPointerEnd($event)"
    @pointercancel="isDisplayedVideo ? undefined : handleCanvasPointerCancel($event)"
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
        :reaction-error="reactionError"
        :reaction-saving="reactionSaving"
        @react="emit('react', $event)"
      />
      <img
        v-else
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

    <div
      v-if="isVariantPreviewVisible && displayedPhoto"
      :key="`${displayedPhoto.id}-${props.previewVariant}`"
      class="photo-detail-canvas__preview"
      :aria-label="previewLabel"
      role="img"
    >
      <PhotoBlurhashPreview
        v-if="props.previewVariant === 'blurhash'"
        :hash="displayedPhoto.blurhash"
        :width="displayedPhoto.width"
        :height="displayedPhoto.height"
        :style="previewImageStyle"
      />
      <img
        v-else
        class="photo-detail-canvas__image photo-detail-canvas__image--preview"
        :src="previewSrc"
        :alt="`${displayedPhoto.filename} ${previewLabel}`"
        decoding="async"
        draggable="false"
        :style="previewImageStyle"
      />
    </div>

    <figcaption>
      <span v-if="loadFailed" class="photo-detail-canvas__load-error" role="status">
        Compressed image unavailable · showing thumbnail
      </span>
    </figcaption>
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

.photo-detail-canvas__preview {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  overflow: hidden;
  place-items: center;
  pointer-events: none;
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

.photo-detail-canvas__image--preview,
:deep(.photo-detail-canvas__preview-blurhash) {
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

@media (max-width: 767.9px) {
  .photo-detail-canvas {
    min-height: 0;
  }

  .photo-detail-canvas figcaption {
    top: 0.75rem;
    left: 0.8rem;
    font-size: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-detail-canvas__background,
  .photo-detail-canvas__background img,
  .photo-detail-canvas__media,
  .photo-detail-canvas__image--thumbnail,
  .photo-detail-canvas__image--compressed,
  .photo-detail-canvas__preview {
    transition-duration: 1ms;
  }
}
</style>
