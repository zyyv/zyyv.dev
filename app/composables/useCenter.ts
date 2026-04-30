interface QuadrantSize {
  x: number
  y: number
}

const quadrantScrollOrder = ['II', 'I', 'IV', 'III']
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

    center.value = { ...QuadrantSizeConfig.value.II }
  })
}

function getQuadrantSize(quadrant: string) {
  return QuadrantSizeConfig.value?.[quadrant]
}

function getQuadrantScrollProgress() {
  const points = quadrantScrollOrder
    .map(quadrant => QuadrantSizeConfig.value?.[quadrant])
    .filter(Boolean) as QuadrantSize[]

  if (points.length < 2)
    return 0

  let closestProgress = 0
  let closestDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]!
    const end = points[i + 1]!
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lengthSquared = dx * dx + dy * dy
    const rawT = lengthSquared === 0
      ? 0
      : ((center.value.x - start.x) * dx + (center.value.y - start.y) * dy) / lengthSquared
    const t = Math.max(0, Math.min(1, rawT))
    const projectedX = start.x + dx * t
    const projectedY = start.y + dy * t
    const distance = (center.value.x - projectedX) ** 2 + (center.value.y - projectedY) ** 2

    if (distance < closestDistance) {
      closestDistance = distance
      closestProgress = i + t
    }
  }

  return closestProgress
}

function setQuadrantScrollProgress(progress: number) {
  const points = quadrantScrollOrder
    .map(quadrant => QuadrantSizeConfig.value?.[quadrant])
    .filter(Boolean) as QuadrantSize[]

  if (points.length < 2)
    return

  const maxProgress = points.length - 1
  const clampedProgress = Math.max(0, Math.min(maxProgress, progress))
  const index = Math.min(Math.floor(clampedProgress), points.length - 2)
  const t = clampedProgress - index
  const start = points[index]!
  const end = points[index + 1]!

  center.value.x = start.x + (end.x - start.x) * t
  center.value.y = start.y + (end.y - start.y) * t
}

function setQuadrantSize(quadrant: string) {
  const config = getQuadrantSize(quadrant)
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
    quadrantScrollOrder,
    getQuadrantScrollProgress,
    setQuadrantScrollProgress,
    setQuadrantSize,
    setCenter: (x: number, y: number) => {
      center.value.x = x
      center.value.y = y
    },
  }
}
