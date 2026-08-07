import type { Bookmark, BookmarkInput, BookmarkListResponse } from '~/types'

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const value = error as {
      data?: { statusMessage?: string; message?: string }
      statusMessage?: string
      message?: string
    }
    return (
      value.data?.statusMessage ||
      value.data?.message ||
      value.statusMessage ||
      value.message ||
      '请求失败，请稍后重试'
    )
  }
  return '请求失败，请稍后重试'
}

export function useBookmarks() {
  const bookmarks = ref<Bookmark[]>([])
  const loading = shallowRef(true)
  const mutating = shallowRef(false)
  const isAdmin = shallowRef(false)
  const error = shallowRef<string | null>(null)

  async function loadBookmarks() {
    loading.value = true
    error.value = null
    try {
      const session = await $fetch<{ authenticated: boolean }>('/api/admin/session').catch(() => ({
        authenticated: false,
      }))
      isAdmin.value = session.authenticated
      const path = isAdmin.value ? '/api/admin/bookmarks' : '/api/bookmarks'
      const response = await $fetch<BookmarkListResponse>(path)
      bookmarks.value = response.bookmarks
    } catch (cause) {
      error.value = getErrorMessage(cause)
    } finally {
      loading.value = false
    }
  }

  async function createBookmark(input: BookmarkInput) {
    mutating.value = true
    error.value = null
    try {
      await $fetch('/api/admin/bookmarks', { method: 'POST', body: input })
      await loadBookmarks()
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
      await $fetch(`/api/admin/bookmarks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      })
      await loadBookmarks()
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
      await loadBookmarks()
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      mutating.value = false
    }
  }

  return {
    bookmarks: readonly(bookmarks),
    loading: readonly(loading),
    mutating: readonly(mutating),
    isAdmin: readonly(isAdmin),
    error: readonly(error),
    loadBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
  }
}
