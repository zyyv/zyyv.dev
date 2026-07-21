import type { MaybeRefOrGetter } from 'vue'

type ViewUpdate = () => void | Promise<void>

interface PhotoDialogViewTransitionOptions {
  sourceRoot: MaybeRefOrGetter<HTMLElement | null>
}

const PHOTO_IMAGE_TRANSITION_NAME = 'photo-detail-image'

export function usePhotoDialogViewTransition(options: PhotoDialogViewTransitionOptions) {
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

  function startTransition(phase: 'open' | 'close') {
    document.documentElement.dataset.photoDialogTransition = phase
    isTransitioning.value = true
    document.documentElement.getBoundingClientRect()
  }

  function finishTransition(element?: HTMLElement | null) {
    if (element) element.style.viewTransitionName = ''
    delete document.documentElement.dataset.photoDialogTransition
    isTransitioning.value = false
  }

  async function openPhoto(source: HTMLElement | null, update: ViewUpdate) {
    const sourceImage = source?.querySelector<HTMLElement>('img') ?? source
    if (!canTransition() || !sourceImage || isTransitioning.value) {
      await updateWithoutTransition(update)
      return
    }

    sourceImage.style.viewTransitionName = PHOTO_IMAGE_TRANSITION_NAME
    startTransition('open')

    const transition = document.startViewTransition(async () => {
      await update()
      await nextTick()

      // The gallery stays mounted behind the dialog. Only the detail image may
      // own the shared name in the new snapshot.
      sourceImage.style.viewTransitionName = ''
    })

    void transition.finished.then(
      () => finishTransition(sourceImage),
      () => finishTransition(sourceImage),
    )
  }

  async function closePhoto(photoId: string, update: ViewUpdate) {
    if (!canTransition() || isTransitioning.value) {
      await updateWithoutTransition(update)
      return
    }

    startTransition('close')
    let targetImage: HTMLElement | null = null

    const transition = document.startViewTransition(async () => {
      await update()
      await nextTick()

      targetImage = findSourceImage(photoId)
      if (targetImage) targetImage.style.viewTransitionName = PHOTO_IMAGE_TRANSITION_NAME
    })

    void transition.finished.then(
      () => finishTransition(targetImage),
      () => finishTransition(targetImage),
    )
  }

  return {
    isTransitioning: readonly(isTransitioning),
    openPhoto,
    closePhoto,
  }
}
