import type { MaybeRefOrGetter } from 'vue'

type ViewUpdate = () => void | Promise<void>

interface PhotoViewTransitionOptions {
  sourceRoot: MaybeRefOrGetter<HTMLElement | null>
}

const PHOTO_IMAGE_TRANSITION_NAME = 'photo-detail-image'
const decodedImages = new Map<string, Promise<void>>()

function decodeImage(src: string) {
  const cachedDecode = decodedImages.get(src)
  if (cachedDecode) return cachedDecode

  const decode = new Promise<void>((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.src = src

    void image.decode().then(
      () => resolve(),
      () => resolve(),
    )
  })

  decodedImages.set(src, decode)
  return decode
}

export function usePhotoViewTransition(options: PhotoViewTransitionOptions) {
  const preferredMotion = usePreferredReducedMotion()
  const isTransitioning = shallowRef(false)

  function canTransition() {
    return (
      import.meta.client &&
      preferredMotion.value !== 'reduce' &&
      typeof document.startViewTransition === 'function'
    )
  }

  function findSourceImage(photoId: string) {
    const sourceRoot = toValue(options.sourceRoot)
    if (!sourceRoot) return null

    const source = Array.from(
      sourceRoot.querySelectorAll<HTMLElement>('[data-photo-transition-id]'),
    ).find((element) => element.dataset.photoTransitionId === photoId)

    return source?.querySelector<HTMLElement>('img') ?? null
  }

  async function updateWithoutTransition(update: ViewUpdate) {
    await update()
    await nextTick()
  }

  function setTransitionPhase(phase: 'open' | 'close') {
    document.documentElement.dataset.photoTransition = phase
    isTransitioning.value = true
    // Commit the scoped transition names before the browser captures the old view.
    document.documentElement.getBoundingClientRect()
  }

  function cleanupTransition(element?: HTMLElement | null) {
    if (element) element.style.viewTransitionName = ''
    delete document.documentElement.dataset.photoTransition
    isTransitioning.value = false
  }

  async function openPhoto(detailSrc: string, source: HTMLElement | null, update: ViewUpdate) {
    const sourceImage = source?.querySelector<HTMLElement>('img') ?? source
    if (!canTransition() || !sourceImage) {
      await updateWithoutTransition(update)
      return
    }

    await decodeImage(detailSrc)
    sourceImage.style.viewTransitionName = PHOTO_IMAGE_TRANSITION_NAME
    setTransitionPhase('open')

    const transition = document.startViewTransition(async () => {
      await update()
      await nextTick()

      // The source stays mounted behind the dialog. Remove its name from the
      // new snapshot so only the detail image owns the shared transition.
      sourceImage.style.viewTransitionName = ''
    })

    void transition.finished.then(
      () => cleanupTransition(sourceImage),
      () => cleanupTransition(sourceImage),
    )
  }

  async function closePhoto(photoId: string, update: ViewUpdate) {
    if (!canTransition()) {
      await updateWithoutTransition(update)
      return
    }

    setTransitionPhase('close')
    let targetImage: HTMLElement | null = null

    const transition = document.startViewTransition(async () => {
      await update()
      await nextTick()

      targetImage = findSourceImage(photoId)
      if (targetImage) targetImage.style.viewTransitionName = PHOTO_IMAGE_TRANSITION_NAME
    })

    void transition.finished.then(
      () => cleanupTransition(targetImage),
      () => cleanupTransition(targetImage),
    )
  }

  return {
    isTransitioning: readonly(isTransitioning),
    openPhoto,
    closePhoto,
  }
}
