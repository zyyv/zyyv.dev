<script setup lang="ts">
import { play } from 'cuelume'
import type { CSSProperties } from 'vue'
import type { Photo, PhotoPreviewLoadingState } from '~/types'
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import { usePhotoImage, usePhotoImageLoadState } from '~/composables/usePhotoImageLoadState'
import type { SuperImageMode } from '~/components/super-image/types'

const PhotoDetailVideoPlayer = defineAsyncComponent(() => import('./PhotoDetailVideoPlayer.vue'))

interface Props {
  transitioning?: boolean
}

const props = defineProps<Props>()

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

const BACKDROP_FADE_MS = 260

interface BackdropAsset {
  source: string
  role: 'current' | 'incoming'
}

const backdropTargetSource = shallowRef<string | null>(null)
const backdropCurrentSource = shallowRef<string | null>(null)
const backdropIncomingSource = shallowRef<string | null>(null)
const backdropCurrentVisible = shallowRef(false)
const backdropIncomingReady = shallowRef(false)
let backdropTransitionId = 0
let backdropTransitionTimer: ReturnType<typeof setTimeout> | undefined

const backdropAssets = computed<BackdropAsset[]>(() => {
  const assets: BackdropAsset[] = []
  const current = backdropCurrentSource.value
  const incoming = backdropIncomingSource.value

  if (current) assets.push({ source: current, role: 'current' })
  if (incoming && incoming !== current) assets.push({ source: incoming, role: 'incoming' })
  return assets
})

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

function clearBackdropTransition() {
  if (!backdropTransitionTimer) return
  clearTimeout(backdropTransitionTimer)
  backdropTransitionTimer = undefined
}

function removeBackdropCurrentAfterFade(transitionId: number) {
  clearBackdropTransition()
  backdropTransitionTimer = setTimeout(() => {
    backdropTransitionTimer = undefined
    if (backdropTransitionId !== transitionId || backdropTargetSource.value) return
    backdropCurrentSource.value = null
    backdropCurrentVisible.value = false
  }, BACKDROP_FADE_MS)
}

function commitBackdropIncoming(source: string, transitionId: number) {
  clearBackdropTransition()
  backdropTransitionTimer = setTimeout(() => {
    backdropTransitionTimer = undefined
    if (
      backdropTransitionId !== transitionId ||
      backdropIncomingSource.value !== source ||
      !backdropIncomingReady.value
    ) {
      return
    }

    backdropCurrentSource.value = source
    backdropCurrentVisible.value = true
    backdropIncomingSource.value = null
    backdropIncomingReady.value = false
  }, BACKDROP_FADE_MS)
}

function queueBackdropFade(source: string) {
  const transitionId = ++backdropTransitionId
  void nextTick(() => {
    requestAnimationFrame(() => {
      if (
        backdropTransitionId !== transitionId ||
        backdropIncomingSource.value !== source ||
        !backdropIncomingReady.value
      ) {
        return
      }

      backdropCurrentVisible.value = false
      commitBackdropIncoming(source, transitionId)
    })
  })
}

function resetBackdropForPhotoChange() {
  backdropTransitionId += 1
  clearBackdropTransition()
  backdropTargetSource.value = null
  backdropIncomingSource.value = null
  backdropIncomingReady.value = false
  if (backdropCurrentSource.value) backdropCurrentVisible.value = true
}

function syncBackdropTarget(source: string | null) {
  backdropTargetSource.value = source
  backdropTransitionId += 1
  clearBackdropTransition()

  if (!source) {
    backdropIncomingSource.value = null
    backdropIncomingReady.value = false
    if (!backdropCurrentSource.value) {
      backdropCurrentVisible.value = false
      return
    }

    backdropCurrentVisible.value = false
    removeBackdropCurrentAfterFade(backdropTransitionId)
    return
  }

  if (backdropCurrentSource.value === source) {
    backdropIncomingSource.value = null
    backdropIncomingReady.value = false
    backdropCurrentVisible.value = true
    return
  }

  if (backdropIncomingSource.value === source) return

  if (backdropCurrentSource.value && !backdropCurrentVisible.value) {
    backdropCurrentVisible.value = true
  }
  backdropIncomingSource.value = source
  backdropIncomingReady.value = false
}

function handleBackdropImageLoad(asset: BackdropAsset) {
  if (asset.role === 'current') {
    if (backdropCurrentSource.value === asset.source) backdropCurrentVisible.value = true
    return
  }
  if (backdropIncomingSource.value !== asset.source) return

  backdropIncomingReady.value = true
  queueBackdropFade(asset.source)
}

function handleBackdropImageError(asset: BackdropAsset) {
  if (asset.role === 'current') {
    if (backdropCurrentSource.value !== asset.source) return
    backdropTransitionId += 1
    clearBackdropTransition()
    backdropCurrentSource.value = null
    backdropCurrentVisible.value = false
    return
  }
  if (backdropIncomingSource.value !== asset.source) return

  backdropTransitionId += 1
  clearBackdropTransition()
  backdropIncomingSource.value = null
  backdropIncomingReady.value = false
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
  resetBackdropForPhotoChange()
  if (photo.mediaType === 'video') syncBackdropTarget(null)
  const hasCachedThumbnail = imageLoadState.isLoaded(photo.thumbnail)
  const compressedSrc = photo.compressed
  const hasCachedCompressedImage = imageLoadState.isLoaded(compressedSrc)

  displayedPhoto.value = photo
  loadProgress.value = hasCachedCompressedImage ? 100 : 0
  loadFailed.value = false
  showLoading.value = !hasCachedCompressedImage
  syncBackdropTarget(photo.mediaType === 'image' ? photo.thumbnail : null)
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
  backdropTransitionId += 1
  clearBackdropTransition()
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
      v-if="backdropAssets.length"
      class="photo-detail-canvas__backdrop-stack"
      aria-hidden="true"
    >
      <img
        v-for="asset in backdropAssets"
        :key="`backdrop-${asset.source}`"
        class="photo-detail-canvas__backdrop-image"
        :class="{
          'photo-detail-canvas__backdrop-image--current': asset.role === 'current',
          'photo-detail-canvas__backdrop-image--incoming': asset.role === 'incoming',
          'is-visible': asset.role === 'current' ? backdropCurrentVisible : backdropIncomingReady,
        }"
        :src="asset.source"
        alt=""
        loading="eager"
        decoding="async"
        @load="handleBackdropImageLoad(asset)"
        @error="handleBackdropImageError(asset)"
      />
    </div>

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
          :view-transition-name="props.transitioning ? 'photo-detail-image' : undefined"
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
  isolation: isolate;
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

.photo-detail-canvas__backdrop-stack {
  position: absolute;
  z-index: 0;
  inset: -3rem;
  overflow: hidden;
  opacity: 0.72;
  filter: blur(2rem) saturate(0.72);
  pointer-events: none;
  transform: scale(1.06);
}

.photo-detail-canvas__backdrop-image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 260ms ease;
}

.photo-detail-canvas__backdrop-image--current {
  z-index: 0;
}

.photo-detail-canvas__backdrop-image--incoming {
  z-index: 1;
}

.photo-detail-canvas__backdrop-image.is-visible {
  opacity: 1;
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
  .photo-detail-canvas__backdrop-image,
  .photo-detail-canvas__media,
  .photo-detail-canvas__image-content {
    transition-duration: 1ms;
  }
}
</style>
