import type { ArthashConfig, Photo, PhotoExif, PhotoListResponse } from '~/types'

export interface PhotoUploadPayload {
  file: File
  filename: string
  mediaType: 'image' | 'video'
  compressed: File
  thumbnail: File
  width: number
  height: number
  arthash: string
  arthashConfig: ArthashConfig
  exif?: PhotoExif
  private: boolean
}

export interface PhotoUpdatePayload {
  filename: string
  arthash: string
  arthashConfig?: ArthashConfig
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
  const photos = ref<Photo[]>([])
  const loading = shallowRef(false)
  const mutating = shallowRef(false)
  const error = shallowRef<string | null>(null)
  const page = shallowRef(1)
  const limit = shallowRef(24)
  const total = shallowRef(0)
  const totalPages = shallowRef(0)
  const search = shallowRef('')
  const visibility = shallowRef<'all' | 'public' | 'private'>('all')
  const mediaType = shallowRef<'all' | 'image' | 'video'>('all')

  async function loadPhotos(nextPage = page.value) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<PhotoListResponse>('/api/admin/photos', {
        cache: 'no-store',
        query: {
          page: nextPage,
          limit: limit.value,
          search: search.value || undefined,
          visibility: visibility.value,
          mediaType: mediaType.value,
          // Admin records are mutable. Keep a refresh from reusing a stale
          // browser/proxy response after an Arthash update.
          _ts: Date.now(),
        },
        headers: { 'Cache-Control': 'no-cache' },
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
        body: {
          filename: payload.filename,
          mediaType: payload.mediaType,
          originContentType: payload.file.type,
          ...variantContentTypes,
        },
      })
      uploadId = upload.id
      const uploads = await Promise.allSettled([
        uploadVariant(uploadId, 'origin', payload.file, payload.filename),
        uploadVariant(uploadId, 'compressed', payload.compressed, payload.filename),
        uploadVariant(uploadId, 'thumbnail', payload.thumbnail, payload.filename),
      ])
      const failedUpload = uploads.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      if (failedUpload) throw failedUpload.reason
      const photo = await $fetch<Photo>(`/api/admin/photo-uploads/${uploadId}/finalize`, {
        method: 'POST',
        body: {
          filename: payload.filename,
          mediaType: payload.mediaType,
          originContentType: payload.file.type,
          ...variantContentTypes,
          width: payload.width,
          height: payload.height,
          arthash: payload.arthash,
          arthashConfig: payload.arthashConfig,
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
          query: { filename: payload.filename, ...variantContentTypes },
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

  async function updatePhoto(id: string, update: PhotoUpdatePayload) {
    mutating.value = true
    error.value = null
    try {
      const photo = await $fetch<Photo>(`/api/admin/photos/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: update,
      })
      if (photo.arthash !== update.arthash.trim()) {
        throw new Error('服务端没有返回新的 Arthash，请部署最新管理接口并执行 0009 数据库迁移')
      }
      const currentPage = page.value
      photos.value = photos.value.map((item) => (item.id === id ? photo : item))
      await loadPhotos(currentPage)
      // Keep the PATCH response authoritative in case an intermediate proxy
      // still returns the previous list during cache propagation.
      photos.value = photos.value.map((item) => (item.id === id ? photo : item))
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
    mediaType,
    loadPhotos,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
  }
}
