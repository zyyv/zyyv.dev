<script setup lang="ts">
import type { RipplableConfig, RipplableListItem } from 'ripplable'
import type { Photo } from '~/types'
import { Ripplable } from 'ripplable'
import 'ripplable/styles.css'

const props = defineProps<{
  photos: Photo[]
}>()

const items = computed<RipplableListItem[]>(() =>
  props.photos.map((photo) => ({
    id: photo.id,
    photoId: photo.id,
    src: photo.thumbnail,
    alt: photo.filename,
  })),
)

const router = useRouter()

const preferredMotion = usePreferredReducedMotion()
const motionConfig = computed<Partial<RipplableConfig>>(() =>
  preferredMotion.value === 'reduce'
    ? {
        maxWaveAmplitude: 0,
        maxWaveTiltX: 0,
        waveScrollGain: 0,
      }
    : {},
)

function getPhotoId(item: RipplableListItem | null) {
  if (!item || typeof item === 'string' || typeof item.photoId !== 'string') return undefined
  return item.photoId
}

function openPreview(item: RipplableListItem | null) {
  const photoId = getPhotoId(item)
  if (!photoId) return

  void router.push(`/photos/${photoId}`)
}
</script>

<template>
  <div class="ripplable-photos">
    <ClientOnly>
      <Ripplable
        :list="items"
        :config="motionConfig"
        :visible-count="Math.min(36, items.length)"
        :autoplay="preferredMotion === 'reduce' ? false : 2"
        fps
      >
        <template #card="{ item, src, alt }">
          <figure
            class="ripplable-photo"
            role="button"
            tabindex="0"
            data-ripplable-interactive
            :aria-label="`查看 ${alt}`"
            @click="openPreview(item)"
            @keydown.enter="openPreview(item)"
            @keydown.space.prevent="openPreview(item)"
          >
            <div class="ripplable-photo__media">
              <img
                class="ripplable-photo__image"
                :src="src"
                :alt="alt"
                decoding="async"
                draggable="false"
                loading="eager"
              />
            </div>
          </figure>
        </template>
      </Ripplable>
    </ClientOnly>
  </div>
</template>

<style scoped>
.ripplable-photos {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.ripplable-photo {
  position: relative;
  box-sizing: border-box;
  width: 320px;
  height: 384px;
  margin: 0;
  padding: 7px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, currentColor 7%, transparent);
  box-shadow:
    0 1.2rem 3.4rem rgb(0 0 0 / 32%),
    inset 0 1px 0 color-mix(in srgb, currentColor 18%, transparent);
  transition:
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 320ms ease,
    background-color 320ms ease;
  cursor: zoom-in;
  outline: none;
}

.ripplable-photo:focus-visible {
  border-color: currentColor;
  box-shadow:
    0 1.2rem 3.4rem rgb(0 0 0 / 32%),
    0 0 0 2px currentColor;
}

.ripplable-photo__media {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 10px;
  background: #11110f;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 10%, transparent);
}

.ripplable-photo__media::after {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / var(--ripplable-shade-opacity, 0));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 7%);
  content: '';
  pointer-events: none;
}

.ripplable-photo__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transform: scale(1.002);
  transition:
    transform 620ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 420ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .ripplable-photo:hover {
    border-color: color-mix(in srgb, currentColor 28%, transparent);
    background: color-mix(in srgb, currentColor 10%, transparent);
    transform: translateY(-2px);
  }

  .ripplable-photo:hover .ripplable-photo__image {
    filter: contrast(1.025) saturate(1.04);
    transform: scale(1.025);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ripplable-photo,
  .ripplable-photo__image {
    transition: none;
  }
}
</style>
