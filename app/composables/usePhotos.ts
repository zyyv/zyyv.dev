import type { Photo } from '~/types'

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

function createPhotosPayload(photos: Photo[], page: number, limit: number): PhotosPayload {
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

export function usePhotos(initialPhotos: Photo[] = []) {
  // 加载状态
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(24)
  const allPhotos = ref<Photo[]>([]) // 存储所有已加载的照片
  const sourcePhotos = ref<Photo[]>(initialPhotos)
  const hasMore = ref(true) // 是否还有更多数据
  const error = ref<string | null>(null) // 错误状态

  async function getPhotosPayload(page: number): Promise<PhotosPayload> {
    if (!sourcePhotos.value.length) {
      const response = await fetch('/api/photos-data.json')
      if (!response.ok)
        throw new Error(`Failed to load photos: ${response.status}`)
      sourcePhotos.value = await response.json() as Photo[]
    }

    return createPhotosPayload(sourcePhotos.value, page, pageSize.value)
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
          allPhotos.value.push(...response.photos)
        }
        else {
          allPhotos.value = response.photos
        }

        hasMore.value = response.pagination?.hasNext || false
      }
    }
    catch (err: any) {
      console.error('Failed to load photos:', err)
      error.value = err.message || '加载照片失败，请稍后重试'

      // 如果是网络错误或 404，设置友好的错误信息
      if (err.status === 404) {
        error.value = 'API 接口未找到，请检查服务器配置'
      }
      else if (err.status >= 500) {
        error.value = '服务器错误，请稍后重试'
      }
    }
    finally {
      loading.value = false
    }
  }

  // 加载更多数据
  async function loadMore() {
    if (!hasMore.value || loading.value) {
      return
    }

    currentPage.value++
    await loadPhotos(currentPage.value, true)
  }

  // 滚动容器引用
  const scrollContainer = ref<HTMLElement>()

  // 监听滚动事件
  function handleScroll() {
    if (!scrollContainer.value || loading.value || !hasMore.value) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
    const threshold = 200 // 距离底部200px时开始加载

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadMore()
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
    hasMore.value = sourcePhotos.value.length
      ? sourcePhotos.value.length > pageSize.value
      : true
    loading.value = false
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

  // 获取照片总数
  const totalPhotos = computed(() => allPhotos.value.length)

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
    scrollContainer,

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
