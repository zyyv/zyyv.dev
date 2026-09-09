<script setup lang="ts">
import type { Photo, PhotoDetailRow, PhotoLocationDisplay } from '~/types'
import PhotoDetailGroup from './PhotoDetailGroup.vue'
import PhotoDetailRows from './PhotoDetailRows.vue'

interface Props {
  photo: Photo
}

const props = defineProps<Props>()

const captureDetails = computed<PhotoDetailRow[]>(() => {
  const exif = props.photo.exif
  if (!exif) return []

  const details: Array<PhotoDetailRow | null> = [
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
  ]

  return details.filter((detail): detail is PhotoDetailRow => detail !== null)
})

const exposureDetails = computed<PhotoDetailRow[]>(() => {
  const exif = props.photo.exif
  if (!exif) return []

  const details: Array<PhotoDetailRow | null> = [
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
  ]

  return details.filter((detail): detail is PhotoDetailRow => detail !== null)
})

const locationDetails = computed<PhotoLocationDisplay | null>(() => {
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

const hasCaptureDetails = computed(
  () => captureDetails.value.length || exposureDetails.value.length || locationDetails.value,
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
</script>

<template>
  <PhotoDetailGroup v-if="hasCaptureDetails" title="Capture">
    <PhotoDetailRows :details="captureDetails">
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
            data-cuelume-hover="tick"
            data-cuelume-toggle="scan"
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
    </PhotoDetailRows>

    <div v-if="exposureDetails.length" class="photo-dialog__exposure">
      <h4>Exposure</h4>
      <PhotoDetailRows :details="exposureDetails" />
    </div>
  </PhotoDetailGroup>
</template>

<style scoped>
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

.photo-dialog__exposure {
  margin-top: 1.25rem;
}

.photo-dialog__exposure h4 {
  margin: 0 0 0.8rem;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.photo-dialog__location-link:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.35rem;
}

@media (hover: hover) and (pointer: fine) {
  .photo-dialog__location-link:hover .photo-dialog__location-road {
    text-decoration: underline;
    text-decoration-color: var(--dialog-line);
    text-underline-offset: 0.18em;
  }
}
</style>
