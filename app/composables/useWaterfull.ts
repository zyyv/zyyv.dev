import { Card } from '#components'

// 计算真实高度，这里只计算除了图片的高度
function getRealHeight(item: ItemOption, realWidth: number) {
  const dom = document.createElement('div')

  render(
    h(Card, {
      item,
      width: `${realWidth}px`,
      noImage: true,
    }),
    dom,
  )

  document.body.appendChild(dom)

  // 获取高度
  const height: number = dom.firstElementChild?.clientHeight ?? 0

  // 移除新容器
  document.body.removeChild(dom)
  // 返回高度
  return height
}

function useWaterfall() {
  const setAppStyle = () => {
    document.body.style.height = `${window.innerHeight}px`
    if (window.innerWidth > 640) {

    }
  }

  // 瀑布流的一些属性
  const waterfallOption = reactive({
    loading: false,
    bottomDistance: 0,
    // 是否只展示图片，这是自定义加的一个属性
    onlyImage: false,

    preloadScreenCount: [1, 0] as [number, number],
    virtual: true,
    gap: 15,
    itemMinWidth: 220,
    minColumnCount: 2,
    maxColumnCount: 10,
  })

  // 瀑布流元素高度的计算函数
  const calcItemHeight = (item: ItemOption, itemWidth: number) => {
    let height = 0
    // 当包含图文时，需要单独计算文字部分的高度
    // 文字部分的高度 + 图片的高度 = 真实高度
    if (!waterfallOption.onlyImage) {
      height = getRealHeight(item, itemWidth)
    }
    return item.height * (itemWidth / item.width) + height
  }

  const page = reactive({
    page: 1,
    size: 20,
    mode: 'simple',
  })

  const result = reactive({
    list: [] as any[],
    end: false,
  })

  const { data, status } = useFetch<any>('https://mock.tatakai.top/images', {
    query: page,
  })

  watchEffect(() => {
    if (data.value) {
      // 将获取到的数据追加到列表中
      result.list.push(...(data.value.list as any[]))
      result.end = false
    }
    else {
      result.end = true
    }
  })

  // 检查是否加载更多
  const checkScrollPosition = async () => {
    if (waterfallOption.loading || status.value === 'pending' || result.end) {
      return
    }

    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = window.innerHeight

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // 不大于最小底部距离就加载更多
    if (distanceFromBottom <= waterfallOption.bottomDistance) {
      waterfallOption.loading = true
      page.page += 1
      waterfallOption.loading = false
    }
  }

  onMounted(async () => {
    // 设置body高度
    setAppStyle()
    window.addEventListener('resize', useDebounceFn(setAppStyle, 125))
    window.addEventListener('scroll', useDebounceFn(checkScrollPosition, 125))
  })

  onUnmounted(() => {
    window.removeEventListener('resize', useDebounceFn(setAppStyle, 125))
    window.removeEventListener(
      'scroll',
      useDebounceFn(checkScrollPosition, 125),
    )
  })

  return {
    waterfallOption,
    result,
    calcItemHeight,
  }
}

export default useWaterfall
