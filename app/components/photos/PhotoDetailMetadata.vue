<script setup lang="ts">
import type { Photo, PhotoReactionCounts } from '~/types'
import { PHOTO_REACTIONS } from '#shared/constants/photo-reactions'
import PhotoColorPalette from './PhotoColorPalette.vue'

interface Props {
  photo: Photo
  reactionCounts: PhotoReactionCounts
}

interface DetailRow {
  icon: string
  label: string
  value: string
}

interface LocationDisplay {
  title: string
  context: string
  href?: string
}

const props = defineProps<Props>()
const {
  colors: imageColors,
  status: imageColorsStatus,
  error: imageColorsError,
  analyze: analyzeImageColors,
} = useImageColors(() => props.photo)

const fileDetails = computed<DetailRow[]>(() => [
  {
    icon: props.photo.mediaType === 'video' ? 'i-hugeicons:video-01' : 'i-hugeicons:image-03',
    label: 'Type',
    value: props.photo.mediaType === 'video' ? 'Video' : 'Photo',
  },
  { icon: 'i-hugeicons:file-01', label: 'Filename', value: props.photo.filename },
  { icon: 'i-hugeicons:file-01', label: 'Format', value: getFileFormat(props.photo.filename) },
  {
    icon: 'i-hugeicons:maximize-01',
    label: 'Dimensions',
    value: `${props.photo.width} × ${props.photo.height}`,
  },
  {
    icon: 'i-hugeicons:maximize-01',
    label: 'Aspect ratio',
    value: getAspectRatio(props.photo.width, props.photo.height),
  },
  {
    icon: 'i-hugeicons:database-01',
    label: 'Original',
    value: props.photo.originSizeFormatted,
  },
  {
    icon: 'i-hugeicons:image-03',
    label: props.photo.mediaType === 'video' ? 'Poster' : 'Compressed',
    value: props.photo.compressedSizeFormatted,
  },
  {
    icon: 'i-hugeicons:calendar-03',
    label: 'Modified',
    value: formatDate(props.photo.modifiedAt),
  },
])

const captureDetails = computed<DetailRow[]>(() => {
  const exif = props.photo.exif
  if (!exif) return []

  return [
    exif.make || exif.model
      ? {
          icon: 'i-hugeicons:camera-01',
          label: 'Camera',
          value: getCameraName(exif.make, exif.model),
        }
      : null,
    exif.lens ? { icon: 'i-hugeicons:camera-lens', label: 'Lens', value: exif.lens } : null,
    exif.dateTime
      ? { icon: 'i-hugeicons:clock-01', label: 'Captured', value: formatDate(exif.dateTime) }
      : null,
  ].filter((detail): detail is DetailRow => detail !== null)
})

const exposureDetails = computed<DetailRow[]>(() => {
  const exif = props.photo.exif
  if (!exif) return []

  return [
    exif.focalLength
      ? {
          icon: 'i-hugeicons:zoom-in-area',
          label: 'Focal length',
          value: `${formatNumber(exif.focalLength)}mm`,
        }
      : null,
    exif.fNumber
      ? {
          icon: 'i-hugeicons:iris-scan',
          label: 'Aperture',
          value: `f/${formatNumber(exif.fNumber)}`,
        }
      : null,
    exif.exposureTime
      ? {
          icon: 'i-hugeicons:timer-01',
          label: 'Shutter',
          value: formatExposureTime(exif.exposureTime),
        }
      : null,
    exif.iso ? { icon: 'i-hugeicons:settings-05', label: 'ISO', value: String(exif.iso) } : null,
  ].filter((detail): detail is DetailRow => detail !== null)
})

const locationDetails = computed<LocationDisplay | null>(() => {
  const location = props.photo.exif?.location
  if (!location) return null

  const title = location.road || location.displayName.split(/[,，]/)[0]?.trim() || 'Mapped location'
  const context = [location.city, location.state].filter(Boolean).join(' · ')

  return {
    title,
    context: context || location.displayName,
    href: location.osmUrl,
  }
})

const activeReactions = computed(() =>
  PHOTO_REACTIONS.filter((reaction) => props.reactionCounts[reaction.type] > 0),
)

function formatDate(date: Date | string): string {
  return useDateFormat(date, 'YYYY-MM-DD HH:mm', { locales: 'en-US' }).value
}

function formatExposureTime(time: number): string {
  if (time >= 1) return `${Number(time.toFixed(1))}s`
  return `1/${Math.max(1, Math.round(1 / time))}s`
}

function formatNumber(value: number): string {
  return Number(value.toFixed(1)).toString()
}

function getCameraName(make?: string, model?: string): string {
  const cleanMake = make?.trim()
  const cleanModel = model?.trim()
  if (!cleanMake) return cleanModel || 'Unknown camera'
  if (!cleanModel) return cleanMake
  if (cleanModel.toLocaleLowerCase().startsWith(cleanMake.toLocaleLowerCase())) return cleanModel
  return `${cleanMake} ${cleanModel}`
}

function getFileFormat(filename: string): string {
  const extension = filename.split('.').pop()?.toLocaleUpperCase()
  if (!extension) return '—'
  return extension === 'JPG' || extension === 'JPEG' ? 'JPEG' : extension
}

function getAspectRatio(width: number, height: number): string {
  if (!width || !height) return '—'
  const divisor = greatestCommonDivisor(width, height)
  return `${width / divisor}:${height / divisor}`
}

function greatestCommonDivisor(a: number, b: number): number {
  let left = Math.abs(a)
  let right = Math.abs(b)
  while (right) [left, right] = [right, left % right]
  return left || 1
}
</script>

<template>
  <aside class="photo-dialog__details" aria-label="Photo details">
    <section class="photo-dialog__detail-group">
      <h3>File</h3>
      <dl>
        <div v-for="detail in fileDetails" :key="detail.label">
          <dt>
            <i :class="detail.icon" aria-hidden="true" />
            <span>{{ detail.label }}</span>
          </dt>
          <dd>{{ detail.value }}</dd>
        </div>
      </dl>
    </section>

    <section
      v-if="captureDetails.length || exposureDetails.length || locationDetails"
      class="photo-dialog__detail-group"
    >
      <h3>Capture</h3>
      <dl class="photo-dialog__capture-list">
        <div v-for="detail in captureDetails" :key="detail.label">
          <dt>
            <i :class="detail.icon" aria-hidden="true" />
            <span>{{ detail.label }}</span>
          </dt>
          <dd>{{ detail.value }}</dd>
        </div>
        <div v-if="locationDetails" class="photo-dialog__location-row">
          <dt>
            <i class="i-hugeicons:location-01" aria-hidden="true" />
            <span>Location</span>
          </dt>
          <dd>
            <a
              v-if="locationDetails.href"
              class="photo-dialog__location-link"
              :href="locationDetails.href"
              :aria-label="`Open ${locationDetails.title} in OpenStreetMap`"
              target="_blank"
              rel="noreferrer"
            >
              <span class="photo-dialog__location-road">{{ locationDetails.title }}</span>
              <span class="photo-dialog__location-context">{{ locationDetails.context }}</span>
            </a>
            <span v-else class="photo-dialog__location-copy">
              <span class="photo-dialog__location-road">{{ locationDetails.title }}</span>
              <span class="photo-dialog__location-context">{{ locationDetails.context }}</span>
            </span>
          </dd>
        </div>
      </dl>

      <div v-if="exposureDetails.length" class="photo-dialog__exposure">
        <h4>Exposure</h4>
        <dl class="photo-dialog__exposure-list">
          <div v-for="detail in exposureDetails" :key="detail.label">
            <dt>
              <i :class="detail.icon" aria-hidden="true" />
              <span>{{ detail.label }}</span>
            </dt>
            <dd>{{ detail.value }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <PhotoColorPalette
      :colors="imageColors"
      :status="imageColorsStatus"
      :error="imageColorsError"
      @retry="analyzeImageColors"
    />

    <section class="photo-dialog__detail-group" aria-live="polite">
      <h3>Reactions</h3>
      <dl v-if="activeReactions.length" class="photo-dialog__reaction-list">
        <div v-for="reaction in activeReactions" :key="reaction.type">
          <dt>
            <i :class="reaction.icon" aria-hidden="true" />
            <span>{{ reaction.label }}</span>
          </dt>
          <dd>{{ reactionCounts[reaction.type] }}</dd>
        </div>
      </dl>
      <p v-else class="photo-dialog__empty-reactions">No reactions yet.</p>
    </section>
  </aside>
</template>

<style scoped>
.photo-dialog__detail-group h3,
.photo-dialog__detail-group h4,
.photo-dialog__detail-group dl,
.photo-dialog__detail-group dd {
  margin: 0;
}

.photo-dialog__location-link,
.photo-dialog__location-copy {
  display: grid;
  min-width: 0;
  gap: 0.15rem;
  color: inherit;
  text-align: right;
  text-decoration: none;
}

.photo-dialog__location-road,
.photo-dialog__location-context {
  overflow-wrap: anywhere;
}

.photo-dialog__location-road {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.photo-dialog__location-context {
  color: var(--dialog-muted);
  font-size: 0.59rem;
  line-height: 1.4;
}

.photo-dialog__reaction-list dd {
  font-variant-numeric: tabular-nums;
}

.photo-dialog__reaction-list dt i {
  font-size: 1rem;
}

.photo-dialog__empty-reactions {
  margin: 0;
  color: var(--dialog-muted);
  font-size: 0.66rem;
  line-height: 1.45;
}

.photo-dialog__detail-group + .photo-dialog__detail-group {
  margin-top: clamp(2rem, 4vh, 3.5rem);
}

.photo-dialog__detail-group h3 {
  margin-bottom: 1rem;
  color: var(--dialog-muted);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.photo-dialog__detail-group dl > div {
  display: grid;
  grid-template-columns: minmax(4.8rem, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 0.75rem;
  padding: 0.45rem 0;
}

.photo-dialog__detail-group dt,
.photo-dialog__detail-group dd {
  font-size: 0.66rem;
  line-height: 1.45;
}

.photo-dialog__detail-group dt {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--dialog-muted);
}

.photo-dialog__detail-group dt i {
  flex: 0 0 auto;
  font-size: 0.78rem;
}

.photo-dialog__detail-group dd {
  overflow-wrap: anywhere;
  color: var(--dialog-text);
  text-align: right;
}

.photo-dialog__exposure {
  margin-top: 1.25rem;
}

.photo-dialog__exposure h4 {
  margin-bottom: 0.8rem;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.photo-dialog__exposure-list dd {
  font-variant-numeric: tabular-nums;
}

@media (hover: hover) and (pointer: fine) {
  .photo-dialog__location-link:hover .photo-dialog__location-road {
    text-decoration: underline;
    text-decoration-color: var(--dialog-line);
    text-underline-offset: 0.18em;
  }
}

.photo-dialog__location-link:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.35rem;
}
</style>
