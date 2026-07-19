import type { Photo } from '~/types'
import { preloadImage } from '~/utils/preloadImage'

const PHOTO_IMAGE_TRANSITION_NAME = 'photo-detail-image'

interface GallerySnapshot {
  photoId: string
  page: number
  scrollTop: number
}

// The element currently owning the shared `photo-detail-image` transition
// name. Module-scoped so the cleanup hook can always reach it, even after the
// owning page has unmounted.
let transitionImage: HTMLElement | null = null

function nameTransitionImage(element: HTMLElement | null) {
  if (transitionImage && transitionImage !== element) transitionImage.style.viewTransitionName = ''
  transitionImage = element
  if (element) element.style.viewTransitionName = PHOTO_IMAGE_TRANSITION_NAME
}

/**
 * Drives the shared-element view transition between the gallery and the photo
 * detail page. The actual `document.startViewTransition` call is owned by
 * Nuxt's route transition (`experimental.viewTransition`) — calling it manually
 * around `router.push` would skip Nuxt's transition. This composable only
 * prepares the transition names/flags before navigating and cleans up once the
 * route transition finishes.
 */
export function usePhotoViewTransition() {
  const router = useRouter()
  const nuxtApp = useNuxtApp()
  const preferredMotion = usePreferredReducedMotion()
  const isTransitioning = useState<boolean>('photo-view-transitioning', () => false)
  const gallerySnapshot = useState<GallerySnapshot | null>('photo-gallery-snapshot', () => null)

  if (import.meta.client && !(nuxtApp as Record<string, unknown>).__photoTransitionCleanup) {
    ;(nuxtApp as Record<string, unknown>).__photoTransitionCleanup = true
    nuxtApp.hook('page:view-transition:start', (transition) => {
      if (!document.documentElement.dataset.photoTransition) return

      const cleanup = () => {
        nameTransitionImage(null)
        delete document.documentElement.dataset.photoTransition
        isTransitioning.value = false
      }

      void transition.finished.then(cleanup, cleanup)
    })
  }

  function canTransition() {
    return (
      import.meta.client &&
      preferredMotion.value !== 'reduce' &&
      typeof document.startViewTransition === 'function'
    )
  }

  function setTransitionPhase(phase: 'open' | 'close') {
    document.documentElement.dataset.photoTransition = phase
    isTransitioning.value = true
    // Commit the scoped transition names before the browser captures the old view.
    document.documentElement.getBoundingClientRect()
  }

  // Gallery -> detail page. The source thumbnail morphs into the detail image.
  async function openPhoto(
    photo: Photo,
    source: HTMLElement | null,
    snapshot: { page: number; scrollTop: number },
  ) {
    gallerySnapshot.value = { photoId: photo.id, ...snapshot }

    const sourceImage = source?.querySelector<HTMLElement>('img') ?? null
    if (!canTransition() || !sourceImage) {
      await router.push(`/photos/${photo.id}`)
      return
    }

    // Make sure the detail image is decoded before the new view is captured.
    await preloadImage(photo.compressed)
    nameTransitionImage(sourceImage)
    setTransitionPhase('open')
    await router.push(`/photos/${photo.id}`)
  }

  // Detail page -> gallery. The detail image morphs back to its thumbnail.
  async function closePhoto(photoId: string) {
    if (canTransition()) {
      // Keep the pagination/scroll snapshot from the open navigation, but aim
      // the morph at the photo being viewed right now.
      const previous = gallerySnapshot.value
      gallerySnapshot.value = {
        photoId,
        page: previous?.page ?? 1,
        scrollTop: previous?.scrollTop ?? 0,
      }
      setTransitionPhase('close')
    }

    const back = router.options.history.state.back
    if (typeof back === 'string' && back.startsWith('/photos')) {
      router.back()
    } else {
      await router.push('/photos')
    }
  }

  // Called by the gallery after a close navigation: returns the snapshot to
  // restore (pagination + scroll) and the photo to morph back to. Consumed once.
  function consumeGallerySnapshot() {
    const snapshot = gallerySnapshot.value
    gallerySnapshot.value = null
    return snapshot
  }

  return {
    isTransitioning: readonly(isTransitioning),
    openPhoto,
    closePhoto,
    consumeGallerySnapshot,
    nameTransitionImage,
  }
}
