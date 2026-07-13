<script setup lang="ts">
import type { Photo } from '~/types'

const props = defineProps<{
  photos: Photo[]
}>()

const heroPhotos = computed(() => {
  const preferredNames = ['DSC01944.JPG', 'DSC03163.JPG', 'DSC02718.JPG']
  const preferred = preferredNames
    .map((name) =>
      props.photos.find((photo) => photo.filename?.includes(name) || photo.id.includes(name)),
    )
    .filter((photo): photo is Photo => !!photo)

  return preferred.length === preferredNames.length ? preferred : props.photos.slice(0, 3)
})

function previewSrc(photo: Photo) {
  return photo.thumbnail || photo.src
}
</script>

<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div class="home-hero__sticky">
      <div class="home-hero__meta">
        <p>Chris</p>
        <p>Front-end developer</p>
      </div>

      <h1 id="home-hero-title" class="home-hero__title">
        <span>Creative</span>
        <span>developer</span>
      </h1>

      <div v-if="heroPhotos.length" class="home-hero__images" aria-hidden="true">
        <div class="home-hero__frame home-hero__frame--primary">
          <img v-if="heroPhotos[0]" :src="previewSrc(heroPhotos[0])" alt="" />
        </div>
        <div class="home-hero__frame home-hero__frame--secondary">
          <img v-if="heroPhotos[1]" :src="previewSrc(heroPhotos[1])" alt="" />
        </div>
        <div class="home-hero__frame home-hero__frame--detail">
          <img v-if="heroPhotos[2]" :src="previewSrc(heroPhotos[2])" alt="" />
        </div>
      </div>

      <div class="home-hero__footer">
        <p>I build open source tools and document the details between code and life.</p>
        <a href="mailto:hizyyv@gmail.com">Available for selected work</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  min-height: 230dvh;
  view-timeline-name: --hero-stage;
  view-timeline-axis: block;
}

.home-hero__sticky {
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
  padding: clamp(5.5rem, 9vw, 8rem) clamp(1.25rem, 4vw, 4rem) clamp(2rem, 4vw, 4rem);
  isolation: isolate;
}

.home-hero__meta {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min(38rem, 54vw);
  gap: 2rem;
  font-size: 0.68rem;
  line-height: 1.2;
  text-transform: uppercase;
}

.home-hero__meta p {
  margin: 0;
}

.home-hero__title {
  position: relative;
  z-index: 3;
  display: grid;
  margin: clamp(5rem, 13vh, 8.5rem) 0 0;
  font-size: clamp(5rem, 13.4vw, 13rem);
  font-weight: 500;
  line-height: 0.73;
  letter-spacing: -0.085em;
}

.home-hero__title span:last-child {
  margin-left: 15vw;
}

.home-hero__images {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.home-hero__frame {
  position: absolute;
  display: block;
  overflow: hidden;
  will-change: clip-path, transform;
}

.home-hero__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.06);
}

.home-hero__frame--primary {
  top: 14%;
  right: 8%;
  width: clamp(14rem, 24vw, 25rem);
  height: min(62vh, 43rem);
}

.home-hero__frame--secondary {
  top: 15%;
  left: 7%;
  width: clamp(9rem, 16vw, 17rem);
  aspect-ratio: 4 / 3;
}

.home-hero__frame--detail {
  top: 13%;
  left: 47%;
  width: clamp(4.5rem, 7vw, 7rem);
  aspect-ratio: 3 / 4;
}

.home-hero__footer {
  position: absolute;
  right: clamp(1.25rem, 4vw, 4rem);
  bottom: clamp(2rem, 4vw, 4rem);
  left: clamp(1.25rem, 4vw, 4rem);
  z-index: 4;
  display: grid;
  grid-template-columns: minmax(0, 24rem) auto;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  font-size: 0.78rem;
  line-height: 1.5;
}

.home-hero__footer p {
  margin: 0;
}

.home-hero__footer a {
  padding-bottom: 0.2rem;
  border-bottom: 1px solid currentColor;
  color: inherit;
  text-decoration: none;
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .home-hero__title span,
    .home-hero__frame,
    .home-hero__meta,
    .home-hero__footer {
      animation-duration: 1ms;
      animation-fill-mode: both;
      animation-timing-function: linear;
      animation-timeline: --hero-stage;
      animation-range: cover 0% cover 100%;
    }

    .home-hero__title span:first-child {
      animation-name: hero-title-first;
    }

    .home-hero__title span:last-child {
      animation-name: hero-title-last;
    }

    .home-hero__frame--primary {
      animation-name: hero-primary-reveal;
    }

    .home-hero__frame--secondary {
      animation-name: hero-secondary-reveal;
    }

    .home-hero__frame--detail {
      animation-name: hero-detail-reveal;
    }

    .home-hero__meta {
      animation-name: hero-meta-drift;
    }

    .home-hero__footer {
      animation-name: hero-footer-drift;
    }
  }
}

@keyframes hero-title-first {
  0% {
    transform: translate3d(0, 12vh, 0);
  }
  100% {
    transform: translate3d(-7vw, -8vh, 0);
  }
}

@keyframes hero-title-last {
  0% {
    transform: translate3d(-9vw, 3vh, 0);
  }
  100% {
    transform: translate3d(7vw, -2vh, 0);
  }
}

@keyframes hero-primary-reveal {
  0% {
    clip-path: inset(45% 47% 45% 47%);
    transform: translate3d(-31vw, 23vh, 0) scale(0.28);
  }
  20% {
    clip-path: inset(29% 32% 29% 32%);
  }
  72%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes hero-secondary-reveal {
  0%,
  12% {
    clip-path: inset(48% 48% 48% 48%);
    transform: translate3d(31vw, 18vh, 0) scale(0.2);
  }
  82%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes hero-detail-reveal {
  0%,
  24% {
    clip-path: inset(49% 49% 49% 49%);
    transform: translate3d(3vw, 21vh, 0) scale(0.14);
  }
  88%,
  100% {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes hero-meta-drift {
  to {
    transform: translate3d(0, -3vh, 0);
  }
}

@keyframes hero-footer-drift {
  from {
    opacity: 0.35;
    transform: translate3d(0, 5vh, 0);
  }
  60%,
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (max-width: 767.9px) {
  .home-hero {
    min-height: 210dvh;
  }

  .home-hero__sticky {
    padding: 5.5rem 1rem 6.5rem;
  }

  .home-hero__meta {
    width: 100%;
    font-size: 0.62rem;
  }

  .home-hero__title {
    margin-top: 5.5rem;
    font-size: clamp(4.15rem, 21vw, 6rem);
    line-height: 0.8;
  }

  .home-hero__title span:last-child {
    margin-left: 0;
  }

  .home-hero__frame--primary {
    top: 34%;
    right: -5%;
    width: min(68vw, 18rem);
    height: 43vh;
    min-height: 21rem;
  }

  .home-hero__frame--secondary {
    top: 30%;
    bottom: auto;
    left: 4%;
    width: 32vw;
  }

  .home-hero__frame--detail {
    top: 27%;
    left: 17%;
    width: 15vw;
  }

  .home-hero__footer {
    right: 1rem;
    bottom: 5.75rem;
    left: 1rem;
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .home-hero__footer p {
    max-width: 17rem;
  }

  .home-hero__footer a {
    width: max-content;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero {
    min-height: max(48rem, 100dvh);
  }

  .home-hero__sticky {
    position: relative;
  }
}
</style>
