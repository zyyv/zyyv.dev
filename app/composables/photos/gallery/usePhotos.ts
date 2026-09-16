import type { Photo, PhotoListResponse } from '~/types'
import type { MaybeRefOrGetter } from 'vue'

const PHOTO_PAGE_SIZE = 24

interface PhotosPayload {
  photos: Photo[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    count: number
  }
}

interface PublicPhotosOptions {
  // Allow callers to opt into non-blocking or client-only fetching.
  lazy?: boolean
  server?: boolean
  all?: boolean
  limit?: number
}

export function usePublicPhotos(options: PublicPhotosOptions = {}) {
  const endpoint =
    import.meta.dev && import.meta.server ? 'https://zyyv.dev/api/photos' : '/api/photos'
  const all = options.all ?? true
  const limit = Math.max(1, Math.min(50, options.limit ?? 24))

  return useFetch<PhotoListResponse>(endpoint, {
    key: all ? 'public-photos' : `public-photos-${limit}`,
    query: all ? { all: '1' } : { page: 1, limit },
    default: () => ({
      photos: [],
      pagination: { page: 1, limit: 0, total: 0, totalPages: 0 },
    }),
    dedupe: 'defer',
    lazy: options.lazy ?? false,
    server: options.server ?? true,
  })
}

function createPhotosPayload(photos: readonly Photo[], page: number, limit: number): PhotosPayload {
  const offset = (page - 1) * limit
  const total = photos.length
  const totalPages = Math.ceil(total / limit)
  const pagePhotos = photos.slice(offset, offset + limit)

  return {
    photos: pagePhotos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      count: pagePhotos.length,
    },
  }
}

export function usePhotos(initialPhotos: MaybeRefOrGetter<readonly Photo[]> = []) {
  const loading = shallowRef(false)
  const currentPage = shallowRef(1)
  const allPhotos = shallowRef<Photo[]>([])
  const sourcePhotos = computed(() => toValue(initialPhotos))
  const error = shallowRef<string | null>(null)

  async function getPhotosPayload(page: number): Promise<PhotosPayload> {
    return createPhotosPayload(sourcePhotos.value, page, PHOTO_PAGE_SIZE)
  }

  // 加载照片数据
  async function loadPhotos(page = 1, append = false) {
    if (loading.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await getPhotosPayload(page)

      if (response?.photos) {
        if (append) {
          allPhotos.value = [...allPhotos.value, ...response.photos]
        } else {
          allPhotos.value = response.photos
        }

        currentPage.value = page
      }
    } catch (err: any) {
      console.error('Failed to load photos:', err)
      error.value = err.message || '加载照片失败，请稍后重试'

      // 如果是网络错误或 404，设置友好的错误信息
      if (err.status === 404) {
        error.value = 'API 接口未找到，请检查服务器配置'
      } else if (err.status >= 500) {
        error.value = '服务器错误，请稍后重试'
      }
    } finally {
      loading.value = false
    }
  }

  // 加载更多数据
  async function loadMore() {
    if (!hasMore.value || loading.value) {
      return
    }

    await loadPhotos(currentPage.value + 1, true)
  }

  // 监听滚动事件
  function handleScroll(event: Event) {
    const scrollContainer = event.currentTarget

    if (!(scrollContainer instanceof HTMLElement) || loading.value || !hasMore.value) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const threshold = 200 // 距离底部200px时开始加载

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      void loadMore()
    }
  }

  // 计算每张照片在瀑布流中的高度
  function calcItemHeight(item: Photo, itemWidth: number) {
    if (!item.width || !item.height) {
      return 250
    }

    const aspectRatio = item.height / item.width
    return Math.round(itemWidth * aspectRatio)
  }

  // 重置数据
  function resetPhotos() {
    allPhotos.value = []
    currentPage.value = 1
    loading.value = false
  }

  function syncPhotos(photos: readonly Photo[]) {
    allPhotos.value = photos.slice(0, PHOTO_PAGE_SIZE)
    currentPage.value = 1
    error.value = null
  }

  // 初始加载
  function initPhotos() {
    loadPhotos(1)
  }

  // 刷新照片列表
  async function refreshPhotos() {
    resetPhotos()
    await loadPhotos(1)
  }

  watch(sourcePhotos, syncPhotos, { immediate: true })

  // 获取照片总数
  const hasMore = computed(() => allPhotos.value.length < sourcePhotos.value.length)
  const totalPhotos = computed(() => sourcePhotos.value.length)

  // 检查是否为空状态
  const isEmpty = computed(() => !loading.value && allPhotos.value.length === 0)

  return {
    // 状态
    loading: readonly(loading),
    error: readonly(error),
    allPhotos,
    hasMore: readonly(hasMore),
    totalPhotos: readonly(totalPhotos),
    isEmpty: readonly(isEmpty),
    // 方法
    loadPhotos,
    loadMore,
    handleScroll,
    calcItemHeight,
    resetPhotos,
    initPhotos,
    refreshPhotos,
  }
}
