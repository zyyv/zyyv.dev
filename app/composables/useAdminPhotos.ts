import type { NewPhoto, PhotoExif, PhotoListResponse } from '~/types'

export interface PhotoUploadPayload {
  file: File
  blurhash: string
  exif?: PhotoExif
  private: boolean
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const candidate = error as {
      data?: { statusMessage?: string; message?: string }
      statusMessage?: string
      message?: string
    }
    return (
      candidate.data?.statusMessage ||
      candidate.data?.message ||
      candidate.statusMessage ||
      candidate.message ||
      '请求失败，请稍后重试'
    )
  }
  return '请求失败，请稍后重试'
}

export function useAdminPhotos() {
  const photos = ref<NewPhoto[]>([])
  const loading = ref(false)
  const mutating = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const limit = ref(24)
  const total = ref(0)
  const totalPages = ref(0)
  const search = ref('')
  const visibility = ref<'all' | 'public' | 'private'>('all')

  async function loadPhotos(nextPage = page.value) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<PhotoListResponse>('/api/admin/photos', {
        query: {
          page: nextPage,
          limit: limit.value,
          search: search.value || undefined,
          visibility: visibility.value,
        },
      })
      photos.value = response.photos
      page.value = response.pagination.page
      total.value = response.pagination.total
      totalPages.value = response.pagination.totalPages
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function uploadPhoto(payload: PhotoUploadPayload) {
    mutating.value = true
    error.value = null
    try {
      const form = new FormData()
      form.append('file', payload.file)
      form.append('blurhash', payload.blurhash)
      form.append('private', String(payload.private))
      if (payload.exif) form.append('exif', JSON.stringify(payload.exif))
      const photo = await $fetch<NewPhoto>('/api/admin/photos', { method: 'POST', body: form })
      await loadPhotos(1)
      return photo
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  async function updatePhoto(id: string, update: Pick<NewPhoto, 'filename' | 'private' | 'exif'>) {
    mutating.value = true
    error.value = null
    try {
      const photo = await $fetch<NewPhoto>(`/api/admin/photos/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: update,
      })
      const index = photos.value.findIndex((item) => item.id === id)
      if (index >= 0) photos.value[index] = photo
      return photo
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  async function deletePhoto(id: string) {
    mutating.value = true
    error.value = null
    try {
      await $fetch(`/api/admin/photos/${encodeURIComponent(id)}`, { method: 'DELETE' })
      await loadPhotos(photos.value.length === 1 && page.value > 1 ? page.value - 1 : page.value)
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  return {
    photos: readonly(photos),
    loading: readonly(loading),
    mutating: readonly(mutating),
    error: readonly(error),
    page: readonly(page),
    total: readonly(total),
    totalPages: readonly(totalPages),
    search,
    visibility,
    loadPhotos,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
  }
}
