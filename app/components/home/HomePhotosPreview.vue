<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { Photo } from '~/types'
import PhotoDetail from '~/components/photos/PhotoDetail.vue'
import { useScrollStage } from '~/composables/useScrollStage'
import { hashFraction } from '~/utils/shuffle'

const props = defineProps<{
  photos: Photo[]
  allPhotos: Photo[]
}>()

const tunnelRef = useTemplateRef<HTMLElement>('tunnel')
const tunnelViewportRef = useTemplateRef<HTMLElement>('tunnelViewport')
const currentPhoto = shallowRef<Photo | null>(null)

const currentIndex = computed(() => {
  if (!currentPhoto.value) return -1
  return props.allPhotos.findIndex((photo) => photo.id === currentPhoto.value?.id)
})

const tunnelHeight = computed(() => {
  const scrollLength = Math.min(Math.max(props.photos.length * 17, 245), 330)
  return `${scrollLength}dvh`
})

function itemStyle(photo: Photo): CSSProperties {
  const width = 14 + hashFraction(photo.id, 11) * 13
  const left = 3 + hashFraction(photo.id, 23) * (94 - width)
  const mobileWidth = 34 + hashFraction(photo.id, 37) * 22
  const mobileLeft = 3 + hashFraction(photo.id, 41) * (94 - mobileWidth)
  const angle = -6.5 + hashFraction(photo.id, 53) * 13
  const top = 7 + hashFraction(photo.id, 67) * 66
  const mobileTop = 8 + hashFraction(photo.id, 71) * 68

  return {
    '--photo-angle': `${angle.toFixed(2)}deg`,
    '--photo-left': `${left.toFixed(2)}%`,
    '--photo-mobile-left': `${mobileLeft.toFixed(2)}%`,
    '--photo-mobile-top': `${mobileTop.toFixed(2)}%`,
    '--photo-mobile-width': `${mobileWidth.toFixed(2)}vw`,
    '--photo-width': `${width.toFixed(2)}vw`,
    aspectRatio: `${photo.width} / ${photo.height}`,
    top: `${top.toFixed(2)}%`,
    zIndex: String(2 + Math.floor(hashFraction(photo.id, 79) * 8)),
  } as CSSProperties
}

useScrollStage(tunnelRef, {
  rebuildOnResize: true,
  setup: () => {
    const viewport = tunnelViewportRef.value
    if (!viewport) return []

    const backgroundAnimations = [
      viewport.querySelector<HTMLElement>('.photo-stream__warp-lines')?.animate(
        [
          { opacity: 0.08, transform: 'rotate(-7deg) scale(0.42)' },
          { opacity: 0.28, transform: 'rotate(-2deg) scale(0.92)', offset: 0.34 },
          { opacity: 0.42, transform: 'rotate(4deg) scale(1.46)', offset: 0.72 },
          { opacity: 0.06, transform: 'rotate(9deg) scale(2.7)' },
        ],
        { duration: 1000, fill: 'both', easing: 'linear' },
      ),
      viewport.querySelector<HTMLElement>('.photo-stream__dust--far')?.animate(
        [
          { opacity: 0.1, transform: 'translate3d(1.5%, -1%, 0) scale(0.7)' },
          { opacity: 0.26, transform: 'translate3d(-1%, 1.5%, 0) scale(1.35)', offset: 0.58 },
          { opacity: 0.04, transform: 'translate3d(-2.5%, 3%, 0) scale(2.5)' },
        ],
        { duration: 1000, fill: 'both', easing: 'linear' },
      ),
      viewport.querySelector<HTMLElement>('.photo-stream__dust--near')?.animate(
        [
          { opacity: 0.04, transform: 'translate3d(-1%, 1%, 0) scale(0.5)' },
          { opacity: 0.32, transform: 'translate3d(1.5%, -1.5%, 0) scale(1.5)', offset: 0.66 },
          { opacity: 0, transform: 'translate3d(4%, -4%, 0) scale(4.2)' },
        ],
        { duration: 1000, fill: 'both', easing: 'linear' },
      ),
      viewport.querySelector<HTMLElement>('.photo-stream__warp-core')?.animate(
        [
          { opacity: 0.05, transform: 'translate(-50%, -50%) scale(0.45)' },
          { opacity: 0.24, transform: 'translate(-50%, -50%) scale(1.05)', offset: 0.48 },
          { opacity: 0.1, transform: 'translate(-50%, -50%) scale(1.7)', offset: 0.78 },
          { opacity: 0, transform: 'translate(-50%, -50%) scale(3)' },
        ],
        { duration: 1000, fill: 'both', easing: 'linear' },
      ),
    ].filter((animation): animation is Animation => animation !== undefined)

    const items = Array.from(viewport.querySelectorAll<HTMLElement>('.photo-stream__item'))
    const lastIndex = Math.max(items.length - 1, 1)

    const photoAnimations = items.map((item, index) => {
      const centerX = viewport.clientWidth / 2 - (item.offsetLeft + item.offsetWidth / 2)
      const centerY = viewport.clientHeight / 2 - (item.offsetTop + item.offsetHeight / 2)
      const delay = (index / lastIndex) * 0.74
      const arrival = delay + 0.085
      const holdUntil = arrival + 0.045
      const departure = Math.min(holdUntil + 0.13, 1)
      const exitX = -centerX * 0.42
      const exitY = -centerY * 0.42

      const animation = item.animate(
        [
          {
            opacity: 0,
            filter: 'blur(1rem)',
            pointerEvents: 'none',
            transform: `translate3d(${centerX}px, ${centerY}px, 0) rotate(0deg) scale(0.035)`,
            offset: 0,
          },
          {
            opacity: 0,
            filter: 'blur(1rem)',
            pointerEvents: 'none',
            transform: `translate3d(${centerX}px, ${centerY}px, 0) rotate(0deg) scale(0.035)`,
            offset: delay,
          },
          {
            opacity: 0.46,
            filter: 'blur(0.35rem)',
            pointerEvents: 'auto',
            transform: `translate3d(${centerX * 0.58}px, ${centerY * 0.58}px, 0) rotate(0deg) scale(0.38)`,
            offset: delay + (arrival - delay) * 0.48,
          },
          {
            opacity: 1,
            filter: 'blur(0)',
            pointerEvents: 'auto',
            transform: 'translate3d(0, 0, 0) rotate(var(--photo-angle)) scale(1)',
            offset: arrival,
          },
          {
            opacity: 1,
            filter: 'blur(0)',
            pointerEvents: 'auto',
            transform: 'translate3d(0, 0, 0) rotate(var(--photo-angle)) scale(1.04)',
            offset: holdUntil,
          },
          {
            opacity: 0,
            filter: 'blur(0.7rem)',
            pointerEvents: 'none',
            transform: `translate3d(${exitX}px, ${exitY}px, 0) rotate(var(--photo-angle)) scale(1.62)`,
            offset: departure,
          },
          {
            opacity: 0,
            filter: 'blur(0.7rem)',
            pointerEvents: 'none',
            transform: `translate3d(${exitX}px, ${exitY}px, 0) rotate(var(--photo-angle)) scale(1.62)`,
            offset: 1,
          },
        ],
        {
          duration: 1000,
          fill: 'both',
          easing: 'linear',
        },
      )

      animation.pause()
      return animation
    })

    return [...backgroundAnimations, ...photoAnimations]
  },
})

function openPreview(photo: Photo) {
  currentPhoto.value = photo
  document.body.style.overflow = 'hidden'
}

function closePreview() {
  currentPhoto.value = null
  document.body.style.overflow = ''
}

function showPreviousPhoto() {
  if (currentIndex.value <= 0) return
  currentPhoto.value = props.allPhotos[currentIndex.value - 1] ?? null
}

function showNextPhoto() {
  if (currentIndex.value < 0 || currentIndex.value >= props.allPhotos.length - 1) return
  currentPhoto.value = props.allPhotos[currentIndex.value + 1] ?? null
}

function selectPhoto(photo: Photo) {
  currentPhoto.value = photo
}

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <section id="photos" class="photo-stream" aria-labelledby="photos-title">
    <header class="photo-stream__header">
      <div class="photo-stream__intro">
        <p>Light, weather, and ordinary moments worth keeping.</p>
        <NuxtLink to="/photos">
          <span>View all photos</span>
          <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
        </NuxtLink>
      </div>

      <h2 id="photos-title">
        <span>Photo</span>
        <span>/ moments</span>
      </h2>
    </header>

    <div
      v-if="photos.length"
      ref="tunnel"
      class="photo-stream__tunnel"
      :style="{ height: tunnelHeight }"
    >
      <div ref="tunnelViewport" class="photo-stream__gallery">
        <div class="photo-stream__space" aria-hidden="true">
          <span class="photo-stream__warp-lines" />
          <span class="photo-stream__dust photo-stream__dust--far" />
          <span class="photo-stream__dust photo-stream__dust--near" />
          <span class="photo-stream__warp-core" />
        </div>

        <div class="photo-stream__tunnel-caption">
          <p class="photo-stream__tunnel-copy">
            More light, places, and accidental frames live in the full archive.
          </p>
          <p class="photo-stream__tunnel-label" aria-hidden="true">Scroll through the frame</p>
        </div>

        <button
          v-for="(photo, index) in photos"
          :key="photo.id"
          type="button"
          class="photo-stream__item"
          :style="itemStyle(photo)"
          :aria-label="`Open photo ${index + 1}`"
          @click="openPreview(photo)"
        >
          <span class="photo-stream__media">
            <img :src="photo.thumbnail" alt="" loading="lazy" />
            <span class="photo-stream__number">{{ String(index + 1).padStart(2, '0') }}</span>
          </span>
        </button>
      </div>
    </div>

    <div v-else class="photo-stream__empty">No photos available</div>

    <div class="photo-stream__archive">
      <NuxtLink to="/photos">Enter the archive ↗</NuxtLink>
    </div>

    <PhotoDetail
      :photo="currentPhoto"
      :photos="allPhotos"
      :visible="currentPhoto !== null"
      @close="closePreview"
      @prev="showPreviousPhoto"
      @next="showNextPhoto"
      @select="selectPhoto"
    />
  </section>
</template>

<style scoped>
.photo-stream {
  position: relative;
  padding: clamp(3rem, 6vw, 6rem) 0 0;
  background: inherit;
  color: inherit;
}

.photo-stream__header {
  min-height: 58dvh;
  padding: 0 clamp(1rem, 4vw, 4rem);
}

.photo-stream__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  font-size: 0.72rem;
  line-height: 1.5;
}

.photo-stream__intro p {
  width: min(23rem, 42vw);
  margin: 0;
}

.photo-stream__intro a,
.photo-stream__archive a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid currentColor;
  color: inherit;
  text-decoration: none;
  transition: opacity 240ms ease;
}

.photo-stream__intro a:hover,
.photo-stream__archive a:hover {
  opacity: 0.55;
}

.photo-stream__header h2 {
  display: grid;
  margin: clamp(4.5rem, 11vh, 8rem) 0 0;
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(4.8rem, 13vw, 12.5rem);
  font-weight: 500;
  line-height: 0.76;
  letter-spacing: -0.085em;
}

.photo-stream__header h2 span:last-child {
  margin-left: 14vw;
  opacity: 0.45;
}

.photo-stream__tunnel {
  position: relative;
}

.photo-stream__gallery {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100dvh;
  overflow: clip;
  perspective: 80rem;
  isolation: isolate;
}

.photo-stream__gallery::before {
  position: absolute;
  z-index: 1;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, transparent 0 13%, rgb(0 0 0 / 5%) 58%, rgb(0 0 0 / 18%)),
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, currentColor 7%, transparent),
      transparent 38%
    );
  content: '';
  pointer-events: none;
}

.photo-stream__space,
.photo-stream__space span {
  position: absolute;
  pointer-events: none;
}

.photo-stream__space {
  z-index: 0;
  inset: 0;
  overflow: hidden;
}

.photo-stream__warp-lines {
  inset: -72vmax;
  background: repeating-conic-gradient(
    from 2deg at 50% 50%,
    color-mix(in srgb, currentColor 18%, transparent) 0deg 0.045deg,
    transparent 0.045deg 3.2deg
  );
  opacity: 0.08;
  transform-origin: center;
  mask-image: radial-gradient(circle, transparent 0 7%, #000 18% 68%, transparent 88%);
}

.photo-stream__dust {
  inset: -18%;
  background-repeat: repeat;
  transform-origin: center;
}

.photo-stream__dust--far {
  background-image:
    radial-gradient(
      circle,
      color-mix(in srgb, currentColor 34%, transparent) 0 0.06rem,
      transparent 0.08rem
    ),
    radial-gradient(
      circle,
      color-mix(in srgb, currentColor 22%, transparent) 0 0.045rem,
      transparent 0.07rem
    );
  background-position:
    1rem 2rem,
    5rem 7rem;
  background-size:
    7.4rem 7.4rem,
    11rem 11rem;
  opacity: 0.1;
}

.photo-stream__dust--near {
  background-image:
    radial-gradient(
      ellipse,
      color-mix(in srgb, currentColor 45%, transparent) 0 0.055rem,
      transparent 0.22rem
    ),
    radial-gradient(
      ellipse,
      color-mix(in srgb, currentColor 32%, transparent) 0 0.045rem,
      transparent 0.17rem
    );
  background-position:
    3rem 1rem,
    8rem 5rem;
  background-size:
    13rem 13rem,
    17rem 17rem;
  filter: blur(0.04rem);
  opacity: 0.04;
}

.photo-stream__warp-core {
  top: 50%;
  left: 50%;
  width: min(26vw, 22rem);
  aspect-ratio: 1;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 0 18%,
    color-mix(in srgb, currentColor 7%, transparent) 48%,
    transparent 72%
  );
  box-shadow:
    inset 0 0 4rem color-mix(in srgb, currentColor 8%, transparent),
    0 0 7rem color-mix(in srgb, currentColor 6%, transparent);
  opacity: 0.05;
  transform: translate(-50%, -50%) scale(0.45);
}

.photo-stream__tunnel-caption {
  position: absolute;
  z-index: 20;
  right: clamp(1rem, 4vw, 4rem);
  bottom: 2rem;
  left: clamp(1rem, 4vw, 4rem);
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  pointer-events: none;
}

.photo-stream__tunnel-caption p {
  margin: 0;
}

.photo-stream__tunnel-copy {
  width: min(23rem, 42vw);
  font-size: 0.68rem;
  line-height: 1.5;
  opacity: 0.58;
}

.photo-stream__tunnel-label {
  flex: none;
  font-size: 0.6rem;
  letter-spacing: 0.09em;
  opacity: 0.38;
  text-transform: uppercase;
}

.photo-stream__item {
  position: absolute;
  left: var(--photo-left);
  width: var(--photo-width);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  cursor: zoom-in;
  opacity: 0;
  transform-origin: center;
  will-change: filter, opacity, transform;
}

.photo-stream__media {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, currentColor 8%, transparent);
  box-shadow: 0 1.2rem 3.5rem color-mix(in srgb, currentColor 11%, transparent);
  will-change: transform;
}

.photo-stream__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.04);
  transition:
    filter 450ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-stream__item:hover .photo-stream__media img,
.photo-stream__item:focus-visible .photo-stream__media img {
  filter: grayscale(0) contrast(1);
  transform: scale(1.025);
}

.photo-stream__item:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.4rem;
}

.photo-stream__number {
  position: absolute;
  right: 0.55rem;
  bottom: 0.45rem;
  color: rgb(255 255 255 / 78%);
  font-size: 0.58rem;
  line-height: 1;
}

.photo-stream__archive {
  display: flex;
  align-items: end;
  justify-content: flex-end;
  gap: 2rem;
  padding: clamp(6rem, 12vw, 11rem) clamp(1rem, 4vw, 4rem);
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  font-size: 0.72rem;
  line-height: 1.5;
}

.photo-stream__empty {
  display: grid;
  min-height: 50dvh;
  place-items: center;
  font-size: 0.75rem;
  opacity: 0.58;
}

@media (max-width: 767.9px) {
  .photo-stream {
    padding-top: 6rem;
  }

  .photo-stream__header {
    min-height: 31rem;
    padding: 0 1rem;
  }

  .photo-stream__intro {
    display: grid;
  }

  .photo-stream__intro p {
    width: min(18rem, 78vw);
  }

  .photo-stream__intro a {
    width: max-content;
  }

  .photo-stream__header h2 {
    margin-top: 5rem;
    font-size: clamp(4.15rem, 20vw, 6rem);
    line-height: 0.8;
  }

  .photo-stream__header h2 span:last-child {
    margin-left: 0;
  }

  .photo-stream__item {
    left: var(--photo-mobile-left);
    top: var(--photo-mobile-top) !important;
    width: var(--photo-mobile-width);
  }

  .photo-stream__warp-core {
    width: 48vw;
  }

  .photo-stream__tunnel-caption {
    display: grid;
    gap: 0.75rem;
  }

  .photo-stream__tunnel-copy {
    width: min(18rem, 78vw);
  }

  .photo-stream__tunnel-label {
    justify-self: end;
  }

  .photo-stream__archive {
    padding: 6rem 1rem;
  }

  .photo-stream__archive a {
    width: max-content;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-stream__tunnel {
    height: auto !important;
  }

  .photo-stream__gallery {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    height: auto;
    gap: 1rem;
    padding: 1rem;
    overflow: visible;
  }

  .photo-stream__space {
    display: none;
  }

  .photo-stream__tunnel-caption {
    position: relative;
    right: auto;
    bottom: auto;
    left: auto;
    display: block;
    grid-column: 1 / -1;
    padding-bottom: 1rem;
  }

  .photo-stream__tunnel-copy {
    width: min(23rem, 78vw);
  }

  .photo-stream__tunnel-label {
    display: none;
  }

  .photo-stream__item {
    position: relative;
    top: auto !important;
    left: auto;
    width: auto;
    opacity: 1 !important;
    transform: none !important;
  }

  .photo-stream__media {
    clip-path: inset(0) !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .photo-stream__media img,
  .photo-stream__intro a,
  .photo-stream__archive a {
    transition: none;
  }
}
</style>
