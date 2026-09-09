import { computed, inject, provide, readonly, shallowRef, watch } from 'vue'
import type { ComputedRef, InjectionKey, MaybeRefOrGetter, ShallowRef } from 'vue'
import type {
  Photo,
  PhotoPreviewLoadingState,
  PhotoPreviewVariant,
  PhotoReactionCounts,
  PhotoReactionType,
} from '~/types'

export interface CanvasControls {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

export interface PhotoDetailContext {
  photo: ComputedRef<Photo | null>
  photos: ComputedRef<readonly Photo[]>
  visible: ComputedRef<boolean>
  displayedPhoto: Readonly<ShallowRef<Photo | null>>
  detailPhoto: ComputedRef<Photo | null>
  currentIndex: ComputedRef<number>
  hasPrev: ComputedRef<boolean>
  hasNext: ComputedRef<boolean>
  isVideo: ComputedRef<boolean>
  previewVariant: Readonly<ShallowRef<PhotoPreviewVariant>>
  activePreviewVariant: Readonly<ShallowRef<PhotoPreviewVariant>>
  checkerboard: Readonly<ShallowRef<boolean>>
  zoomLabel: Readonly<ShallowRef<string>>
  downloadLoading: Readonly<ShallowRef<boolean>>
  downloadProgress: Readonly<ShallowRef<number>>
  previewLoading: Readonly<ShallowRef<PhotoPreviewLoadingState>>
  reactionCounts: Readonly<ShallowRef<PhotoReactionCounts>>
  reactionSaving: Readonly<ShallowRef<boolean>>
  reactionError: Readonly<ShallowRef<string | null>>
  actions: PhotoDetailContextActions
}

export interface PhotoDetailContextActions {
  close: () => void
  previous: () => void
  next: () => void
  select: (photo: Photo) => void
  react: (reaction: PhotoReactionType) => void
  setDisplayedPhoto: (photo: Photo | null) => void
  setPreviewVariant: (variant: PhotoPreviewVariant) => void
  setActivePreviewVariant: (variant: PhotoPreviewVariant) => void
  setCheckerboard: (value: boolean) => void
  setZoomLabel: (label: string) => void
  setDownloadProgress: (loading: boolean, progress: number) => void
  setPreviewLoading: (loading: PhotoPreviewLoadingState) => void
  registerCanvasControls: (controls: CanvasControls | null) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

interface PhotoDetailContextOptions {
  photo: MaybeRefOrGetter<Photo | null>
  photos: MaybeRefOrGetter<readonly Photo[]>
  visible: MaybeRefOrGetter<boolean>
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onSelect: (photo: Photo) => void
}

const photoDetailContextKey: InjectionKey<PhotoDetailContext> = Symbol('photo-detail-context')

export function providePhotoDetailContext(options: PhotoDetailContextOptions): PhotoDetailContext {
  const photo = computed(() => toValue(options.photo))
  const photos = computed<readonly Photo[]>(() => toValue(options.photos))
  const visible = computed(() => toValue(options.visible))
  const displayedPhoto = shallowRef<Photo | null>(null)
  const previewVariant = shallowRef<PhotoPreviewVariant>('compressed')
  const activePreviewVariant = shallowRef<PhotoPreviewVariant>('thumbnail')
  const checkerboard = shallowRef(false)
  const zoomLabel = shallowRef('100%')
  const downloadLoading = shallowRef(false)
  const downloadProgress = shallowRef(0)
  const previewLoading = shallowRef<PhotoPreviewLoadingState>(createPreviewLoadingState())
  const canvasControls = shallowRef<CanvasControls | null>(null)
  const detailPhoto = computed(() => displayedPhoto.value ?? photo.value)
  const currentIndex = computed(() => {
    if (!photo.value) return -1
    return photos.value.findIndex((item) => item.id === photo.value?.id)
  })
  const hasPrev = computed(() => currentIndex.value > 0)
  const hasNext = computed(
    () => currentIndex.value >= 0 && currentIndex.value < photos.value.length - 1,
  )
  const isVideo = computed(() => detailPhoto.value?.mediaType === 'video')
  const {
    counts: reactionCounts,
    saving: reactionSaving,
    error: reactionError,
    react,
  } = usePhotoReactions(detailPhoto)

  function setPreviewVariant(variant: PhotoPreviewVariant) {
    if (detailPhoto.value?.mediaType !== 'image') return
    previewVariant.value = variant
  }

  function setDownloadProgress(loading: boolean, progress: number) {
    downloadLoading.value = loading
    downloadProgress.value = Math.min(100, Math.max(0, progress))
  }

  function setPreviewLoading(loading: PhotoPreviewLoadingState) {
    previewLoading.value = { ...loading }
  }

  function registerCanvasControls(controls: CanvasControls | null) {
    canvasControls.value = controls
  }

  const actions: PhotoDetailContextActions = {
    close: options.onClose,
    previous() {
      if (hasPrev.value) options.onPrevious()
    },
    next() {
      if (hasNext.value) options.onNext()
    },
    select(photoToSelect) {
      if (photoToSelect.id !== photo.value?.id) options.onSelect(photoToSelect)
    },
    react,
    setDisplayedPhoto(photoToDisplay) {
      displayedPhoto.value = photoToDisplay
    },
    setPreviewVariant,
    setActivePreviewVariant(variant) {
      activePreviewVariant.value = variant
    },
    setCheckerboard(value) {
      checkerboard.value = value
    },
    setZoomLabel(label) {
      zoomLabel.value = label
    },
    setDownloadProgress,
    setPreviewLoading,
    registerCanvasControls,
    zoomIn() {
      canvasControls.value?.zoomIn()
    },
    zoomOut() {
      canvasControls.value?.zoomOut()
    },
    resetZoom() {
      canvasControls.value?.reset()
    },
  }

  watch(
    () => photo.value?.id,
    () => {
      previewVariant.value = 'compressed'
      activePreviewVariant.value = 'thumbnail'
      previewLoading.value = createPreviewLoadingState()
      downloadLoading.value = false
      downloadProgress.value = 0
      zoomLabel.value = '100%'
    },
  )

  const context: PhotoDetailContext = {
    photo,
    photos,
    visible,
    displayedPhoto: readonly(displayedPhoto),
    detailPhoto,
    currentIndex,
    hasPrev,
    hasNext,
    isVideo,
    previewVariant: readonly(previewVariant),
    activePreviewVariant: readonly(activePreviewVariant),
    checkerboard: readonly(checkerboard),
    zoomLabel: readonly(zoomLabel),
    downloadLoading: readonly(downloadLoading),
    downloadProgress: readonly(downloadProgress),
    previewLoading: readonly(previewLoading),
    reactionCounts,
    reactionSaving,
    reactionError,
    actions,
  }

  provide(photoDetailContextKey, context)
  return context
}

export function usePhotoDetailContext(): PhotoDetailContext {
  const context = inject(photoDetailContextKey, null)
  if (!context) throw new Error('usePhotoDetailContext must be used inside PhotoDetail.')
  return context
}

function createPreviewLoadingState(): PhotoPreviewLoadingState {
  return {
    thumbnail: false,
    compressed: false,
    origin: false,
    blurhash: false,
  }
}
