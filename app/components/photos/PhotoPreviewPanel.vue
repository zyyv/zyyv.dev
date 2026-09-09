<script setup lang="ts">
import type { Photo } from '~/types'
import { photoPreviewVariants, type PhotoPreviewVariant } from './photo-preview.types'

interface Props {
  photo: Photo
  variant: PhotoPreviewVariant
}

interface Emits {
  change: [variant: PhotoPreviewVariant]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const previewIcons: Record<PhotoPreviewVariant, string> = {
  thumbnail: 'i-hugeicons:image-crop',
  compressed: 'i-hugeicons:image-composition',
  origin: 'i-hugeicons:image-03',
  blurhash: 'i-hugeicons:colors',
}

const variantDetails = computed<
  Record<PhotoPreviewVariant, { label: string; description: string }>
>(() => ({
  thumbnail: { label: 'Thumbnail', description: props.photo.thumbnailSizeFormatted },
  compressed: { label: 'Compressed', description: props.photo.compressedSizeFormatted },
  origin: { label: 'Original', description: props.photo.originSizeFormatted },
  blurhash: { label: 'BlurHash', description: 'Encoded placeholder' },
}))

function previewLabel(variant: PhotoPreviewVariant) {
  return variantDetails.value[variant].label
}

function previewDescription(variant: PhotoPreviewVariant) {
  return variantDetails.value[variant].description
}
</script>

<template>
  <section
    v-if="photo.mediaType === 'image'"
    class="photo-preview-panel"
    aria-labelledby="preview-title"
  >
    <div class="photo-preview-panel__heading">
      <h3 id="preview-title">Preview</h3>
    </div>

    <div class="photo-preview-panel__options" role="list" aria-label="Image preview sources">
      <button
        v-for="item in photoPreviewVariants"
        :key="item"
        type="button"
        class="photo-preview-panel__option"
        :class="{ 'is-active': item === variant }"
        :aria-pressed="item === variant"
        @click="emit('change', item)"
      >
        <span class="photo-preview-panel__option-main">
          <i :class="previewIcons[item]" aria-hidden="true" />
          <span>{{ previewLabel(item) }}</span>
        </span>
        <span class="photo-preview-panel__option-meta">{{ previewDescription(item) }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.photo-preview-panel {
  padding-bottom: clamp(1.5rem, 3vh, 2.25rem);
  border-bottom: 1px dashed var(--dialog-line);
}

.photo-preview-panel__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.photo-preview-panel__heading h3 {
  color: var(--dialog-muted);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
}

.photo-preview-panel__options {
  display: grid;
  gap: 0.25rem;
}

.photo-preview-panel__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 0.75rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dialog-muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;
}

.photo-preview-panel__option-main,
.photo-preview-panel__option-meta {
  display: flex;
  align-items: center;
}

.photo-preview-panel__option-main {
  min-width: 0;
  gap: 0.55rem;
  font-size: 0.66rem;
}

.photo-preview-panel__option-main i {
  flex: 0 0 auto;
  font-size: 0.78rem;
}

.photo-preview-panel__option-meta {
  flex: 0 0 auto;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  white-space: nowrap;
}

.photo-preview-panel__option.is-active {
  border-color: transparent;
  background: color-mix(in srgb, var(--dialog-text) 6%, transparent);
  color: var(--dialog-text);
}

.photo-preview-panel__option:focus-visible {
  outline: none;
}

@media (hover: hover) and (pointer: fine) {
  .photo-preview-panel__option:hover {
    border-color: var(--dialog-line);
    color: var(--dialog-text);
  }

  .photo-preview-panel__option.is-active:hover {
    border-color: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-preview-panel__option {
    transition-duration: 1ms;
  }
}
</style>
