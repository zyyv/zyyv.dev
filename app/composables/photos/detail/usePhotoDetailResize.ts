import { computed, onBeforeUnmount, shallowRef, toValue, watch } from 'vue'
import { useElementSize, useEventListener, useMediaQuery, useStorage } from '@vueuse/core'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'

const STORAGE_KEY = 'zyyv-photo-detail-details-ratio'
const DEFAULT_RATIO = 0.19
const MIN_RATIO = 0.16
const MAX_RATIO = 0.48
const MIN_DETAILS_WIDTH = 256
const MAX_DETAILS_WIDTH = 512

interface ResizeStart {
  pointerId: number
  startX: number
  startRatio: number
  bodyWidth: number
}

interface UsePhotoDetailResizeOptions {
  body: Readonly<ShallowRef<HTMLElement | null>>
  enabled: MaybeRefOrGetter<boolean>
}

export function usePhotoDetailResize(options: UsePhotoDetailResizeOptions) {
  const isDesktop = useMediaQuery('(min-width: 768px) and (pointer: fine)')
  const storedRatio = useStorage(STORAGE_KEY, DEFAULT_RATIO)
  const activeRatio = shallowRef<number | null>(null)
  const isResizing = shallowRef(false)
  const resizeStart = shallowRef<ResizeStart | null>(null)
  const { width: bodyWidth } = useElementSize(options.body)

  const ratioBounds = computed(() => getRatioBounds(bodyWidth.value))
  const detailsRatio = computed(() =>
    clampRatio(activeRatio.value ?? normalizeRatio(storedRatio.value), ratioBounds.value),
  )
  const ratioPercent = computed(() => Math.round(detailsRatio.value * 100))
  const minRatioPercent = computed(() => Math.round(ratioBounds.value.min * 100))
  const maxRatioPercent = computed(() => Math.round(ratioBounds.value.max * 100))

  function beginResize(event: PointerEvent) {
    if (
      !isDesktop.value ||
      !toValue(options.enabled) ||
      event.button !== 0 ||
      resizeStart.value ||
      !options.body.value
    )
      return

    const width = options.body.value.getBoundingClientRect().width
    if (width <= 0) return

    event.preventDefault()
    resizeStart.value = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startRatio: clampRatio(detailsRatio.value, getRatioBounds(width)),
      bodyWidth: width,
    }
    activeRatio.value = resizeStart.value.startRatio
    isResizing.value = true
    options.body.value.setPointerCapture?.(event.pointerId)
  }

  function updateResize(event: PointerEvent) {
    const start = resizeStart.value
    if (!start || start.pointerId !== event.pointerId) return

    event.preventDefault()
    const nextRatio = start.startRatio + (start.startX - event.clientX) / start.bodyWidth
    activeRatio.value = clampRatio(nextRatio, getRatioBounds(start.bodyWidth))
  }

  function endResize(event: PointerEvent) {
    if (!resizeStart.value || resizeStart.value.pointerId !== event.pointerId) return
    finishResize()
  }

  function finishResize() {
    if (!resizeStart.value) return
    if (activeRatio.value !== null) storedRatio.value = activeRatio.value
    resizeStart.value = null
    activeRatio.value = null
    isResizing.value = false
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isDesktop.value || !toValue(options.enabled) || !options.body.value) return

    const { min, max } = getRatioBounds(options.body.value.getBoundingClientRect().width)
    const currentRatio = clampRatio(detailsRatio.value, { min, max })
    let nextRatio: number | null = null
    const step = 0.02

    if (event.key === 'ArrowLeft') nextRatio = currentRatio + step
    if (event.key === 'ArrowRight') nextRatio = currentRatio - step
    if (event.key === 'Home') nextRatio = min
    if (event.key === 'End') nextRatio = max
    if (nextRatio === null) return

    event.preventDefault()
    storedRatio.value = clampRatio(nextRatio, { min, max })
  }

  useEventListener('pointermove', updateResize)
  useEventListener('pointerup', endResize)
  useEventListener('pointercancel', finishResize)
  watch([isDesktop, () => toValue(options.enabled)], ([desktop, enabled]) => {
    if (!desktop || !enabled) finishResize()
  })
  onBeforeUnmount(finishResize)

  return {
    isDesktop,
    isResizing,
    detailsRatio,
    ratioPercent,
    minRatioPercent,
    maxRatioPercent,
    beginResize,
    handleKeydown,
    finishResize,
  }
}

function normalizeRatio(value: number) {
  return Number.isFinite(value) ? Math.min(MAX_RATIO, Math.max(MIN_RATIO, value)) : DEFAULT_RATIO
}

function getRatioBounds(width: number) {
  if (width <= 0) return { min: MIN_RATIO, max: MAX_RATIO }

  const min = Math.max(MIN_RATIO, MIN_DETAILS_WIDTH / width)
  const max = Math.min(MAX_RATIO, MAX_DETAILS_WIDTH / width)
  return { min, max: Math.max(min, max) }
}

function clampRatio(value: number, bounds: { min: number; max: number }) {
  return Math.min(bounds.max, Math.max(bounds.min, normalizeRatio(value)))
}
