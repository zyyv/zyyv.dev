<script setup lang="ts">
import { play } from 'cuelume'
import type { CSSProperties } from 'vue'
import type { Photo, PhotoPreviewLoadingState } from '~/types'
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import { usePhotoImage, usePhotoImageLoadState } from '~/composables/usePhotoImageLoadState'
import type { SuperImageMode } from '~/components/super-image/types'

const PhotoDetailVideoPlayer = defineAsyncComponent(() => import('./PhotoDetailVideoPlayer.vue'))

const SWIPE_MIN_DISTANCE = 48
const SWIPE_AXIS_RATIO = 1.2

interface SwipeStart {
  pointerId: number
  x: number
  y: number
}

const detailContext = usePhotoDetailContext()
const {
  photo: selectedPhoto,
  photos,
  previewVariant,
  checkerboard,
  hasPrev,
  hasNext,
  actions,
} = detailContext
const imageLoadState = usePhotoImageLoadState()
const displayedPhoto = shallowRef<Photo | null>(null)
const thumbnailImage = usePhotoImage(() => displayedPhoto.value?.thumbnail ?? '')
const compressedImage = usePhotoImage(() => displayedPhoto.value?.compressed ?? '')
const originImage = usePhotoImage(() => displayedPhoto.value?.origin ?? '')
const showLoading = shallowRef(false)
const loadProgress = shallowRef(0)
const loadFailed = shallowRef(false)
const useCheckerboard = computed({
  get: () => checkerboard.value,
  set: (value: boolean) => actions.setCheckerboard(value),
})
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

const canvasClasses = computed(() => ({
  'is-checkerboard': useCheckerboard.value,
  'is-dragging': isDragging.value,
  'is-video': displayedPhoto.value?.mediaType === 'video',
}))
const isDisplayedVideo = computed(() => displayedPhoto.value?.mediaType === 'video')
const previewLoading = computed<PhotoPreviewLoadingState>(() => ({
  thumbnail: !isDisplayedVideo.value && thumbnailImage.isLoading.value,
  compressed: !isDisplayedVideo.value && compressedImage.isLoading.value,
  origin:
    !isDisplayedVideo.value &&
    previewVariant.value === 'origin' &&
    !originImage.isLoaded.value &&
    !originImage.hasError.value,
  arthash: false,
}))
const currentImageStyle = computed<CSSProperties>(() => {
  const photo = displayedPhoto.value
  return photo ? getImageStyle(photo, Infinity, imageStyle.value) : imageStyle.value
})
const swipeStart = shallowRef<SwipeStart | null>(null)
const activeTouchPointers = new Set<number>()

watch(
  [showLoading, loadProgress],
  ([loading, progress]) => actions.setDownloadProgress(loading, progress),
  { immediate: true },
)
watch(zoomLabel, (label) => actions.setZoomLabel(label), { immediate: true })
watch(previewLoading, (loading) => actions.setPreviewLoading(loading), { immediate: true })

watch(
  [previewVariant, () => displayedPhoto.value?.id],
  ([variant]) => {
    const photo = displayedPhoto.value
    if (variant !== 'origin' || !photo || photo.mediaType !== 'image') return
    void originImage.preload({ expectedBytes: photo.originSize })
  },
  { immediate: true },
)

actions.registerCanvasControls({ reset: resetCanvas, zoomIn, zoomOut })

watch(
  selectedPhoto,
  (photo) => {
    if (photo) void displayPhoto(photo)
  },
  { immediate: true },
)

function getPhotoIndex(photo: Photo | null): number {
  if (!photo) return -1
  return photos.value.findIndex((item) => item.id === photo.id)
}

function preloadNeighbors(photo: Photo) {
  const index = getPhotoIndex(photo)
  if (index < 0) return

  const neighbors = [photos.value[index - 1], photos.value[index + 1]].filter((p) => !!p)

  Promise.all(
    neighbors.map((neighbor) =>
      imageLoadState.preload(neighbor.compressed, {
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
  const horizontalPadding = isMobile ? 0 : Math.min(160, Math.max(80, viewportWidth.value * 0.12))
  const verticalPadding = isMobile ? 0 : Math.min(128, Math.max(88, viewportHeight.value * 0.15))
  const availableWidth = Math.max(1, canvasWidth.value - horizontalPadding)
  const availableHeight = Math.max(1, canvasHeight.value - verticalPadding)
  const containScale = Math.min(1, availableWidth / imageWidth, availableHeight / imageHeight)

  return {
    width: `${Math.max(1, Math.round(imageWidth * containScale))}px`,
    height: `${Math.max(1, Math.round(imageHeight * containScale))}px`,
    ...transformStyle,
  }
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

  if (!isHorizontalSwipe) return

  const direction = deltaX > 0 ? 'prev' : 'next'
  const canNavigate = direction === 'prev' ? hasPrev.value : hasNext.value
  if (!canNavigate) return

  play('page')
  if (direction === 'prev') actions.previous()
  else actions.next()
}

function handleCanvasPointerCancel(event: PointerEvent) {
  swipeStart.value = null
  if (event.pointerType === 'touch') activeTouchPointers.delete(event.pointerId)
  handlePointerEnd(event)
}

function stopLoadingIndicator() {
  showLoading.value = false
}

function handleCurrentImageLoad(_mode: SuperImageMode, source: string) {
  const photo = displayedPhoto.value
  if (!photo || photo.mediaType === 'video') return

  const expectedSources = [photo.thumbnail, photo.compressed, photo.origin].filter(Boolean)
  if (!expectedSources.includes(source)) return
  imageLoadState.markLoaded(source)
  if (source === photo.compressed) {
    loadProgress.value = 100
    stopLoadingIndicator()
  }
}

function handleCurrentImageError(_mode: SuperImageMode, source: string) {
  const photo = displayedPhoto.value
  if (!photo || photo.mediaType === 'video') return

  const expectedSources = [photo.thumbnail, photo.compressed, photo.origin].filter(Boolean)
  if (!expectedSources.includes(source)) return
  imageLoadState.markError(source)
  if (source === photo.compressed) {
    loadFailed.value = true
    stopLoadingIndicator()
  }
}

function handleCurrentImageMode(mode: SuperImageMode) {
  actions.setActivePreviewVariant(mode)
}

function handleCurrentMediaReady() {
  if (!isDisplayedVideo.value) return
  loadProgress.value = 100
  stopLoadingIndicator()
}

async function displayPhoto(photo: Photo) {
  const currentRequest = ++requestId
  if (displayedPhoto.value?.id === photo.id) return
  const hasCachedThumbnail = imageLoadState.isLoaded(photo.thumbnail)
  const compressedSrc = photo.compressed
  const hasCachedCompressedImage = imageLoadState.isLoaded(compressedSrc)

  displayedPhoto.value = photo
  loadProgress.value = hasCachedCompressedImage ? 100 : 0
  loadFailed.value = false
  showLoading.value = !hasCachedCompressedImage
  resetCanvas()
  actions.setDisplayedPhoto(photo)

  const thumbnailLoadingPromise =
    photo.mediaType === 'image' && !hasCachedThumbnail
      ? thumbnailImage.preload({
          expectedBytes: photo.thumbnailSize,
        })
      : null
  const loadingPromise = hasCachedCompressedImage
    ? null
    : compressedImage.preload({
        expectedBytes: photo.compressedSize,
        onProgress(progress) {
          if (currentRequest === requestId) loadProgress.value = progress.percentage
        },
      })
  if (thumbnailLoadingPromise) {
    void thumbnailLoadingPromise.then((loaded) => {
      if (currentRequest !== requestId) return
      if (loaded) imageLoadState.markLoaded(photo.thumbnail)
    })
  }
  preloadNeighbors(photo)

  await nextTick()
  if (currentRequest !== requestId) return

  if (!loadingPromise) return

  const loaded = await loadingPromise
  if (currentRequest !== requestId) return

  stopLoadingIndicator()
  if (!loaded) {
    loadFailed.value = true
    return
  }

  loadProgress.value = 100
  stopLoadingIndicator()
}

onBeforeUnmount(() => {
  actions.registerCanvasControls(null)
  requestId += 1
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
    <div
      v-if="displayedPhoto"
      class="photo-detail-canvas__media photo-detail-canvas__media--current"
    >
      <PhotoDetailVideoPlayer
        v-if="isDisplayedVideo"
        :key="displayedPhoto.id"
        @ready="handleCurrentMediaReady"
      />
      <div v-else class="photo-detail-canvas__image-frame">
        <div
          ref="canvasImage"
          class="photo-detail-canvas__image-measure"
          :style="currentImageStyle"
          aria-hidden="true"
        />
        <SuperImage
          :resources="{
            arthash: displayedPhoto.arthash,
            thumbnail: displayedPhoto.thumbnail,
            compressed: displayedPhoto.compressed,
            origin: displayedPhoto.origin,
          }"
          :alt="displayedPhoto.filename"
          decoding="async"
          draggable="false"
          object-fit="contain"
          class="photo-detail-canvas__image-content"
          :asset-style="currentImageStyle"
          backdrop
          :mode="previewVariant"
          @load="handleCurrentImageLoad"
          @error="handleCurrentImageError"
          @active-mode="handleCurrentImageMode"
        />
      </div>
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

.photo-detail-canvas__media {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  display: grid;
  place-items: center;
}

.photo-detail-canvas__image-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.photo-detail-canvas__image-measure {
  position: absolute;
  inset: 0;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
  visibility: hidden;
  pointer-events: none;
}

.photo-detail-canvas__image-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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
  .photo-detail-canvas__media,
  .photo-detail-canvas__image-content {
    transition-duration: 1ms;
  }
}
</style>
