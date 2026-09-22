<script setup lang="ts">
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'
import type { Photo } from '~/types'
import { hashFraction } from '~/utils/shuffle'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Props {
  photos: Photo[]
}

interface Emits {
  open: [photo: Photo, source: HTMLElement]
}

interface LocatedPhoto {
  photo: Photo
  latitude: number
  longitude: number
  regionColor: string
}

interface PhotoMarkerGroup {
  id: string
  anchor: LocatedPhoto
  photos: LocatedPhoto[]
}

interface MarkerElementResult {
  element: HTMLButtonElement
  cleanup: () => void
}

interface MapLocationCopy {
  title: string
  context: string
}

const PHOTO_IMAGE_ZOOM = 7.5

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const runtimeConfig = useRuntimeConfig()
const colorMode = useColorMode()
const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer')
const mapInstance = shallowRef<MapboxMap | null>(null)
const mapReady = shallowRef(false)
const mapStatus = shallowRef<'loading' | 'ready' | 'error'>('loading')
const mapError = shallowRef('')
const selectedPhotoId = shallowRef<string | null>(null)
const markerInstances = new Map<string, MapboxMarker>()
const markerElements = new Map<string, HTMLButtonElement>()
const markerCleanups = new Map<string, () => void>()
let mapboxModule: typeof import('mapbox-gl') | undefined
let disposed = false

const mapboxToken = computed(() => String(runtimeConfig.public.mapboxToken || '').trim())
const mapStyle = computed(() =>
  colorMode.state.value === 'dark'
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11',
)
const locatedPhotos = computed<LocatedPhoto[]>(() =>
  props.photos.flatMap((photo) => {
    const latitude = photo.exif?.gps?.latitude
    const longitude = photo.exif?.gps?.longitude
    if (
      !isValidCoordinate(latitude, -90, 90) ||
      !isValidCoordinate(longitude, -180, 180) ||
      (latitude === 0 && longitude === 0)
    ) {
      return []
    }
    const regionKey = getRegionKey(photo)
    return [
      {
        photo,
        latitude,
        longitude,
        regionColor: getRegionColor(regionKey),
      },
    ]
  }),
)
const markerGroups = computed<PhotoMarkerGroup[]>(() => {
  const groups = new Map<string, LocatedPhoto[]>()

  for (const item of locatedPhotos.value) {
    // Three decimal places keeps the grouping tied to a fixed GPS area, roughly 100m.
    const key = `${item.latitude.toFixed(3)}:${item.longitude.toFixed(3)}`
    const photos = groups.get(key) || []
    photos.push(item)
    groups.set(key, photos)
  }

  return [...groups.entries()].map(([id, photos]) => ({
    id,
    anchor: photos[0]!,
    photos,
  }))
})
const selectedPhoto = computed(
  () => props.photos.find((photo) => photo.id === selectedPhotoId.value) || null,
)
const selectedLocation = computed(() => getLocationCopy(selectedPhoto.value))
const mapStateCopy = computed(() => {
  if (!mapboxToken.value) {
    return {
      title: 'Mapbox is not configured',
      description: 'Add NUXT_PUBLIC_MAPBOX_TOKEN to enable the photo atlas.',
    }
  }
  if (mapError.value) {
    return {
      title: 'The map could not load',
      description: mapError.value,
    }
  }
  return {
    title: 'Loading the photo atlas',
    description: 'Preparing your places and photographs.',
  }
})

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function getRegionKey(photo: Photo): string {
  const location = photo.exif?.location
  return location?.state?.trim() || location?.country?.trim() || location?.city?.trim() || 'unknown'
}

function getRegionColor(regionKey: string): string {
  const hue = Math.round(hashFraction(regionKey, 17) * 360)
  const saturation = 64 + Math.round(hashFraction(regionKey, 31) * 16)
  const lightness = 52 + Math.round(hashFraction(regionKey, 47) * 10)
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

function getLocationCopy(photo: Photo | null): MapLocationCopy | null {
  if (!photo) return null
  const gps = photo.exif?.gps
  if (
    !gps ||
    !isValidCoordinate(gps.latitude, -90, 90) ||
    !isValidCoordinate(gps.longitude, -180, 180)
  ) {
    return null
  }

  const location = photo.exif?.location
  const title = location?.road || location?.city || location?.displayName.split(/[,，]/)[0]?.trim()
  const context = [location?.city, location?.state, location?.country]
    .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index)
    .join(' · ')

  return {
    title: title || `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`,
    context: context || 'GPS coordinates embedded in the original file',
  }
}

function createMarkerElement(group: PhotoMarkerGroup, showImage: boolean): MarkerElementResult {
  const item = group.anchor
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = `photo-map__marker${showImage ? '' : ' photo-map__marker--dot'}`
  if (showImage) {
    marker.classList.add(
      group.photos.length === 1
        ? 'photo-map__marker--single'
        : group.photos.length === 2
          ? 'photo-map__marker--two'
          : 'photo-map__marker--stacked',
    )
  }
  marker.dataset.photoId = item.photo.id
  marker.dataset.markerGroupId = group.id
  marker.dataset.markerMode = showImage ? 'photo' : 'dot'
  marker.dataset.cuelumeToggle = 'toggle'
  marker.style.setProperty('--marker-color', item.regionColor)
  marker.setAttribute(
    'aria-label',
    showImage
      ? `Show ${group.photos.length} photos near ${getLocationCopy(item.photo)?.title || 'this place'}`
      : `Show ${item.photo.filename} on the map`,
  )

  let currentIndex = 0
  let intervalId: number | undefined
  let transitionId: number | undefined

  if (showImage) {
    const stack = document.createElement('span')
    stack.className = 'photo-map__marker-stack'
    stack.setAttribute('aria-hidden', 'true')
    const images = Array.from({ length: Math.min(3, group.photos.length) }, (_, slot) => {
      const image = document.createElement('img')
      image.className = `photo-map__marker-frame photo-map__marker-frame--${slot + 1}`
      image.alt = ''
      image.loading = 'lazy'
      image.decoding = 'async'
      image.draggable = false
      stack.append(image)
      return image
    })

    const updateStack = () => {
      images.forEach((image, slot) => {
        const photo = group.photos[(currentIndex + slot) % group.photos.length]
        if (photo) image.src = photo.photo.thumbnail
      })
    }

    updateStack()
    marker.append(stack)

    if (group.photos.length > 3 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intervalId = window.setInterval(() => {
        stack.classList.add('photo-map__marker-stack--changing')
        transitionId = window.setTimeout(() => {
          currentIndex = (currentIndex + 1) % group.photos.length
          updateStack()
          stack.classList.remove('photo-map__marker-stack--changing')
        }, 190)
      }, 2000)
    }
  } else {
    const dot = document.createElement('span')
    dot.className = 'photo-map__marker-dot'
    dot.style.setProperty('--marker-color', item.regionColor)
    dot.setAttribute('aria-hidden', 'true')
    marker.append(dot)
  }

  marker.addEventListener('click', (event) => {
    event.stopPropagation()
    selectPhoto(group.photos[currentIndex]?.photo.id || item.photo.id)
  })

  return {
    element: marker,
    cleanup: () => {
      if (intervalId !== undefined) window.clearInterval(intervalId)
      if (transitionId !== undefined) window.clearTimeout(transitionId)
    },
  }
}

function syncMarkerSelection() {
  for (const [groupId, element] of markerElements) {
    const group = markerGroups.value.find((item) => item.id === groupId)
    const isSelected = group?.photos.some((item) => item.photo.id === selectedPhotoId.value)
    element.classList.toggle('photo-map__marker--active', Boolean(isSelected))
  }
}

function clearMarkers() {
  for (const [groupId, marker] of markerInstances) {
    markerCleanups.get(groupId)?.()
    marker.remove()
  }
  markerInstances.clear()
  markerElements.clear()
  markerCleanups.clear()
}

function syncVisibleMarkers() {
  const map = mapInstance.value
  if (!map || !mapReady.value || !mapboxModule) return
  const showPhotoMarkers = map.getZoom() >= PHOTO_IMAGE_ZOOM
  const markerMode = showPhotoMarkers ? 'photo' : 'dot'

  const bounds = map.getBounds()
  if (!bounds) return
  const visibleGroups = markerGroups.value.filter((group) =>
    bounds.contains([group.anchor.longitude, group.anchor.latitude]),
  )
  const visibleIds = new Set(visibleGroups.map((group) => group.id))

  for (const [groupId, marker] of markerInstances) {
    if (
      !visibleIds.has(groupId) ||
      markerElements.get(groupId)?.dataset.markerMode !== markerMode
    ) {
      markerCleanups.get(groupId)?.()
      marker.remove()
      markerInstances.delete(groupId)
      markerElements.delete(groupId)
      markerCleanups.delete(groupId)
    }
  }

  for (const group of visibleGroups) {
    if (markerInstances.has(group.id)) continue
    const { element, cleanup } = createMarkerElement(group, showPhotoMarkers)
    const marker = new mapboxModule.Marker({ element, anchor: 'center' })
      .setLngLat([group.anchor.longitude, group.anchor.latitude])
      .addTo(map)
    // Mapbox treats marker elements as decorative images by default. These markers are interactive.
    element.setAttribute('role', 'button')
    markerInstances.set(group.id, marker)
    markerElements.set(group.id, element)
    markerCleanups.set(group.id, cleanup)
  }

  syncMarkerSelection()
}

function syncMarkers() {
  const map = mapInstance.value
  if (!map || !mapReady.value || !mapboxModule) return
  syncVisibleMarkers()
}

function getPhotoCenter(): [number, number] {
  if (!locatedPhotos.value.length) return [0, 24]

  let minLongitude = Infinity
  let maxLongitude = -Infinity
  let minLatitude = Infinity
  let maxLatitude = -Infinity

  for (const item of locatedPhotos.value) {
    minLongitude = Math.min(minLongitude, item.longitude)
    maxLongitude = Math.max(maxLongitude, item.longitude)
    minLatitude = Math.min(minLatitude, item.latitude)
    maxLatitude = Math.max(maxLatitude, item.latitude)
  }

  return [(minLongitude + maxLongitude) / 2, (minLatitude + maxLatitude) / 2]
}

function getInitialZoom() {
  if (!locatedPhotos.value.length) return 1.35
  if (locatedPhotos.value.length === 1) return 11.5
  return 3.5
}

function fitToPhotos(animate = true) {
  const map = mapInstance.value
  if (!map || !mapboxModule) return

  if (!locatedPhotos.value.length) {
    map.flyTo({ center: [0, 24], zoom: 1.35, duration: animate ? 700 : 0 })
    return
  }

  if (locatedPhotos.value.length === 1) {
    const item = locatedPhotos.value[0]
    if (!item) return
    map.flyTo({
      center: [item.longitude, item.latitude],
      zoom: 11.5,
      duration: animate ? 700 : 0,
      essential: true,
    })
    return
  }

  const bounds = new mapboxModule.LngLatBounds()
  for (const item of locatedPhotos.value) bounds.extend([item.longitude, item.latitude])
  map.fitBounds(bounds, {
    padding: { top: 190, right: 90, bottom: 220, left: 90 },
    maxZoom: 12,
    duration: animate ? 850 : 0,
    essential: true,
  })
}

function selectPhoto(photoId: string) {
  const item = locatedPhotos.value.find((locatedPhoto) => locatedPhoto.photo.id === photoId)
  if (!item) return

  selectedPhotoId.value = photoId
  const map = mapInstance.value
  if (map) {
    map.flyTo({
      center: [item.longitude, item.latitude],
      zoom: Math.max(map.getZoom(), 11.5),
      offset: [0, -70],
      duration: 650,
      essential: true,
    })
  }
}

function clearSelection() {
  selectedPhotoId.value = null
}

function openSelectedPhoto(event: MouseEvent) {
  const photo = selectedPhoto.value
  const source = event.currentTarget
  if (!photo || !(source instanceof HTMLElement)) return
  emit('open', photo, source)
}

function initializeMap() {
  if (!mapContainer.value || !mapboxToken.value) {
    mapStatus.value = 'error'
    return
  }

  void import('mapbox-gl')
    .then((module) => {
      if (disposed || !mapContainer.value) return
      mapboxModule = module
      module.default.accessToken = mapboxToken.value
      const map = new module.default.Map({
        container: mapContainer.value!,
        style: mapStyle.value,
        center: getPhotoCenter(),
        zoom: getInitialZoom(),
        attributionControl: false,
        logoPosition: 'bottom-left',
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        projection: 'mercator',
      })

      mapInstance.value = map
      // Mapbox requires its logo and attribution when using Mapbox styles/data.
      // Keep attribution expanded so there is no separate “Toggle attribution” button.
      map.addControl(new module.default.AttributionControl({ compact: false }), 'bottom-right')
      map.on('load', () => {
        mapReady.value = true
        mapStatus.value = 'ready'
        syncMarkers()
        fitToPhotos(false)
      })
      map.on('moveend', syncVisibleMarkers)
      map.on('click', clearSelection)
      map.on('error', (event) => {
        if (mapReady.value || !event.error) return
        mapStatus.value = 'error'
        mapError.value = 'Check the token, style access, and network connection.'
      })
    })
    .catch(() => {
      mapStatus.value = 'error'
      mapError.value = 'Mapbox GL JS could not be loaded in this browser.'
    })
}

watch(locatedPhotos, () => {
  syncMarkers()
  if (
    selectedPhotoId.value &&
    !locatedPhotos.value.some((item) => item.photo.id === selectedPhotoId.value)
  ) {
    clearSelection()
  }
})
watch(selectedPhotoId, syncMarkerSelection)
watch(mapStyle, (style) => {
  if (mapReady.value && mapInstance.value) {
    const map = mapInstance.value
    map.once('style.load', () => {
      if (disposed) return
      syncMarkers()
    })
    map.setStyle(style, {
      diff: false,
      localFontFamily: undefined,
      localIdeographFontFamily: undefined,
    })
  }
})

onMounted(initializeMap)

onBeforeUnmount(() => {
  disposed = true
  clearMarkers()
  mapInstance.value?.remove()
  mapInstance.value = null
  mapboxModule = undefined
})
</script>

<template>
  <section class="photo-map" aria-label="Photo atlas">
    <div ref="mapContainer" class="photo-map__canvas" />

    <div v-if="selectedPhoto" class="photo-map__topbar">
      <div class="photo-map__actions panel-surface" aria-label="Map actions">
        <button
          type="button"
          class="photo-map__action photo-map__action--quiet"
          aria-label="Clear selected photo"
          title="Clear selected photo"
          data-cuelume-hover="tick"
          data-cuelume-toggle="droplet"
          @click="clearSelection"
        >
          <i class="i-hugeicons:cancel-01" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div
      v-if="mapStatus !== 'ready'"
      class="photo-map__state panel-surface"
      role="status"
      aria-live="polite"
    >
      <div class="photo-map__state-icon">
        <i
          :class="mapStatus === 'error' ? 'i-hugeicons:globe-off' : 'i-hugeicons:globe-02'"
          aria-hidden="true"
        />
      </div>
      <h2>{{ mapStateCopy.title }}</h2>
      <p>{{ mapStateCopy.description }}</p>
      <code v-if="!mapboxToken">NUXT_PUBLIC_MAPBOX_TOKEN</code>
    </div>

    <div v-else-if="!locatedPhotos.length" class="photo-map__state panel-surface" role="status">
      <div class="photo-map__state-icon">
        <i class="i-hugeicons:location-offline-01" aria-hidden="true" />
      </div>
      <h2>{{ props.photos.length ? 'No geotagged photos yet' : 'No photos yet' }}</h2>
      <p>
        {{
          props.photos.length
            ? 'Photos with GPS coordinates will appear here automatically.'
            : 'Add photographs with GPS metadata to start building this atlas.'
        }}
      </p>
    </div>

    <Transition name="photo-map-card">
      <article v-if="selectedPhoto && selectedLocation" class="photo-map__selected panel-surface">
        <div class="photo-map__selected-image">
          <img :src="selectedPhoto.thumbnail" :alt="selectedPhoto.filename" loading="eager" />
        </div>
        <div class="photo-map__selected-copy">
          <p class="photo-map__selected-file">{{ selectedPhoto.filename }}</p>
          <p class="photo-map__selected-place">
            <i class="i-hugeicons:location-01" aria-hidden="true" />
            <span>
              <strong>{{ selectedLocation.title }}</strong>
              <small>{{ selectedLocation.context }}</small>
            </span>
          </p>
          <button
            type="button"
            class="photo-map__open"
            data-cuelume-hover="tick"
            data-cuelume-toggle="page"
            @click="openSelectedPhoto"
          >
            <span>Open photo</span>
            <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
          </button>
        </div>
      </article>
    </Transition>

    <aside v-if="locatedPhotos.length && !selectedPhoto" class="photo-map__rail panel-surface">
      <div class="photo-map__rail-list" aria-label="Mapped photos">
        <button
          v-for="item in locatedPhotos"
          :key="item.photo.id"
          type="button"
          class="photo-map__rail-item"
          :aria-label="`Show ${item.photo.filename} on the map`"
          data-cuelume-toggle="toggle"
          @click="selectPhoto(item.photo.id)"
        >
          <img :src="item.photo.thumbnail" alt="" loading="lazy" />
        </button>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.photo-map {
  --map-ink: #11110f;
  --map-muted: color-mix(in srgb, var(--map-ink) 58%, transparent);
  --map-panel: rgb(244 244 239 / 80%);
  --map-panel-line: rgb(17 17 15 / 14%);
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  isolation: isolate;
  color: var(--map-ink);
  background: #d7d8d4;
}

:global(.dark .photo-map) {
  --map-ink: #f0f0e9;
  --map-muted: color-mix(in srgb, var(--map-ink) 62%, transparent);
  --map-panel: rgb(22 23 21 / 78%);
  --map-panel-line: rgb(240 240 233 / 16%);
  background: #191b19;
}

.photo-map__canvas {
  position: absolute;
  inset: 0;
}

.panel-surface {
  border: 1px solid var(--map-panel-line);
  border-radius: 0.9rem;
  background: var(--map-panel);
  box-shadow: 0 1.1rem 3.2rem rgb(17 17 15 / 12%);
  -webkit-backdrop-filter: blur(1.25rem) saturate(1.25);
  backdrop-filter: blur(1.25rem) saturate(1.25);
}

.photo-map__topbar,
.photo-map__state,
.photo-map__selected,
.photo-map__rail {
  position: absolute;
  z-index: 2;
}

.photo-map__topbar {
  inset: 1.25rem clamp(1rem, 3vw, 3rem) auto clamp(4.75rem, 7vw, 6.75rem);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 1rem;
  pointer-events: none;
}

.photo-map__topbar > * {
  pointer-events: auto;
}

.photo-map__selected-file {
  font-size: 0.61rem;
  font-weight: 650;
  letter-spacing: 0.13em;
  line-height: 1;
}

.photo-map__actions {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.25rem;
}

.photo-map__action,
.photo-map__open,
.photo-map__rail-item {
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.photo-map__action {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.42rem;
  padding: 0 0.62rem;
  border-radius: 0.62rem;
  background: transparent;
  color: var(--map-muted);
  font-size: 0.68rem;
  font-weight: 600;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.photo-map__action i {
  width: 1rem;
  height: 1rem;
}

.photo-map__action:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.photo-map__action:focus-visible,
.photo-map__open:focus-visible,
.photo-map__rail-item:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.photo-map__action:active,
.photo-map__open:active,
.photo-map__rail-item:active {
  transform: scale(0.97);
}

@media (hover: hover) and (pointer: fine) {
  .photo-map__action:not(:disabled):hover {
    color: var(--map-ink);
    background: color-mix(in srgb, currentColor 9%, transparent);
    transform: translateY(-1px);
  }
}

.photo-map__state {
  top: 50%;
  left: 50%;
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.5rem 1.45rem 1.6rem;
  text-align: center;
  transform: translate(-50%, -50%);
}

.photo-map__state-icon {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  margin: 0 auto 1rem;
  place-items: center;
  border: 1px solid var(--map-panel-line);
  border-radius: 0.8rem;
  color: var(--map-muted);
  font-size: 1.25rem;
}

.photo-map__state h2 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 580;
  letter-spacing: -0.035em;
}

.photo-map__state p {
  margin: 0.55rem auto 0;
  color: var(--map-muted);
  font-size: 0.76rem;
  line-height: 1.55;
}

.photo-map__state code {
  display: inline-flex;
  margin-top: 1rem;
  padding: 0.42rem 0.55rem;
  border-radius: 0.45rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
  color: var(--map-ink);
  font-family: dank, monospace;
  font-size: 0.64rem;
}

.photo-map__selected {
  right: clamp(4.2rem, 8vw, 8rem);
  bottom: 1.25rem;
  display: grid;
  width: min(22rem, calc(100vw - 2rem));
  grid-template-columns: 6.2rem minmax(0, 1fr);
  gap: 0.85rem;
  padding: 0.65rem;
}

.photo-map__selected-image {
  min-height: 8rem;
  overflow: hidden;
  border-radius: 0.56rem;
  background: color-mix(in srgb, currentColor 9%, transparent);
}

.photo-map__selected-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-map__selected-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.25rem 0.2rem 0.15rem 0;
}

.photo-map__selected-file {
  overflow: hidden;
  color: var(--map-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-map__selected-place {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0.7rem 0;
}

.photo-map__selected-place > i {
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  margin-top: 0.08rem;
  color: #d05732;
}

.photo-map__selected-place span {
  display: grid;
  min-width: 0;
  gap: 0.18rem;
}

.photo-map__selected-place strong,
.photo-map__selected-place small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-map__selected-place strong {
  font-size: 0.75rem;
  font-weight: 600;
}

.photo-map__selected-place small {
  color: var(--map-muted);
  font-size: 0.61rem;
}

.photo-map__open {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.38rem;
  padding: 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 28%, transparent);
  background: transparent;
  font-size: 0.68rem;
  font-weight: 650;
  line-height: 1.65;
}

.photo-map__open i {
  width: 0.85rem;
  height: 0.85rem;
  transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) and (pointer: fine) {
  .photo-map__open:hover i {
    transform: translate(0.12rem, -0.12rem);
  }
}

.photo-map__rail {
  bottom: 1.25rem;
  left: clamp(1rem, 5vw, 4rem);
  width: min(31rem, calc(100vw - 2rem));
  min-width: 17rem;
  padding: 0.72rem 0.75rem;
}

.photo-map__rail-list {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.photo-map__rail-list::-webkit-scrollbar {
  display: none;
}

.photo-map__rail-item {
  display: grid;
  flex: 0 0 4.15rem;
  padding: 0;
  background: transparent;
  text-align: left;
}

.photo-map__rail-item img {
  display: block;
  width: 4.15rem;
  height: 3.1rem;
  border-radius: 0.45rem;
  object-fit: cover;
  opacity: 0.78;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .photo-map__rail-item:hover img {
    opacity: 1;
    transform: translateY(-2px);
  }
}

:global(.photo-map .mapboxgl-ctrl-bottom-right) {
  right: clamp(0.8rem, 1.8vw, 1.5rem);
  bottom: 0.7rem;
}

:global(.photo-map .mapboxgl-ctrl-attrib) {
  margin-top: 0.35rem;
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--map-panel) 86%, transparent);
  color: var(--map-muted);
  font-size: 0.55rem;
}

:global(.photo-map .mapboxgl-ctrl-attrib a) {
  color: inherit;
}

:global(.photo-map .photo-map__marker) {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  width: 4.35rem;
  height: 3.7rem;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  transition: filter 220ms ease;
}

:global(.photo-map .photo-map__marker-stack) {
  position: relative;
  display: block;
  width: 3.5rem;
  height: 3.5rem;
  transition:
    opacity 190ms ease,
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.photo-map .photo-map__marker-stack--changing) {
  opacity: 0.22;
  transform: translateY(-0.18rem) scale(0.94) rotate(1.5deg);
}

:global(.photo-map .photo-map__marker-frame) {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 0.78rem;
  object-fit: cover;
  box-shadow: 0 0.9rem 1.6rem rgb(17 17 15 / 28%);
  transform-origin: 50% 82%;
  transition:
    opacity 360ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.photo-map .photo-map__marker-frame--1) {
  opacity: 0.58;
  transform: translate(-0.48rem, 0.18rem) rotate(-8deg) scale(0.84);
}

:global(.photo-map .photo-map__marker-frame--2) {
  z-index: 1;
  opacity: 0.8;
  transform: translate(-0.24rem, 0.08rem) rotate(-3.5deg) scale(0.92);
}

:global(.photo-map .photo-map__marker-frame--3) {
  z-index: 2;
  opacity: 1;
  transform: translate(0, 0) rotate(2deg);
}

:global(.photo-map .photo-map__marker--single .photo-map__marker-frame--1) {
  opacity: 1;
  transform: translate(0, 0) rotate(2deg);
}

:global(.photo-map .photo-map__marker--two .photo-map__marker-frame--1) {
  opacity: 0.7;
  transform: translate(-0.28rem, 0.1rem) rotate(-5deg) scale(0.9);
}

:global(.photo-map .photo-map__marker--two .photo-map__marker-frame--2) {
  z-index: 2;
  opacity: 1;
  transform: translate(0, 0) rotate(2deg);
}

:global(.photo-map .photo-map__marker--dot) {
  display: grid;
  width: 1.1rem;
  height: 1.1rem;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  filter: none;
}

:global(.photo-map .photo-map__marker-dot) {
  display: block;
  width: 0.52rem;
  height: 0.52rem;
  border: 1px solid rgb(255 255 255 / 88%);
  border-radius: 50%;
  background: var(--marker-color, #d05732);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--marker-color, #d05732) 46%, transparent);
  animation: photo-map-pulse 2.2s ease-out infinite;
}

:global(.photo-map .photo-map__marker--dot.photo-map__marker--active .photo-map__marker-dot) {
  box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--marker-color, #d05732) 38%, transparent);
}

@keyframes photo-map-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--marker-color, #d05732) 46%, transparent);
  }

  70% {
    box-shadow: 0 0 0 0.6rem color-mix(in srgb, var(--marker-color, #d05732) 0%, transparent);
  }

  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--marker-color, #d05732) 0%, transparent);
  }
}

:global(.photo-map .photo-map__marker--active:not(.photo-map__marker--dot)) {
  z-index: 1;
  filter: brightness(1.08) saturate(1.08);
}

:global(.photo-map .photo-map__marker:focus-visible) {
  outline: 2px solid #d05732;
  outline-offset: 4px;
}

.photo-map-card-enter-active,
.photo-map-card-leave-active {
  transition:
    opacity 220ms ease,
    transform 340ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-map-card-enter-from,
.photo-map-card-leave-to {
  opacity: 0;
  transform: translateY(0.7rem) scale(0.98);
}

@media (max-width: 767.9px) {
  .photo-map__topbar {
    inset: 1rem 1rem auto 1rem;
  }

  .photo-map__actions {
    padding: 0.2rem;
  }

  .photo-map__action {
    width: 2.2rem;
    justify-content: center;
    padding: 0;
  }

  .photo-map__rail {
    right: 4rem;
    bottom: 5.4rem;
    left: 1rem;
    width: auto;
    min-width: 0;
  }

  .photo-map__selected {
    right: 1rem;
    bottom: 5.4rem;
    left: 1rem;
    width: auto;
  }

  :global(.photo-map .mapboxgl-ctrl-bottom-right) {
    right: 0.8rem;
    bottom: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-map__action,
  .photo-map__open,
  .photo-map__rail-item,
  .photo-map__rail-item img,
  :global(.photo-map .photo-map__marker) {
    transition: none;
  }

  :global(.photo-map .photo-map__marker-dot) {
    animation: none;
  }

  .photo-map-card-enter-active,
  .photo-map-card-leave-active {
    transition-duration: 1ms;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .panel-surface,
  :global(.photo-map .mapboxgl-ctrl-attrib) {
    background: color-mix(in srgb, var(--map-panel) 100%, var(--map-ink) 4%);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
</style>
