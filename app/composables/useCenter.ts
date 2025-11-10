interface QuadrantSize {
  x: number
  y: number
}

const QuadrantSizeConfig = ref<Record<string, QuadrantSize> | null>(null)
const center = ref<QuadrantSize>({
  x: 0.5,
  y: 0.5,
})
const space = 60
const minx = ref(0)
const miny = ref(0)
const maxx = ref(1)
const maxy = ref(1)
const isAnimating = ref(false) // 添加动画状态标记

watchEffect(() => {
  // 在动画过程中不进行边界限制，避免干扰动画
  if (isAnimating.value)
    return

  if (center.value.x < minx.value) {
    center.value.x = minx.value
  }
  if (center.value.x > maxx.value) {
    center.value.x = maxx.value
  }
  if (center.value.y < miny.value) {
    center.value.y = miny.value
  }
  if (center.value.y > maxy.value) {
    center.value.y = maxy.value
  }
})

function initQuadrantSizeConfig() {
  onMounted(() => {
    const width = window.innerWidth
    const height = window.innerHeight

    minx.value = space / width
    miny.value = space / height
    maxx.value = (width - space) / width
    maxy.value = (height - space) / height

    QuadrantSizeConfig.value = {
      II: {
        x: (width - space) / width,
        y: (height - space) / height,
      },
      I: {
        x: space / width,
        y: (height - space) / height,
      },
      III: {
        x: (width - space) / width,
        y: space / height,
      },
      IV: {
        x: space / width,
        y: space / height,
      },
      center: {
        x: 0.5,
        y: 0.5,
      },
    }
  })
}

function setQuadrantSize(quadrant: string) {
  const config = QuadrantSizeConfig.value?.[quadrant]
  if (!config)
    return

  // 使用平滑动画过渡
  const startX = center.value.x
  const startY = center.value.y
  const targetX = config.x
  const targetY = config.y
  const duration = 300 // 动画持续时间（毫秒）
  const startTime = Date.now()

  isAnimating.value = true // 开始动画

  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用 easeInOutCubic 缓动函数，让动画更流畅
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - (-2 * progress + 2) ** 3 / 2

    center.value.x = startX + (targetX - startX) * eased
    center.value.y = startY + (targetY - startY) * eased

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
    else {
      isAnimating.value = false // 动画结束
    }
  }

  requestAnimationFrame(animate)
}

export function useCenter() {
  return {
    center,
    minx: readonly(minx),
    miny: readonly(miny),
    maxx: readonly(maxx),
    maxy: readonly(maxy),
    initQuadrantSizeConfig,
    setQuadrantSize,
    setCenter: (x: number, y: number) => {
      center.value.x = x
      center.value.y = y
    },
  }
}
