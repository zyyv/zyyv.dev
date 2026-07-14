<script setup lang="ts">
import type { Photo } from '~/types'
import { useScrollStage } from '~/composables/useScrollStage'

defineProps<{
  photos: Photo[]
}>()

const heroRef = useTemplateRef<HTMLElement>('hero')

useScrollStage(heroRef, {
  setup: () => {
    const root = heroRef.value
    if (!root) return []

    const animate = (
      selector: string,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions = {},
    ) =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).map((element) =>
        element.animate(keyframes, {
          duration: 1000,
          fill: 'both',
          easing: 'linear',
          ...options,
        }),
      )

    return [
      ...animate('.home-hero__meta-exit', [
        { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0 },
        { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.5 },
        { opacity: 0, transform: 'translate3d(0, -5rem, 0)', offset: 0.96 },
        { opacity: 0, transform: 'translate3d(0, -5rem, 0)', offset: 1 },
      ]),
      ...animate('.home-hero__title', [
        { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0 },
        { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.46 },
        { opacity: 0, transform: 'translate3d(0, -12vh, 0) scale(0.9)', offset: 1 },
      ]),
      ...animate('.home-hero__images', [
        { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0, 0, 0) scale(1)', offset: 0 },
        { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0, 0, 0) scale(1)', offset: 0.5 },
        {
          opacity: 0,
          filter: 'blur(0.65rem)',
          transform: 'translate3d(0, -9vh, 0) scale(1.16)',
          offset: 1,
        },
      ]),
      ...animate('.home-hero__footer-exit', [
        { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0 },
        { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.42 },
        { opacity: 0, transform: 'translate3d(0, 6rem, 0)', offset: 0.94 },
        { opacity: 0, transform: 'translate3d(0, 6rem, 0)', offset: 1 },
      ]),
    ]
  },
})
</script>

<template>
  <section ref="hero" class="home-hero" aria-labelledby="home-hero-title">
    <div class="home-hero__sticky">
      <div class="home-hero__meta-exit">
        <div class="home-hero__meta">
          <p>Chris</p>
          <p>Front-end developer</p>
        </div>
      </div>

      <h1 id="home-hero-title" class="home-hero__title">
        <span>Creative</span>
        <span>developer</span>
      </h1>

      <div v-if="photos.length" class="home-hero__images" aria-hidden="true">
        <figure v-if="photos[0]" class="home-hero__frame home-hero__frame--primary">
          <img :src="photos[0].src" alt="" fetchpriority="high" />
        </figure>
        <figure v-if="photos[1]" class="home-hero__frame home-hero__frame--secondary">
          <img :src="photos[1].src" alt="" />
        </figure>
        <figure v-if="photos[2]" class="home-hero__frame home-hero__frame--detail">
          <img :src="photos[2].src" alt="" />
        </figure>
      </div>

      <div class="home-hero__footer-exit">
        <div class="home-hero__footer">
          <p>I build open source tools and document the details between code and life.</p>
          <a href="mailto:hizyyv@gmail.com">Available for selected work</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  height: 126dvh;
  background: inherit;
  color: inherit;
}

.home-hero__sticky {
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
  padding: clamp(5.5rem, 9vw, 8rem) clamp(1.25rem, 4vw, 4rem) clamp(2rem, 4vw, 4rem);
  background: inherit;
  isolation: isolate;
}

.home-hero__meta-exit {
  position: relative;
  z-index: 6;
  width: min(38rem, 54vw);
  will-change: opacity, transform;
}

.home-hero__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  font-size: 0.68rem;
  line-height: 1.2;
  text-transform: uppercase;
}

.home-hero__meta p,
.home-hero__frame,
.home-hero__footer p {
  margin: 0;
}

.home-hero__title {
  position: relative;
  z-index: 4;
  display: grid;
  margin: clamp(5rem, 13vh, 8.5rem) 0 0;
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(5rem, 13.4vw, 13rem);
  font-weight: 500;
  line-height: 0.73;
  letter-spacing: -0.085em;
  pointer-events: none;
}

.home-hero__title span {
  display: block;
  will-change: transform;
}

.home-hero__title span:last-child {
  margin-left: 15vw;
}

.home-hero__images {
  position: absolute;
  z-index: 3;
  inset: 0;
  pointer-events: none;
}

.home-hero__frame {
  position: absolute;
  overflow: hidden;
  background: color-mix(in srgb, currentColor 8%, transparent);
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

.home-hero__footer-exit {
  position: absolute;
  z-index: 6;
  right: clamp(1.25rem, 4vw, 4rem);
  bottom: clamp(2rem, 4vw, 4rem);
  left: clamp(1.25rem, 4vw, 4rem);
  will-change: opacity, transform;
}

.home-hero__footer {
  display: grid;
  grid-template-columns: minmax(0, 24rem) auto;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  font-size: 0.78rem;
  line-height: 1.5;
}

.home-hero__footer a {
  padding-bottom: 0.2rem;
  border-bottom: 1px solid currentColor;
  color: inherit;
  text-decoration: none;
}

@media (prefers-reduced-motion: no-preference) {
  .home-hero__meta {
    animation: hero-fade-up 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .home-hero__title span:first-child {
    animation: hero-title-in 1s 80ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .home-hero__title span:last-child {
    animation: hero-title-in 1s 150ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .home-hero__frame--primary {
    animation: hero-primary-in 1.1s 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .home-hero__frame--secondary {
    animation: hero-frame-in 950ms 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .home-hero__frame--detail {
    animation: hero-frame-in 850ms 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .home-hero__footer {
    animation: hero-fade-up 900ms 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

@keyframes hero-title-in {
  from {
    opacity: 0;
    transform: translate3d(0, 0.65em, 0);
  }
}

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translate3d(0, 1.5rem, 0);
  }
}

@keyframes hero-primary-in {
  from {
    clip-path: inset(100% 0 0);
    transform: translate3d(0, 2rem, 0) scale(1.04);
  }

  to {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes hero-frame-in {
  from {
    clip-path: inset(100% 0 0);
    transform: translate3d(0, 1.5rem, 0);
  }

  to {
    clip-path: inset(0);
    transform: translate3d(0, 0, 0);
  }
}

@media (max-width: 767.9px) {
  .home-hero {
    height: 122dvh;
  }

  .home-hero__sticky {
    padding: 5.5rem 1rem 6.5rem;
  }

  .home-hero__meta {
    font-size: 0.62rem;
  }

  .home-hero__meta-exit {
    width: 100%;
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
    left: 4%;
    width: 32vw;
  }

  .home-hero__frame--detail {
    top: 27%;
    left: 17%;
    width: 15vw;
  }

  .home-hero__footer-exit {
    right: 1rem;
    bottom: 5.75rem;
    left: 1rem;
  }

  .home-hero__footer {
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
    height: max(48rem, 100dvh);
  }

  .home-hero__frame {
    clip-path: inset(0) !important;
    transform: none !important;
  }
}
</style>
