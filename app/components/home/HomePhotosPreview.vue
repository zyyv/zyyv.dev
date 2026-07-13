<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoDetail from '~/components/photos/PhotoDetail.vue'

const props = defineProps<{
  photos: Photo[]
}>()

const currentPhoto = shallowRef<Photo | null>(null)
const preferredNames = [
  'DSC03176.JPG',
  'DSC03175.JPG',
  'DSC03171.JPG',
  'DSC01982.JPG',
  'DSC02911.JPG',
]

const previewPhotos = computed(() => {
  const preferred = preferredNames
    .map((name) =>
      props.photos.find((photo) => photo.filename?.includes(name) || photo.id.includes(name)),
    )
    .filter((photo): photo is Photo => !!photo)

  return preferred.length === preferredNames.length ? preferred : props.photos.slice(0, 5)
})

const currentIndex = computed(() => {
  if (!currentPhoto.value) return -1
  return props.photos.findIndex((photo) => photo.id === currentPhoto.value?.id)
})

function previewSrc(photo: Photo) {
  return photo.thumbnail || photo.src
}

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
  currentPhoto.value = props.photos[currentIndex.value - 1] ?? null
}

function showNextPhoto() {
  if (currentIndex.value < 0 || currentIndex.value >= props.photos.length - 1) return
  currentPhoto.value = props.photos[currentIndex.value + 1] ?? null
}

function selectPhoto(photo: Photo) {
  currentPhoto.value = photo
}

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <section id="photos" class="photo-editorial" aria-labelledby="photos-title">
    <div class="photo-editorial__sticky">
      <header class="photo-editorial__header">
        <div class="photo-editorial__intro">
          <p>Light, weather, and ordinary moments worth keeping.</p>
          <NuxtLink to="/photos">
            <span>View all photos</span>
            <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
          </NuxtLink>
        </div>

        <h2 id="photos-title">
          <span>Selected</span>
          <span>/ moments</span>
        </h2>
      </header>

      <div v-if="previewPhotos.length" class="photo-editorial__gallery">
        <button
          v-for="(photo, index) in previewPhotos"
          :key="photo.id"
          type="button"
          class="photo-editorial__item"
          :class="`photo-editorial__item--${index + 1}`"
          :aria-label="`Open photo ${index + 1}`"
          @click="openPreview(photo)"
        >
          <img :src="previewSrc(photo)" alt="" />
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
        </button>
      </div>

      <div v-else class="photo-editorial__empty">
        <p>No photos available</p>
      </div>
    </div>

    <PhotoDetail
      :photo="currentPhoto"
      :photos="photos"
      :visible="currentPhoto !== null"
      @close="closePreview"
      @prev="showPreviousPhoto"
      @next="showNextPhoto"
      @select="selectPhoto"
    />
  </section>
</template>

<style scoped>
.photo-editorial {
  position: relative;
  min-height: 180dvh;
  padding: clamp(7rem, 13vw, 13rem) clamp(1rem, 4vw, 4rem);
}

.photo-editorial__header {
  position: relative;
  min-height: 58dvh;
}

.photo-editorial__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  font-size: 0.72rem;
  line-height: 1.5;
}

.photo-editorial__intro p {
  width: min(23rem, 42vw);
  margin: 0;
}

.photo-editorial__intro a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid currentColor;
  color: inherit;
  text-decoration: none;
  transition: opacity 240ms ease;
}

.photo-editorial__intro a:hover {
  opacity: 0.55;
}

.photo-editorial__header h2 {
  display: grid;
  margin: clamp(4.5rem, 11vh, 8rem) 0 0;
  font-size: clamp(4.8rem, 13vw, 12.5rem);
  font-weight: 500;
  line-height: 0.76;
  letter-spacing: -0.085em;
}

.photo-editorial__header h2 span:last-child {
  margin-left: 14vw;
}

.photo-editorial__gallery {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(11, minmax(4rem, 7vw));
  gap: clamp(0.75rem, 1.5vw, 1.5rem);
}

.photo-editorial__item {
  position: relative;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: zoom-in;
}

.photo-editorial__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.04);
  transition:
    filter 450ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-editorial__item:hover img {
  filter: grayscale(0) contrast(1);
  transform: scale(1.025);
}

.photo-editorial__item:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.4rem;
}

.photo-editorial__item span {
  position: absolute;
  right: 0.55rem;
  bottom: 0.45rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.58rem;
  line-height: 1;
}

.photo-editorial__item--1 {
  grid-column: 1 / span 5;
  grid-row: 1 / span 4;
}

.photo-editorial__item--2 {
  grid-column: 9 / span 4;
  grid-row: 2 / span 3;
}

.photo-editorial__item--3 {
  grid-column: 4 / span 5;
  grid-row: 5 / span 3;
}

.photo-editorial__item--4 {
  grid-column: 9 / span 3;
  grid-row: 6 / span 4;
}

.photo-editorial__item--5 {
  grid-column: 1 / span 3;
  grid-row: 8 / span 3;
}

.photo-editorial__empty {
  display: grid;
  min-height: 50dvh;
  place-items: center;
  border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  font-size: 0.75rem;
  opacity: 0.58;
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .photo-editorial__item {
      animation: photo-enter both cubic-bezier(0.16, 1, 0.3, 1);
      animation-timeline: view();
      animation-range: entry 5% entry 72%;
    }
  }
}

@keyframes photo-enter {
  from {
    opacity: 0;
    transform: translateY(3rem);
  }
}

@media (max-width: 767.9px) {
  .photo-editorial {
    min-height: 0;
    padding: 8rem 1rem;
  }

  .photo-editorial__header {
    min-height: 34rem;
  }

  .photo-editorial__intro {
    display: grid;
  }

  .photo-editorial__intro p {
    width: min(18rem, 78vw);
  }

  .photo-editorial__intro a {
    width: max-content;
  }

  .photo-editorial__header h2 {
    margin-top: 5rem;
    font-size: clamp(4.15rem, 20vw, 6rem);
    line-height: 0.8;
  }

  .photo-editorial__header h2 span:last-child {
    margin-left: 0;
  }

  .photo-editorial__gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(13, 5rem);
    gap: 0.75rem;
  }

  .photo-editorial__item--1 {
    grid-column: 1 / -1;
    grid-row: 1 / span 4;
  }

  .photo-editorial__item--2 {
    grid-column: 2;
    grid-row: 5 / span 3;
  }

  .photo-editorial__item--3 {
    grid-column: 1;
    grid-row: 6 / span 4;
  }

  .photo-editorial__item--4 {
    grid-column: 2;
    grid-row: 8 / span 4;
  }

  .photo-editorial__item--5 {
    grid-column: 1;
    grid-row: 10 / span 3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-editorial__intro a,
  .photo-editorial__item img {
    transition: none;
  }
}

/* The chapter stays in place while the photographs unfold from its title. */
.photo-editorial {
  min-height: 270dvh;
  padding: 0;
  view-timeline-name: --photo-stage;
  view-timeline-axis: block;
}

.photo-editorial__sticky {
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
  padding: clamp(5.5rem, 7vw, 7rem) clamp(1rem, 4vw, 4rem) clamp(1.5rem, 3vw, 3rem);
  isolation: isolate;
}

.photo-editorial__header {
  position: static;
  min-height: 0;
}

.photo-editorial__intro {
  position: relative;
  z-index: 8;
}

.photo-editorial__header h2 {
  position: absolute;
  top: 50%;
  right: clamp(1rem, 4vw, 4rem);
  left: clamp(1rem, 4vw, 4rem);
  z-index: 3;
  margin: 0;
  transform: translateY(-50%);
  pointer-events: none;
}

.photo-editorial__gallery {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: block;
}

.photo-editorial__item {
  position: absolute;
  display: block;
  overflow: hidden;
  will-change: clip-path, transform;
}

.photo-editorial__item--1 {
  top: 10%;
  left: 4%;
  z-index: 2;
  width: min(32vw, 31rem);
  height: 34vh;
}

.photo-editorial__item--2 {
  top: 9%;
  right: 5%;
  z-index: 4;
  width: min(23vw, 22rem);
  height: 35vh;
}

.photo-editorial__item--3 {
  bottom: 5%;
  left: 27%;
  z-index: 4;
  width: min(36vw, 36rem);
  height: 32vh;
}

.photo-editorial__item--4 {
  right: 8%;
  bottom: -4%;
  z-index: 2;
  width: min(18vw, 18rem);
  height: 43vh;
}

.photo-editorial__item--5 {
  bottom: 5%;
  left: 6%;
  z-index: 4;
  width: min(17vw, 17rem);
  height: 25vh;
}

.photo-editorial__empty {
  min-height: 100%;
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .photo-editorial__header h2 span,
    .photo-editorial__item,
    .photo-editorial__intro {
      animation-duration: 1ms;
      animation-fill-mode: both;
      animation-timing-function: linear;
      animation-timeline: --photo-stage;
      animation-range: cover 0% cover 100%;
    }

    .photo-editorial__header h2 span:first-child {
      animation-name: photo-title-first;
    }

    .photo-editorial__header h2 span:last-child {
      animation-name: photo-title-last;
    }

    .photo-editorial__intro {
      animation-name: photo-intro-drift;
    }

    .photo-editorial__item--1 {
      animation-name: photo-unfold-1;
    }

    .photo-editorial__item--2 {
      animation-name: photo-unfold-2;
    }

    .photo-editorial__item--3 {
      animation-name: photo-unfold-3;
    }

    .photo-editorial__item--4 {
      animation-name: photo-unfold-4;
    }

    .photo-editorial__item--5 {
      animation-name: photo-unfold-5;
    }
  }
}

@keyframes photo-title-first {
  from {
    transform: translate3d(5vw, 10vh, 0);
  }
  to {
    transform: translate3d(-8vw, -8vh, 0);
  }
}

@keyframes photo-title-last {
  from {
    transform: translate3d(-8vw, 4vh, 0);
  }
  to {
    transform: translate3d(8vw, -2vh, 0);
  }
}

@keyframes photo-intro-drift {
  from {
    opacity: 0.25;
    transform: translate3d(0, 6vh, 0);
  }
  55%,
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes photo-unfold-1 {
  0% {
    clip-path: inset(48% 48% 48% 48%);
    transform: translate3d(33vw, 29vh, 0) scale(0.12) rotate(-4deg);
  }
  56%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0);
  }
}

@keyframes photo-unfold-2 {
  0%,
  10% {
    clip-path: inset(49% 49% 49% 49%);
    transform: translate3d(-25vw, 32vh, 0) scale(0.1) rotate(5deg);
  }
  66%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0);
  }
}

@keyframes photo-unfold-3 {
  0%,
  20% {
    clip-path: inset(49% 49% 49% 49%);
    transform: translate3d(4vw, -20vh, 0) scale(0.1);
  }
  76%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes photo-unfold-4 {
  0%,
  28% {
    clip-path: inset(49% 49% 49% 49%);
    transform: translate3d(-24vw, -24vh, 0) scale(0.08) rotate(-5deg);
  }
  86%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0);
  }
}

@keyframes photo-unfold-5 {
  0%,
  36% {
    clip-path: inset(49% 49% 49% 49%);
    transform: translate3d(29vw, -23vh, 0) scale(0.08) rotate(6deg);
  }
  94%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0);
  }
}

@media (max-width: 767.9px) {
  .photo-editorial {
    min-height: 240dvh;
    padding: 0;
  }

  .photo-editorial__sticky {
    padding: 5.5rem 1rem 5rem;
  }

  .photo-editorial__intro {
    display: flex;
    align-items: flex-start;
  }

  .photo-editorial__intro p {
    width: min(12rem, 48vw);
  }

  .photo-editorial__header h2 {
    top: 48%;
    right: 1rem;
    left: 1rem;
    margin: 0;
    font-size: clamp(4rem, 19vw, 5.5rem);
  }

  .photo-editorial__item--1 {
    top: 15%;
    left: -3%;
    width: 52vw;
    height: 26vh;
  }

  .photo-editorial__item--2 {
    top: 17%;
    right: -5%;
    width: 37vw;
    height: 29vh;
  }

  .photo-editorial__item--3 {
    bottom: 8%;
    left: 20%;
    width: 58vw;
    height: 27vh;
  }

  .photo-editorial__item--4 {
    right: -2%;
    bottom: 0;
    width: 31vw;
    height: 34vh;
  }

  .photo-editorial__item--5 {
    bottom: 10%;
    left: -2%;
    width: 30vw;
    height: 22vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-editorial {
    min-height: 115dvh;
  }

  .photo-editorial__sticky {
    position: relative;
    min-height: 100dvh;
  }
}
</style>
