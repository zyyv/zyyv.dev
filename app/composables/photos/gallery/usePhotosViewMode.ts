export type PhotosViewMode = 'waterfall' | 'ripplable' | 'map'

const PHOTOS_VIEW_MODES: PhotosViewMode[] = ['waterfall', 'ripplable', 'map']

function getPhotosViewMode(value: unknown): PhotosViewMode {
  return PHOTOS_VIEW_MODES.includes(value as PhotosViewMode)
    ? (value as PhotosViewMode)
    : 'waterfall'
}

export function getNextPhotosViewMode(mode: PhotosViewMode): PhotosViewMode {
  const currentIndex = PHOTOS_VIEW_MODES.indexOf(mode)
  return PHOTOS_VIEW_MODES[(currentIndex + 1) % PHOTOS_VIEW_MODES.length] || 'waterfall'
}

export function usePhotosViewMode() {
  const route = useRoute()
  const router = useRouter()
  const isTransitioning = useState('photos-view-transitioning', () => false)
  const preferredMotion = usePreferredReducedMotion()
  const mode = computed(() => getPhotosViewMode(route.query.mode))

  async function togglePhotosView() {
    const nextMode = getNextPhotosViewMode(mode.value)
    const navigate = () =>
      router.push({
        query: {
          ...route.query,
          mode: nextMode,
        },
      })

    if (
      import.meta.server ||
      preferredMotion.value === 'reduce' ||
      typeof document.startViewTransition !== 'function'
    ) {
      await navigate()
      return
    }

    document.activeViewTransition?.skipTransition()
    document.documentElement.dataset.photosViewTransition = nextMode
    isTransitioning.value = true
    // Commit the gallery transition name before the browser captures the old view.
    document.documentElement.getBoundingClientRect()

    const transition = document.startViewTransition(async () => {
      await navigate()
      await nextTick()
    })

    const cleanup = () => {
      delete document.documentElement.dataset.photosViewTransition
      isTransitioning.value = false
    }

    void transition.finished.then(cleanup, cleanup)
  }

  return {
    mode: readonly(mode),
    isTransitioning: readonly(isTransitioning),
    togglePhotosView,
  }
}
