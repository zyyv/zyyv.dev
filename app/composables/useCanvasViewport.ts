import type { BookmarkCanvasBounds } from '~/utils/bookmarkCanvas'
import type { Ref, ShallowRef } from 'vue'

interface CanvasPoint {
  x: number
  y: number
}

interface UseCanvasViewportOptions {
  viewport: Readonly<ShallowRef<HTMLElement | null>>
  surface: Readonly<ShallowRef<HTMLElement | null>>
  contentWidth: Readonly<Ref<number>>
  contentHeight: Readonly<Ref<number>>
}

export function useCanvasViewport(options: UseCanvasViewportOptions) {
  const scale = shallowRef(1)
  const scaleLabel = computed(() => `${Math.round(scale.value * 100)}%`)
  const isOverview = computed(() => scale.value < 0.36)
  const bounds = shallowRef<BookmarkCanvasBounds | null>(null)
  let x = 0
  let y = 0
  let dragOrigin: CanvasPoint | null = null
  let panOrigin: CanvasPoint | null = null
  let pointerId: number | null = null
  let boundsTimer: ReturnType<typeof setTimeout> | null = null

  function updateBounds() {
    boundsTimer = null
    const viewport = options.viewport.value
    if (!viewport) return
    const buffer = 460
    bounds.value = {
      left: -x / scale.value - buffer,
      top: -y / scale.value - buffer,
      right: (viewport.clientWidth - x) / scale.value + buffer,
      bottom: (viewport.clientHeight - y) / scale.value + buffer,
    }
  }

  function scheduleBoundsUpdate() {
    if (boundsTimer) return
    boundsTimer = setTimeout(updateBounds, 72)
  }

  function render() {
    if (!options.surface.value) return
    options.surface.value.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale.value})`
    scheduleBoundsUpdate()
  }

  function fit(minimumScale = 0.18) {
    const viewport = options.viewport.value
    if (!viewport) return
    const padding = viewport.clientWidth < 700 ? 76 : 130
    const availableWidth = Math.max(1, viewport.clientWidth - padding)
    const availableHeight = Math.max(1, viewport.clientHeight - padding)
    scale.value = Math.min(
      1,
      Math.max(
        minimumScale,
        Math.min(
          availableWidth / options.contentWidth.value,
          availableHeight / options.contentHeight.value,
        ),
      ),
    )
    x = (viewport.clientWidth - options.contentWidth.value * scale.value) / 2
    y = (viewport.clientHeight - options.contentHeight.value * scale.value) / 2
    render()
  }

  function zoom(nextScale: number, origin?: CanvasPoint) {
    const viewport = options.viewport.value
    if (!viewport) return
    const bounded = Math.min(1.75, Math.max(0.045, nextScale))
    const point = origin || { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 }
    const contentX = (point.x - x) / scale.value
    const contentY = (point.y - y) / scale.value
    scale.value = bounded
    x = point.x - contentX * bounded
    y = point.y - contentY * bounded
    render()
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault()
    const rect = options.viewport.value?.getBoundingClientRect()
    if (!rect) return
    const factor = Math.exp(-event.deltaY * 0.0013)
    zoom(scale.value * factor, { x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-canvas-node]')) return
    pointerId = event.pointerId
    dragOrigin = { x: event.clientX, y: event.clientY }
    panOrigin = { x, y }
    options.viewport.value?.setPointerCapture(event.pointerId)
    options.viewport.value?.classList.add('is-dragging')
  }

  function onPointerMove(event: PointerEvent) {
    if (pointerId !== event.pointerId || !dragOrigin || !panOrigin) return
    x = panOrigin.x + event.clientX - dragOrigin.x
    y = panOrigin.y + event.clientY - dragOrigin.y
    render()
  }

  function onPointerUp(event: PointerEvent) {
    if (pointerId !== event.pointerId) return
    pointerId = null
    dragOrigin = null
    panOrigin = null
    options.viewport.value?.classList.remove('is-dragging')
  }

  const fitDefault = () => fit(0.18)
  const fitAll = () => fit(0.035)

  watch([options.contentWidth, options.contentHeight], () => nextTick(fitDefault), {
    immediate: true,
  })
  useResizeObserver(options.viewport, fitDefault)
  onBeforeUnmount(() => {
    if (boundsTimer) clearTimeout(boundsTimer)
  })

  return {
    bounds: readonly(bounds),
    isOverview,
    scaleLabel,
    fit: fitAll,
    zoomIn: () => zoom(scale.value * 1.2),
    zoomOut: () => zoom(scale.value / 1.2),
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
