import type { MaybeRefOrGetter } from 'vue'
import type { Photo, PhotoReactionCounts, PhotoReactionResponse, PhotoReactionType } from '~/types'
import { createEmptyPhotoReactionCounts } from '#shared/constants/photo-reactions'

export function usePhotoReactions(photo: MaybeRefOrGetter<Photo | null>) {
  const counts = shallowRef<PhotoReactionCounts>(createEmptyPhotoReactionCounts())
  const loading = shallowRef(false)
  const saving = shallowRef(false)
  const error = shallowRef<string | null>(null)

  watch(
    () => toValue(photo)?.id,
    async (photoId, _previousId, onCleanup) => {
      const currentPhoto = toValue(photo)
      counts.value = currentPhoto?.reactions || createEmptyPhotoReactionCounts()
      error.value = null
      if (!photoId) return

      const controller = new AbortController()
      onCleanup(() => controller.abort())
      loading.value = true

      try {
        const response = await $fetch<PhotoReactionResponse>(`/api/photo-reactions/${photoId}`, {
          signal: controller.signal,
        })
        counts.value = response.counts
      } catch (cause) {
        if (!controller.signal.aborted) {
          error.value = cause instanceof Error ? cause.message : 'Unable to load reactions'
        }
      } finally {
        if (!controller.signal.aborted) loading.value = false
      }
    },
    { immediate: true },
  )

  async function saveReaction(photoId: string, reaction: PhotoReactionType) {
    if (toValue(photo)?.id !== photoId || saving.value) return

    saving.value = true
    error.value = null
    try {
      const response = await $fetch<PhotoReactionResponse>(`/api/photo-reactions/${photoId}`, {
        method: 'POST',
        body: { reaction },
      })
      if (toValue(photo)?.id !== photoId) return
      counts.value = response.counts
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Unable to save reaction'
    } finally {
      saving.value = false
    }
  }

  const debouncedSaveReaction = useDebounceFn(saveReaction, 300)

  function react(reaction: PhotoReactionType) {
    const photoId = toValue(photo)?.id
    if (photoId) void debouncedSaveReaction(photoId, reaction)
  }

  return {
    counts: readonly(counts),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    react,
  }
}
