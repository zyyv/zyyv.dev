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

watchEffect(() => {
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
  const config = QuadrantSizeConfig.value![quadrant]
  if (config) {
    center.value.x = config.x
    center.value.y = config.y
  }
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
