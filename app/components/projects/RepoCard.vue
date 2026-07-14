<script lang="ts" setup>
import type { Repo } from '~/types'

const props = defineProps<{
  repo: Repo
  index?: number
}>()

const previewUrl = computed(() => {
  const homepage = props.repo.homepage?.trim()
  return homepage && /^https?:\/\//i.test(homepage) ? homepage : null
})

const primaryUrl = computed(() => previewUrl.value || props.repo.html_url)
const previewLoaded = ref(false)

function updateTilt(event: PointerEvent) {
  if (event.pointerType === 'touch') return

  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height

  card.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`)
  card.style.setProperty('--tilt-y', `${(x - 0.5) * 9}deg`)
  card.style.setProperty('--pointer-x', `${x * 100}%`)
  card.style.setProperty('--pointer-y', `${y * 100}%`)
}

function resetTilt(event: PointerEvent) {
  const card = event.currentTarget as HTMLElement
  card.style.setProperty('--tilt-x', '0deg')
  card.style.setProperty('--tilt-y', '0deg')
  card.style.setProperty('--pointer-x', '50%')
  card.style.setProperty('--pointer-y', '50%')
}
</script>

<template>
  <article
    class="project-card"
    :style="{ '--project-index': index ?? 0 }"
    @pointermove="updateTilt"
    @pointerleave="resetTilt"
  >
    <div class="project-card__surface">
      <div class="project-card__preview" :class="{ 'is-repository': !previewUrl }">
        <template v-if="previewUrl">
          <div v-if="!previewLoaded" class="project-card__loading" aria-hidden="true" />
          <iframe
            :src="previewUrl"
            :title="`${repo.name} website preview`"
            loading="lazy"
            tabindex="-1"
            aria-hidden="true"
            referrerpolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms"
            @load="previewLoaded = true"
          />
        </template>

        <div v-else class="project-card__repo-cover" aria-hidden="true">
          <span>{{ repo.name.slice(0, 2) }}</span>
          <i i-hugeicons:repository />
        </div>
      </div>

      <div class="project-card__content">
        <h3>{{ repo.name }}</h3>
        <p>{{ repo.description || 'Source code and project notes on GitHub.' }}</p>
      </div>

      <div class="project-card__light" aria-hidden="true" />
    </div>

    <a
      class="project-card__link"
      :href="primaryUrl"
      target="_blank"
      rel="noreferrer"
      :aria-label="`Open ${repo.name}${previewUrl ? ' website' : ' on GitHub'}`"
    />
  </article>
</template>

<style scoped>
.project-card {
  --tilt-x: 0deg;
  --tilt-y: 0deg;
  --pointer-x: 50%;
  --pointer-y: 50%;
  position: relative;
  min-width: 0;
  perspective: 70rem;
  animation: project-card-in 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--project-index) * 45ms);
}

.project-card__surface {
  position: relative;
  height: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 0.45rem;
  background: color-mix(in srgb, currentColor 2.8%, transparent);
  transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  transform-style: preserve-3d;
  transition:
    transform 140ms ease-out,
    border-color 240ms ease,
    background-color 240ms ease,
    box-shadow 240ms ease;
  will-change: transform;
}

.project-card:hover .project-card__surface {
  border-color: color-mix(in srgb, currentColor 28%, transparent);
  background: color-mix(in srgb, currentColor 4.5%, transparent);
  box-shadow: 0 1.4rem 3rem color-mix(in srgb, #000 18%, transparent);
}

.project-card:active .project-card__surface {
  transform: rotateX(calc(var(--tilt-x) * 0.5)) rotateY(calc(var(--tilt-y) * 0.5)) scale(0.985);
  transition-duration: 80ms;
}

.project-card:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 0.22rem;
  border-radius: 0.45rem;
}

.project-card__preview {
  --preview-scale: 0.38;
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  background: #deded9;
  transform: translateZ(0.4rem);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.dark) .project-card__preview {
  background: #191917;
}

.project-card:hover .project-card__preview {
  transform: translateZ(1rem) scale(1.012);
}

.project-card__preview iframe {
  width: calc(100% / var(--preview-scale));
  height: calc(100% / var(--preview-scale));
  border: 0;
  opacity: 0.78;
  pointer-events: none;
  transform: scale(var(--preview-scale));
  transform-origin: top left;
  filter: grayscale(0.82) saturate(0.48) contrast(0.9);
  transition:
    filter 400ms ease,
    opacity 400ms ease;
}

.project-card:hover .project-card__preview iframe {
  opacity: 0.9;
  filter: grayscale(0.35) saturate(0.7) contrast(0.94);
}

.project-card__preview::after {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, transparent 65%, rgb(17 17 15 / 10%)),
    color-mix(in srgb, currentColor 3%, transparent);
  content: '';
  pointer-events: none;
}

.project-card__loading {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 35%,
    color-mix(in srgb, currentColor 7%, transparent) 48%,
    transparent 61%
  );
  background-size: 220% 100%;
  animation: project-loading 1.5s linear infinite;
}

.project-card__repo-cover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.2rem;
  background:
    radial-gradient(
      circle at var(--pointer-x) var(--pointer-y),
      color-mix(in srgb, currentColor 8%, transparent),
      transparent 42%
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0 3rem,
      color-mix(in srgb, currentColor 4%, transparent) 3rem calc(3rem + 1px)
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 3rem,
      color-mix(in srgb, currentColor 4%, transparent) 3rem calc(3rem + 1px)
    );
}

.project-card__repo-cover span {
  font-size: clamp(3rem, 7vw, 5rem);
  font-weight: 500;
  line-height: 0.75;
  letter-spacing: -0.12em;
  text-transform: lowercase;
  opacity: 0.12;
}

.project-card__repo-cover i {
  width: 1.6rem;
  height: 1.6rem;
  opacity: 0.2;
}

.project-card__content {
  position: relative;
  z-index: 2;
  min-height: 8.7rem;
  padding: 1.1rem 1.15rem 1.25rem;
  transform: translateZ(0.7rem);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover .project-card__content {
  transform: translateZ(1.3rem) translateY(-0.12rem);
}

.project-card h3 {
  margin: 0;
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  font-weight: 520;
  line-height: 1.1;
  letter-spacing: -0.045em;
  overflow-wrap: anywhere;
}

.project-card p {
  max-width: 48ch;
  margin: 0.7rem 0 0;
  font-size: 0.76rem;
  line-height: 1.55;
  opacity: 0.54;
  text-wrap: pretty;
}

.project-card__light {
  position: absolute;
  inset: -1px;
  z-index: 3;
  border-radius: inherit;
  background: radial-gradient(
    circle at var(--pointer-x) var(--pointer-y),
    color-mix(in srgb, currentColor 10%, transparent),
    transparent 34%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms ease;
  mix-blend-mode: soft-light;
}

.project-card:hover .project-card__light {
  opacity: 1;
}

.project-card__link {
  position: absolute;
  inset: 0;
  z-index: 4;
  border-radius: 0.45rem;
}

.project-card__link:focus-visible {
  outline: none;
}

@keyframes project-card-in {
  from {
    opacity: 0;
    transform: translateY(0.8rem);
  }
}

@keyframes project-loading {
  to {
    background-position: -220% 0;
  }
}

@media (min-width: 64rem) {
  .project-card__preview {
    --preview-scale: 0.27;
  }
}

@media (max-width: 43.99rem) {
  .project-card__preview {
    --preview-scale: 0.31;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card,
  .project-card__surface,
  .project-card__preview,
  .project-card__content,
  .project-card__loading {
    animation: none;
    transition-duration: 1ms;
  }
}
</style>
