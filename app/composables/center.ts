const space = 60

interface QuadrantSize {
  x: number
  y: number
}

export const QuadrantSizeConfig = ref<Record<string, QuadrantSize> | null>(null)

export const center = ref<QuadrantSize>({
  x: 0.5,
  y: 0.5,
})

export function initQuadrantSizeConfig() {
  onMounted(() => {
    const width = window.innerWidth
    const height = window.innerHeight

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

export function setQuadrantSize(quadrant: string) {
  const config = QuadrantSizeConfig.value![quadrant]
  if (config) {
    center.value.x = config.x
    center.value.y = config.y
  }
}
