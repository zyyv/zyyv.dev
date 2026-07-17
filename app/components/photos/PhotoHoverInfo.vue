<script setup lang="ts">
import type { Photo } from '~/types'
import { getPhotoCaptureSummary } from '~/utils/photoCapture'

const props = defineProps<{
  photo: Photo
}>()

const summary = computed(() => getPhotoCaptureSummary(props.photo))
const fileFactsLine = computed(() => summary.value.fileFacts.join(' · '))
</script>

<template>
  <div class="photo-hover-info" aria-hidden="true">
    <div class="photo-hover-info__identity">
      <div v-if="summary.deviceName && summary.deviceType" class="photo-hover-info__device">
        <i
          v-if="summary.deviceType === 'phone'"
          class="i-hugeicons:smart-phone-01"
          aria-hidden="true"
        />
        <i v-else class="i-hugeicons:camera-01" aria-hidden="true" />
        <span>{{ summary.deviceName }}</span>
      </div>

      <div class="photo-hover-info__file">{{ fileFactsLine }}</div>
    </div>

    <div v-if="summary.items.length" class="photo-hover-info__parameters">
      <span v-for="item in summary.items" :key="item.label">
        <small>{{ item.label }}</small>
        {{ item.value }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.photo-hover-info {
  position: absolute;
  inset-inline: 0.65rem;
  bottom: 0.65rem;
  display: grid;
  gap: 0.52rem;
  padding: 0.7rem 0.78rem;
  overflow: hidden;
  border-radius: 0.5rem;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 11%), rgb(255 255 255 / 2%)), rgb(12 12 11 / 16%);
  color: rgb(250 250 247 / 96%);
  font-family: 'DM Sans', sans-serif;
  opacity: 0;
  pointer-events: none;
  text-shadow: 0 1px 0.3rem rgb(0 0 0 / 48%);
  transform: translateY(0.55rem);
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-backdrop-filter: blur(1.5rem) saturate(1.45) brightness(0.86);
  backdrop-filter: blur(1.5rem) saturate(1.45) brightness(0.86);
}

.photo-hover-info__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
  gap: 0.55rem;
}

.photo-hover-info__device {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.42rem;
  font-size: 0.68rem;
  font-weight: 560;
  letter-spacing: -0.01em;
}

.photo-hover-info__device::after {
  width: 1px;
  height: 0.75rem;
  margin-left: 0.15rem;
  background: rgb(255 255 255 / 24%);
  content: '';
}

.photo-hover-info__device i {
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  opacity: 0.76;
}

.photo-hover-info__device span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-hover-info__file {
  flex: 0 0 auto;
  min-width: 0;
  color: rgb(250 250 247 / 70%);
  font-size: 0.58rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.photo-hover-info__parameters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.8rem;
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.photo-hover-info__parameters span {
  white-space: nowrap;
}

.photo-hover-info__parameters small {
  margin-right: 0.18rem;
  color: rgb(250 250 247 / 58%);
  font: inherit;
  text-transform: uppercase;
}

@media (max-width: 479.9px) {
  .photo-hover-info__identity {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }

  .photo-hover-info__device::after {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-hover-info {
    transition: none;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .photo-hover-info {
    background: rgb(15 15 14 / 94%);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
</style>
