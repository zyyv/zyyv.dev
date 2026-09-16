import type { Bookmark, BookmarkInput, BookmarkListResponse } from '~/types'

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

export function useAdminBookmarks() {
  const bookmarks = ref<Bookmark[]>([])
  const loading = shallowRef(false)
  const mutating = shallowRef(false)
  const error = shallowRef<string | null>(null)

  async function loadBookmarks() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<BookmarkListResponse>('/api/admin/bookmarks')
      bookmarks.value = response.bookmarks
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function createBookmark(input: BookmarkInput) {
    mutating.value = true
    error.value = null
    try {
      const bookmark = await $fetch<Bookmark>('/api/admin/bookmarks', {
        method: 'POST',
        body: input,
      })
      await loadBookmarks()
      return bookmark
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  async function updateBookmark(id: string, input: BookmarkInput) {
    mutating.value = true
    error.value = null
    try {
      const bookmark = await $fetch<Bookmark>(`/api/admin/bookmarks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      })
      bookmarks.value = bookmarks.value.map((item) => (item.id === id ? bookmark : item))
      await loadBookmarks()
      return bookmark
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  async function deleteBookmark(id: string) {
    mutating.value = true
    error.value = null
    try {
      await $fetch(`/api/admin/bookmarks/${encodeURIComponent(id)}`, { method: 'DELETE' })
      bookmarks.value = bookmarks.value.filter((item) => item.id !== id)
      await loadBookmarks()
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  return {
    bookmarks,
    loading,
    mutating,
    error,
    loadBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
  }
}
