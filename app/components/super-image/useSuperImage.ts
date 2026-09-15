import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  readonly,
  shallowRef,
  toValue,
  watch,
} from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { markSuperImageLoaded, preloadSuperImage } from './super-image-cache'
import type { SuperImageMode, SuperImageResources } from './types'
import type { SuperImageResourceStatus } from './super-image-cache'

interface UseSuperImageOptions {
  element: Ref<HTMLElement | null>
  loading: MaybeRefOrGetter<'lazy' | 'eager'>
  progressive: MaybeRefOrGetter<boolean>
  fetchPriority: MaybeRefOrGetter<'high' | 'low' | 'auto' | undefined>
}

const imageModes: SuperImageMode[] = ['thumbnail', 'compressed', 'origin']

function normalizeSource(source: string | null | undefined): string {
  return source?.trim() ?? ''
}

export function useSuperImage(
  resources: MaybeRefOrGetter<SuperImageResources>,
  requestedMode: Ref<SuperImageMode>,
  options: UseSuperImageOptions,
) {
  const activeMode = shallowRef<SuperImageMode>('arthash')
  const visible = shallowRef(false)
  const mounted = shallowRef(false)
  const progressiveEnabled = shallowRef(toValue(options.progressive))
  const initialPreloadStarted = shallowRef(false)
  const statuses = reactive<Record<SuperImageMode, SuperImageResourceStatus>>({
    arthash: 'idle',
    thumbnail: 'idle',
    compressed: 'idle',
    origin: 'idle',
  })
  const pending = new Map<SuperImageMode, Promise<boolean>>()
  let observer: IntersectionObserver | undefined
  let runId = 0

  const normalizedResources = computed(() => {
    const value = toValue(resources)
    return {
      arthash: normalizeSource(value.arthash),
      thumbnail: normalizeSource(value.thumbnail),
      compressed: normalizeSource(value.compressed),
      origin: normalizeSource(value.origin),
    }
  })

  const activeSource = computed(() => normalizedResources.value[activeMode.value])
  const hasVisibleAsset = computed(
    () => activeMode.value !== 'arthash' && Boolean(activeSource.value),
  )

  function resetStatuses() {
    for (const mode of imageModes) statuses[mode] = 'idle'
    statuses.arthash = normalizedResources.value.arthash ? 'loaded' : 'error'
    pending.clear()
  }

  function priorityFor(mode: SuperImageMode) {
    const explicitPriority = toValue(options.fetchPriority)
    if (explicitPriority) return explicitPriority
    if (mode === 'thumbnail') return 'low' as const
    return 'high' as const
  }

  function activateLoadedMode(mode: SuperImageMode) {
    if (requestedMode.value === mode && statuses[mode] === 'loaded') {
      activeMode.value = mode
      return
    }

    if (!progressiveEnabled.value || requestedMode.value !== 'arthash') return
    if (mode === 'compressed' && statuses.compressed === 'loaded') {
      activeMode.value = mode
      return
    }
    if (
      mode === 'thumbnail' &&
      activeMode.value === 'arthash' &&
      statuses.compressed !== 'loaded'
    ) {
      activeMode.value = mode
    }
  }

  async function loadMode(mode: SuperImageMode, expectedRun = runId): Promise<boolean> {
    if (mode === 'arthash') return Boolean(normalizedResources.value.arthash)
    if (expectedRun !== runId) return false

    const source = normalizedResources.value[mode]
    if (!source) {
      statuses[mode] = 'error'
      return false
    }
    if (statuses[mode] === 'loaded') {
      activateLoadedMode(mode)
      return true
    }

    const existing = pending.get(mode)
    if (existing) return existing

    statuses[mode] = 'loading'
    const request = preloadSuperImage(source, {
      fetchPriority: priorityFor(mode),
    }).then((loaded) => {
      if (expectedRun !== runId) return loaded
      statuses[mode] = loaded ? 'loaded' : 'error'
      if (loaded) {
        markSuperImageLoaded(source)
        activateLoadedMode(mode)
      }
      return loaded
    })

    pending.set(mode, request)
    void request.finally(() => {
      if (pending.get(mode) === request) pending.delete(mode)
    })
    return request
  }

  function startInitialPreload() {
    if (!mounted.value || !visible.value || initialPreloadStarted.value) return
    initialPreloadStarted.value = true
    const currentRun = runId

    // Both lightweight variants intentionally start in the same turn. The
    // completion handler promotes compressed over thumbnail when it wins.
    void loadMode('thumbnail', currentRun)
    void loadMode('compressed', currentRun)
  }

  function observeVisibility() {
    if (toValue(options.loading) === 'eager') {
      visible.value = true
      startInitialPreload()
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      visible.value = true
      startInitialPreload()
      return
    }

    const target = options.element.value
    if (!target) return
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        visible.value = true
        observer?.disconnect()
        observer = undefined
        startInitialPreload()
      },
      { rootMargin: '200px' },
    )
    observer.observe(target)
  }

  function markNativeImageLoaded(source: string) {
    if (!source) return
    markSuperImageLoaded(source)
    const mode = imageModes.find((candidate) => normalizedResources.value[candidate] === source)
    if (mode) statuses[mode] = 'loaded'
  }

  function markNativeImageError(source: string) {
    if (!source) return
    const mode = imageModes.find((candidate) => normalizedResources.value[candidate] === source)
    if (mode && statuses[mode] !== 'loaded') statuses[mode] = 'error'
  }

  watch(
    () => [
      normalizedResources.value.arthash,
      normalizedResources.value.thumbnail,
      normalizedResources.value.compressed,
      normalizedResources.value.origin,
    ],
    () => {
      runId += 1
      activeMode.value = 'arthash'
      initialPreloadStarted.value = false
      resetStatuses()
      if (!mounted.value) return

      if (toValue(options.loading) === 'eager') visible.value = true
      startInitialPreload()
      if (requestedMode.value !== 'arthash') void loadMode(requestedMode.value)
    },
    { immediate: true },
  )

  watch(
    requestedMode,
    (mode, previousMode) => {
      if (mode === 'arthash') {
        activeMode.value = 'arthash'
        if (previousMode !== undefined) progressiveEnabled.value = false
        return
      }

      progressiveEnabled.value = false
      void loadMode(mode)
    },
    { immediate: true },
  )

  watch(
    () => toValue(options.progressive),
    (enabled) => {
      progressiveEnabled.value = enabled
      if (enabled && requestedMode.value === 'arthash') {
        startInitialPreload()
      }
    },
  )

  watch(
    () => toValue(options.loading),
    (loading) => {
      if (loading === 'eager') {
        visible.value = true
        startInitialPreload()
      }
    },
  )

  onMounted(() => {
    mounted.value = true
    observeVisibility()
    if (requestedMode.value !== 'arthash') void loadMode(requestedMode.value)
  })

  onBeforeUnmount(() => {
    runId += 1
    observer?.disconnect()
    observer = undefined
  })

  return {
    activeMode: readonly(activeMode),
    activeSource,
    hasVisibleAsset,
    statuses: readonly(statuses),
    isVisible: readonly(visible),
    preload: loadMode,
    markNativeImageLoaded,
    markNativeImageError,
  }
}
