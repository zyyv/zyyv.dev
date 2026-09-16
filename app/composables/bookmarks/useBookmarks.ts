import type { Bookmark, BookmarkListResponse } from '~/types'

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
  const error = shallowRef<string | null>(null)

  async function loadBookmarks() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<BookmarkListResponse>('/api/bookmarks')
      bookmarks.value = response.bookmarks
    } catch (cause) {
      error.value = getErrorMessage(cause)
    } finally {
      loading.value = false
    }
  }

  return {
    bookmarks: readonly(bookmarks),
    loading: readonly(loading),
    error: readonly(error),
    loadBookmarks,
  }
}
