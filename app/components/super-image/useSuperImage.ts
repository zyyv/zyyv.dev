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
import {
  forgetSuperImage,
  isSuperImageCached,
  markSuperImageLoaded,
  preloadSuperImage,
} from './super-image-cache'
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

function normalizeResources(value: SuperImageResources) {
  return {
    arthash: normalizeSource(value.arthash),
    thumbnail: normalizeSource(value.thumbnail),
    compressed: normalizeSource(value.compressed),
    origin: normalizeSource(value.origin),
  }
}

export function useSuperImage(
  resources: MaybeRefOrGetter<SuperImageResources>,
  requestedMode: Ref<SuperImageMode>,
  options: UseSuperImageOptions,
) {
  const visible = shallowRef(false)
  const mounted = shallowRef(false)
  const resourceVersion = shallowRef(0)
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
    return normalizeResources(toValue(resources))
  })

  function isResourceCached(source: string) {
    return isSuperImageCached(source)
  }

  function getInitialMode(value: typeof normalizedResources.value, requested: SuperImageMode) {
    if (requested !== 'arthash' && isResourceCached(value[requested])) return requested
    if ((requested === 'origin' || requested === 'arthash') && isResourceCached(value.compressed)) {
      return 'compressed'
    }
    if (
      (requested === 'origin' || requested === 'compressed' || requested === 'arthash') &&
      isResourceCached(value.thumbnail)
    ) {
      return 'thumbnail'
    }
    return 'arthash'
  }

  const activeMode = shallowRef<SuperImageMode>(
    getInitialMode(normalizedResources.value, requestedMode.value),
  )

  const activeSource = computed(() => normalizedResources.value[activeMode.value])
  const hasImageResource = computed(() =>
    Boolean(
      normalizedResources.value.thumbnail ||
      normalizedResources.value.compressed ||
      normalizedResources.value.origin,
    ),
  )
  const hasVisibleAsset = computed(
    () => activeMode.value !== 'arthash' && Boolean(activeSource.value),
  )

  function resetStatuses() {
    for (const mode of imageModes) {
      const source = normalizedResources.value[mode]
      statuses[mode] = !source ? 'error' : isResourceCached(source) ? 'loaded' : 'idle'
    }
    statuses.arthash = normalizedResources.value.arthash ? 'loaded' : 'error'
    pending.clear()
  }

  function markResourceLoaded(source: string) {
    if (!source) return
    markSuperImageLoaded(source)
  }

  function priorityFor(mode: SuperImageMode) {
    const explicitPriority = toValue(options.fetchPriority)
    if (explicitPriority) return explicitPriority
    if (mode === 'thumbnail') return 'low' as const
    return 'high' as const
  }

  function activateLoadedMode(mode: SuperImageMode) {
    const requested = requestedMode.value

    if (requested === mode && statuses[mode] === 'loaded') {
      activeMode.value = mode
      return
    }

    if (!progressiveEnabled.value || activeMode.value !== 'arthash') return

    if (requested === 'arthash') {
      if (mode === 'compressed' && statuses.compressed === 'loaded') {
        activeMode.value = mode
        return
      }
      if (mode === 'thumbnail' && statuses.compressed !== 'loaded') {
        activeMode.value = mode
      }
      return
    }

    // When compressed is requested on first render, thumbnail is a safe
    // fallback while both lightweight resources race. Compressed always wins
    // as soon as it finishes.
    if (requested === 'compressed' && mode === 'thumbnail') {
      activeMode.value = mode
    }
  }

  function getOriginFallbackMode(): 'thumbnail' | 'compressed' | null {
    const currentMode = activeMode.value
    if (
      (currentMode === 'thumbnail' || currentMode === 'compressed') &&
      normalizedResources.value[currentMode]
    ) {
      return currentMode
    }
    if (normalizedResources.value.compressed) return 'compressed'
    if (normalizedResources.value.thumbnail) return 'thumbnail'
    return null
  }

  async function loadMode(mode: SuperImageMode, expectedRun = runId): Promise<boolean> {
    if (mode === 'arthash') return Boolean(normalizedResources.value.arthash)
    if (expectedRun !== runId) return false

    const source = normalizedResources.value[mode]
    if (!source) {
      statuses[mode] = 'error'
      return false
    }
    if (isResourceCached(source)) {
      statuses[mode] = 'loaded'
      markResourceLoaded(source)
      activateLoadedMode(mode)
      return true
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
        markResourceLoaded(source)
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

  async function fallbackAfterError(source: string): Promise<boolean> {
    const failedMode = imageModes.find((mode) => normalizedResources.value[mode] === source)
    if (!failedMode) return false

    const fallbackModes: SuperImageMode[] =
      failedMode === 'origin'
        ? ['compressed', 'thumbnail']
        : failedMode === 'compressed'
          ? ['thumbnail']
          : []
    const expectedRun = runId

    for (const fallbackMode of fallbackModes) {
      if (expectedRun !== runId || !normalizedResources.value[fallbackMode]) continue
      if (await loadMode(fallbackMode, expectedRun)) {
        if (expectedRun === runId) activeMode.value = fallbackMode
        return true
      }
    }

    if (expectedRun === runId) activeMode.value = 'arthash'
    return false
  }

  function startInitialPreload() {
    if (!mounted.value || !visible.value || initialPreloadStarted.value) return
    initialPreloadStarted.value = true
    const currentRun = runId

    if (!progressiveEnabled.value && requestedMode.value !== 'arthash') {
      void loadMode(requestedMode.value, currentRun)
      return
    }

    // Both lightweight variants intentionally start in the same turn. The
    // completion handler promotes compressed over thumbnail when it wins.
    void loadMode('thumbnail', currentRun)
    void loadMode('compressed', currentRun)
  }

  function requestMode(mode: SuperImageMode) {
    if (mode !== 'origin' && toValue(options.loading) !== 'eager' && !visible.value) return

    if (mode === 'origin') {
      const fallbackMode = getOriginFallbackMode()
      if (fallbackMode) {
        void loadMode(fallbackMode).then((loaded) => {
          if (loaded && requestedMode.value === 'origin' && activeMode.value === 'arthash') {
            activeMode.value = fallbackMode
          }
        })
      }
    }

    void loadMode(mode)
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
    markResourceLoaded(source)
    const mode = imageModes.find((candidate) => normalizedResources.value[candidate] === source)
    if (mode) statuses[mode] = 'loaded'
  }

  function markNativeImageError(source: string) {
    if (!source) return
    forgetSuperImage(source)
    const mode = imageModes.find((candidate) => normalizedResources.value[candidate] === source)
    if (mode) statuses[mode] = 'error'
  }

  watch(
    [
      () => normalizedResources.value.arthash,
      () => normalizedResources.value.thumbnail,
      () => normalizedResources.value.compressed,
      () => normalizedResources.value.origin,
    ],
    () => {
      runId += 1
      resourceVersion.value += 1
      activeMode.value = getInitialMode(normalizedResources.value, requestedMode.value)
      progressiveEnabled.value = toValue(options.progressive)
      initialPreloadStarted.value = false
      resetStatuses()
      if (!mounted.value) return

      if (toValue(options.loading) === 'eager') visible.value = true
      startInitialPreload()
      if (requestedMode.value !== 'arthash') requestMode(requestedMode.value)
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

      if (previousMode !== undefined) progressiveEnabled.value = false
      requestMode(mode)
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
    if (requestedMode.value !== 'arthash') requestMode(requestedMode.value)
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
    hasImageResource,
    resourceVersion: readonly(resourceVersion),
    isResourceCached,
    statuses: readonly(statuses),
    isVisible: readonly(visible),
    preload: loadMode,
    fallbackAfterError,
    markNativeImageLoaded,
    markNativeImageError,
  }
}
