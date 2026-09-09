<script setup lang="ts">
import type { Photo, PhotoPreviewVariant } from '~/types'

interface Props {
  photo: Photo
  variant: PhotoPreviewVariant
}

interface Emits {
  change: [variant: PhotoPreviewVariant]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const hoveredVariant = shallowRef<PhotoPreviewVariant | null>(null)

const photoPreviewVariants: readonly PhotoPreviewVariant[] = [
  'thumbnail',
  'compressed',
  'origin',
  'blurhash',
]

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
  compressed: { label: 'Compress', description: props.photo.compressedSizeFormatted },
  origin: { label: 'Original', description: props.photo.originSizeFormatted },
  blurhash: { label: 'BlurHash', description: 'Encoded' },
}))

function previewLabel(variant: PhotoPreviewVariant) {
  return variantDetails.value[variant].label
}

function previewDescription(variant: PhotoPreviewVariant) {
  return variantDetails.value[variant].description
}

function setHoveredVariant(variant: PhotoPreviewVariant) {
  hoveredVariant.value = variant
}

function clearHoveredVariant() {
  hoveredVariant.value = null
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
        :class="{
          'is-active': item === variant,
          'is-hovered': item === hoveredVariant,
        }"
        :aria-pressed="item === variant"
        data-cuelume-hover="tick"
        data-cuelume-toggle="toggle"
        @click="emit('change', item)"
        @mouseenter="setHoveredVariant(item)"
        @mouseleave="clearHoveredVariant"
      >
        <span class="photo-preview-panel__option-main">
          <i :class="previewIcons[item]" aria-hidden="true" />
          <span class="photo-preview-panel__option-copy">
            <span class="photo-preview-panel__option-label">{{ previewLabel(item) }}</span>
            <span class="photo-preview-panel__option-description">
              {{ previewDescription(item) }}
            </span>
          </span>
        </span>
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem 0.55rem;
}

.photo-preview-panel__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 0.75rem;
  padding: 0.55rem 0.65rem;
  border: 1px dashed transparent;
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

.photo-preview-panel__option-main {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
  gap: 0.55rem;
  font-size: 0.66rem;
}

.photo-preview-panel__option-main i {
  flex: 0 0 auto;
  font-size: 0.78rem;
}

.photo-preview-panel__option-copy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  min-width: 0;
  flex: 1 1 auto;
  gap: 0.75rem;
}

.photo-preview-panel__option-label,
.photo-preview-panel__option-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 180ms ease;
}

.photo-preview-panel__option-label {
  min-width: 0;
  flex: 1 1 auto;
  line-height: 1.2;
}

.photo-preview-panel__option-description {
  min-width: 0;
  max-width: 50%;
  flex: 0 1 auto;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  line-height: 1.25;
  opacity: 1;
  text-align: right;
}

@media (min-width: 48rem) {
  .photo-preview-panel__option-copy {
    display: grid;
    gap: 0;
  }

  .photo-preview-panel__option-label,
  .photo-preview-panel__option-description {
    grid-area: 1 / 1;
  }

  .photo-preview-panel__option-label {
    opacity: 1;
  }

  .photo-preview-panel__option-description {
    max-width: none;
    opacity: 0;
    text-align: left;
  }

  .photo-preview-panel__option.is-hovered .photo-preview-panel__option-label {
    opacity: 0;
  }

  .photo-preview-panel__option.is-hovered .photo-preview-panel__option-description {
    opacity: 1;
  }
}

.photo-preview-panel__option.is-active {
  border-color: transparent;
  background: color-mix(in srgb, var(--dialog-text) 6%, transparent);
  color: var(--dialog-text);
}

.photo-preview-panel__option:focus-visible {
  outline: none;
}

@media (max-width: 767.9px) {
  .photo-preview-panel {
    padding-bottom: 1rem;
  }

  .photo-preview-panel__heading {
    margin-bottom: 0.7rem;
  }

  .photo-preview-panel__options {
    gap: 0.2rem 0.4rem;
  }

  .photo-preview-panel__option {
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
  }

  .photo-preview-panel__option-main {
    gap: 0.4rem;
  }

  .photo-preview-panel__option-copy {
    gap: 0.5rem;
  }
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
  .photo-preview-panel__option,
  .photo-preview-panel__option-label,
  .photo-preview-panel__option-description {
    transition-duration: 1ms;
  }
}
</style>
