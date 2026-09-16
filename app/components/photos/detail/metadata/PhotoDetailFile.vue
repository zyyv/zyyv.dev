<script setup lang="ts">
import type { Photo, PhotoDetailRow } from '~/types'
import { usePhotoDetailContext } from '~/composables/photos/detail/usePhotoDetailContext'
import { getFileFormat } from '~/utils/fileFormat'
import PhotoDetailGroup from './PhotoDetailGroup.vue'
import PhotoDetailRows from './PhotoDetailRows.vue'

interface Props {
  photo: Photo
}

const props = defineProps<Props>()
const { currentIndex, photos } = usePhotoDetailContext()

const fileFormat = computed(() => getFileFormat(props.photo.filename))
const sequenceLabel = computed(() => {
  if (currentIndex.value < 0) return ''
  return `${String(currentIndex.value + 1).padStart(2, '0')} / ${photos.value.length}`
})

const fileDetails = computed<PhotoDetailRow[]>(() => [
  // {
  //   icon: props.photo.mediaType === 'video' ? 'i-hugeicons:video-01' : 'i-hugeicons:image-03',
  //   label: 'Type',
  //   value: props.photo.mediaType === 'video' ? 'Video' : 'Photo',
  // },
  {
    icon: props.photo.mediaType === 'video' ? 'i-hugeicons:video-01' : 'i-hugeicons:image-03',
    label: 'Filename',
    value: fileFormat.value[0],
  },
  { icon: 'i-hugeicons:file-01', label: 'Type', value: fileFormat.value[1] || '—' },
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
  // {
  //   icon: 'i-hugeicons:database-01',
  //   label: 'Original',
  //   value: props.photo.originSizeFormatted,
  // },
  // {
  //   icon: 'i-hugeicons:image-03',
  //   label: props.photo.mediaType === 'video' ? 'Poster' : 'Compressed',
  //   value: props.photo.compressedSizeFormatted,
  // },
  {
    icon: 'i-hugeicons:calendar-03',
    label: 'Modified',
    value: formatDate(props.photo.modifiedAt),
  },
])

function formatDate(date: Date | string): string {
  return useDateFormat(date, 'YYYY-MM-DD HH:mm', { locales: 'en-US' }).value
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
  <PhotoDetailGroup title="File">
    <template #title-end>
      <span v-if="sequenceLabel" class="photo-dialog__detail-sequence">
        {{ sequenceLabel }}
      </span>
    </template>
    <PhotoDetailRows :details="fileDetails" />
  </PhotoDetailGroup>
</template>

<style scoped>
.photo-dialog__detail-sequence {
  flex: 0 0 auto;
  color: var(--dialog-muted);
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}
</style>
