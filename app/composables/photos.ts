import type { Photo } from '~/types'

export function usePhotos() {
  // 加载状态
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(24)
  const allPhotos = ref<Photo[]>([]) // 存储所有已加载的照片
  const hasMore = ref(true) // 是否还有更多数据

  // 加载照片数据
  async function loadPhotos(page = 1, append = false) {
    if (loading.value) {
      return
    }

    loading.value = true

    try {
      const response = await $fetch('/api/photos', {
        query: {
          page,
          limit: pageSize.value,
        },
      }) as any

      if (response?.photos) {
        const newPhotos: Photo[] = response.photos.map((photo: Photo) => ({
          id: photo.filename,
          filename: photo.filename,
          path: photo.path,
          size: photo.size,
          width: photo.width || 300,
          height: photo.height || 200,
          blurhash: photo.blurhash,
          createdAt: photo.createdAt,
          modifiedAt: photo.modifiedAt,
        }))

        if (append) {
          allPhotos.value.push(...newPhotos)
        }
        else {
          allPhotos.value = newPhotos
        }

        hasMore.value = response.pagination?.hasNext || false
      }
    }
    catch (error) {
      console.error('Failed to load photos:', error)
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
    hasMore.value = true
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
