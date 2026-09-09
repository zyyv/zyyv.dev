import { computed, inject, provide, shallowRef, toRef, toValue } from 'vue'
import type { InjectionKey, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { isImagePreloaded, preloadImage, type ImageLoadProgress } from '~/utils/preloadImage'

export type PhotoImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface PhotoImageLoadRecord {
  status: PhotoImageLoadStatus
  progress: ImageLoadProgress
}

export interface PhotoImagePreloadOptions {
  expectedBytes?: number
  onProgress?: (progress: ImageLoadProgress) => void
}

export interface PhotoImageLoadState {
  recordFor(source: string): Readonly<Ref<PhotoImageLoadRecord>>
  isLoaded(source: string): boolean
  markLoaded(source: string): void
  markError(source: string): void
  preload(source: string, options?: PhotoImagePreloadOptions): Promise<boolean>
}

const photoImageLoadStateKey: InjectionKey<PhotoImageLoadState> = Symbol('photo-image-load-state')

const EMPTY_PROGRESS: ImageLoadProgress = {
  loadedBytes: 0,
  totalBytes: 0,
  percentage: 0,
}

function createPhotoImageLoadState(): PhotoImageLoadState {
  const records = new Map<string, ShallowRef<PhotoImageLoadRecord>>()
  const pendingLoads = new Map<string, Promise<boolean>>()

  function recordFor(source: string) {
    let record = records.get(source)
    if (!record) {
      record = shallowRef({
        status: source && isImagePreloaded(source) ? 'loaded' : 'idle',
        progress: EMPTY_PROGRESS,
      })
      records.set(source, record)
    }
    return record
  }

  function updateRecord(
    source: string,
    status: PhotoImageLoadStatus,
    progress?: ImageLoadProgress,
  ) {
    if (!source) return

    const record = recordFor(source)
    record.value = {
      status,
      progress: progress ?? record.value.progress,
    }
  }

  function markLoaded(source: string) {
    if (!source) return
    updateRecord(source, 'loaded', {
      loadedBytes: 0,
      totalBytes: 0,
      percentage: 100,
    })
  }

  function markError(source: string) {
    if (!source || isLoaded(source)) return
    updateRecord(source, 'error')
  }

  function isLoaded(source: string) {
    return Boolean(source && recordFor(source).value.status === 'loaded')
  }

  function preload(source: string, options: PhotoImagePreloadOptions = {}) {
    if (!source) return Promise.resolve(false)
    if (isLoaded(source)) {
      options.onProgress?.(recordFor(source).value.progress)
      return Promise.resolve(true)
    }

    const pending = pendingLoads.get(source)
    if (pending) return pending

    updateRecord(source, 'loading')
    const request = preloadImage(source, {
      expectedBytes: options.expectedBytes,
      onProgress(progress) {
        updateRecord(source, 'loading', progress)
        options.onProgress?.(progress)
      },
    }).then((loaded) => {
      // A native <img> may finish before the preload request. Treat that as
      // success so a slower duplicate request cannot regress the shared state.
      if (loaded || isLoaded(source)) markLoaded(source)
      else updateRecord(source, 'error')
      return loaded || isLoaded(source)
    })

    pendingLoads.set(source, request)
    void request.finally(() => {
      if (pendingLoads.get(source) === request) pendingLoads.delete(source)
    })
    return request
  }

  return { recordFor, isLoaded, markLoaded, markError, preload }
}

export function providePhotoImageLoadState() {
  const state = createPhotoImageLoadState()
  provide(photoImageLoadStateKey, state)
  return state
}

export function usePhotoImageLoadState() {
  return inject(photoImageLoadStateKey, null) ?? createPhotoImageLoadState()
}

export function usePhotoImage(source: MaybeRefOrGetter<string>) {
  const sourceRef = toRef(source)
  const state = usePhotoImageLoadState()
  const record = computed(() => state.recordFor(toValue(sourceRef)).value)
  const status = computed(() => record.value.status)

  function markLoaded() {
    state.markLoaded(toValue(sourceRef))
  }

  function markError() {
    state.markError(toValue(sourceRef))
  }

  function preload(options?: PhotoImagePreloadOptions) {
    return state.preload(toValue(sourceRef), options)
  }

  return {
    record,
    status,
    isLoaded: computed(() => status.value === 'loaded'),
    isLoading: computed(() => status.value === 'loading'),
    hasError: computed(() => status.value === 'error'),
    markLoaded,
    markError,
    preload,
  }
}
