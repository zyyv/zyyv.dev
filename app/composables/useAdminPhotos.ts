import type { NewPhoto, PhotoExif, PhotoListResponse } from '~/types'

export interface PhotoUploadPayload {
  file: File
  compressed: File
  thumbnail: File
  width: number
  height: number
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
    let uploadId: string | undefined
    const variantContentTypes = {
      compressedContentType: payload.compressed.type,
      thumbnailContentType: payload.thumbnail.type,
    }
    try {
      const upload = await $fetch<{ id: string }>('/api/admin/photo-uploads', {
        method: 'POST',
        body: { filename: payload.file.name, ...variantContentTypes },
      })
      uploadId = upload.id
      const uploads = await Promise.allSettled([
        uploadVariant(uploadId, 'origin', payload.file, payload.file.name),
        uploadVariant(uploadId, 'compressed', payload.compressed, payload.file.name),
        uploadVariant(uploadId, 'thumbnail', payload.thumbnail, payload.file.name),
      ])
      const failedUpload = uploads.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      if (failedUpload) throw failedUpload.reason
      const photo = await $fetch<NewPhoto>(`/api/admin/photo-uploads/${uploadId}/finalize`, {
        method: 'POST',
        body: {
          filename: payload.file.name,
          ...variantContentTypes,
          width: payload.width,
          height: payload.height,
          blurhash: payload.blurhash,
          private: payload.private,
          exif: payload.exif,
        },
      })
      await loadPhotos(1)
      return photo
    } catch (cause) {
      if (uploadId) {
        await $fetch(`/api/admin/photo-uploads/${uploadId}`, {
          method: 'DELETE',
          query: { filename: payload.file.name, ...variantContentTypes },
        }).catch(() => undefined)
      }
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  async function uploadVariant(
    id: string,
    variant: 'origin' | 'compressed' | 'thumbnail',
    file: File,
    filename: string,
  ) {
    await $fetch(`/api/admin/photo-uploads/${id}/${variant}`, {
      method: 'PUT',
      body: file,
      query: { filename },
      headers: { 'Content-Type': file.type },
    })
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
