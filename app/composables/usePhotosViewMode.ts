export type PhotosViewMode = 'waterfall' | 'ripplable'

export function usePhotosViewMode() {
  const mode = useState<PhotosViewMode>('photos-view-mode', () => 'waterfall')
  const isTransitioning = useState('photos-view-transitioning', () => false)
  const preferredMotion = usePreferredReducedMotion()

  async function togglePhotosView() {
    const nextMode = mode.value === 'waterfall' ? 'ripplable' : 'waterfall'

    if (
      import.meta.server ||
      preferredMotion.value === 'reduce' ||
      typeof document.startViewTransition !== 'function'
    ) {
      mode.value = nextMode
      return
    }

    document.activeViewTransition?.skipTransition()
    document.documentElement.dataset.photosViewTransition = nextMode
    isTransitioning.value = true
    // Commit the gallery transition name before the browser captures the old view.
    document.documentElement.getBoundingClientRect()

    const transition = document.startViewTransition(async () => {
      mode.value = nextMode
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
