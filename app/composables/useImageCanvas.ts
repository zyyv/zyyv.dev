import type { CSSProperties } from 'vue'

const MIN_SCALE = 0.5
const MAX_SCALE = 8
const ZOOM_STEP = 1.25

interface PointerPosition {
  x: number
  y: number
}

export function useImageCanvas() {
  const canvasRef = useTemplateRef<HTMLElement>('imageCanvas')
  const imageRef = useTemplateRef<HTMLImageElement>('canvasImage')
  const scale = shallowRef(1)
  const offsetX = shallowRef(0)
  const offsetY = shallowRef(0)
  const isDragging = shallowRef(false)
  const pointers = new Map<number, PointerPosition>()

  let lastPointer: PointerPosition | null = null
  let lastPinchDistance = 0
  let lastPinchCenter: PointerPosition | null = null

  const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)
  const imageStyle = computed<CSSProperties>(() => ({
    transform: `translate3d(${offsetX.value}px, ${offsetY.value}px, 0) scale(${scale.value})`,
  }))

  function clampPan() {
    const canvas = canvasRef.value
    const image = imageRef.value
    if (!canvas || !image) return

    const overflowX = Math.max(0, (image.offsetWidth * scale.value - canvas.clientWidth) / 2)
    const overflowY = Math.max(0, (image.offsetHeight * scale.value - canvas.clientHeight) / 2)
    offsetX.value = Math.min(overflowX, Math.max(-overflowX, offsetX.value))
    offsetY.value = Math.min(overflowY, Math.max(-overflowY, offsetY.value))
  }

  function zoomTo(nextScale: number, clientX?: number, clientY?: number) {
    const canvas = canvasRef.value
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
    if (!canvas || clampedScale === scale.value) return

    const rect = canvas.getBoundingClientRect()
    const focusX = clientX === undefined ? 0 : clientX - (rect.left + rect.width / 2)
    const focusY = clientY === undefined ? 0 : clientY - (rect.top + rect.height / 2)
    const ratio = clampedScale / scale.value

    offsetX.value = focusX - (focusX - offsetX.value) * ratio
    offsetY.value = focusY - (focusY - offsetY.value) * ratio
    scale.value = clampedScale
    clampPan()
  }

  function zoomIn() {
    zoomTo(scale.value * ZOOM_STEP)
  }

  function zoomOut() {
    zoomTo(scale.value / ZOOM_STEP)
  }

  function resetCanvas() {
    scale.value = 1
    offsetX.value = 0
    offsetY.value = 0
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault()
    zoomTo(scale.value * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY)
  }

  function getPinchCenter(first: PointerPosition, second: PointerPosition): PointerPosition {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    }
  }

  function getPinchDistance(first: PointerPosition, second: PointerPosition): number {
    return Math.hypot(first.x - second.x, first.y - second.y)
  }

  function handlePointerDown(event: PointerEvent) {
    canvasRef.value?.setPointerCapture(event.pointerId)
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const positions = [...pointers.values()]

    if (positions.length === 1) {
      lastPointer = positions[0] ?? null
      isDragging.value = true
    } else if (positions.length === 2) {
      lastPinchDistance = getPinchDistance(positions[0]!, positions[1]!)
      lastPinchCenter = getPinchCenter(positions[0]!, positions[1]!)
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const positions = [...pointers.values()]

    if (positions.length === 1 && lastPointer) {
      const position = positions[0]!
      offsetX.value += position.x - lastPointer.x
      offsetY.value += position.y - lastPointer.y
      lastPointer = position
      clampPan()
      return
    }

    if (positions.length === 2 && lastPinchCenter) {
      const center = getPinchCenter(positions[0]!, positions[1]!)
      const distance = getPinchDistance(positions[0]!, positions[1]!)
      offsetX.value += center.x - lastPinchCenter.x
      offsetY.value += center.y - lastPinchCenter.y
      zoomTo(scale.value * (distance / lastPinchDistance), center.x, center.y)
      lastPinchDistance = distance
      lastPinchCenter = center
    }
  }

  function handlePointerEnd(event: PointerEvent) {
    pointers.delete(event.pointerId)
    const positions = [...pointers.values()]
    isDragging.value = positions.length > 0
    lastPointer = positions[0] ?? null

    if (positions.length === 2) {
      lastPinchDistance = getPinchDistance(positions[0]!, positions[1]!)
      lastPinchCenter = getPinchCenter(positions[0]!, positions[1]!)
    } else {
      lastPinchDistance = 0
      lastPinchCenter = null
    }
  }

  useResizeObserver(canvasRef, clampPan)

  return {
    canvasRef,
    imageRef,
    imageStyle,
    isDragging,
    zoomLabel,
    zoomIn,
    zoomOut,
    resetCanvas,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
  }
}
