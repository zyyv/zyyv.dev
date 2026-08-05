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
const repoCoverStyle = computed(() => ({
  '--repo-accent': props.repo.language ? getLanguageColor(props.repo.language) : '#718975',
}))
const repoCoverWord = computed(() => props.repo.name.split(/[-_]/).pop() || props.repo.name)
const previewDomain = computed(() => {
  if (!previewUrl.value) return ''

  try {
    return new URL(previewUrl.value).hostname.replace(/^www\./, '')
  } catch {
    return previewUrl.value
  }
})
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
          <span class="project-card__domain" aria-hidden="true">
            <StatusDot color="#718975" pulse />
            {{ previewDomain }}
          </span>
        </template>

        <div v-else class="project-card__repo-cover" :style="repoCoverStyle" aria-hidden="true">
          <strong class="font-londrina">{{ repoCoverWord }}</strong>
          <!-- <div class="project-card__repo-mark">
            <i i-hugeicons:repository />
          </div> -->
        </div>
      </div>

      <div class="project-card__content">
        <h3>{{ repo.name }}</h3>
        <p>{{ repo.description || 'Source code and project notes on GitHub.' }}</p>

        <div class="project-card__meta">
          <span v-if="repo.language" class="project-card__language">
            <StatusDot :color="getLanguageColor(repo.language)" />
            {{ repo.language }}
          </span>
          <span v-if="repo.stargazers_count" title="GitHub stars">
            <i i-hugeicons:star />
            {{ repo.stargazers_count }}
          </span>
          <span v-if="repo.forks_count" title="GitHub forks">
            <i i-hugeicons:git-fork />
            {{ repo.forks_count }}
          </span>
          <a
            class="project-card__source"
            :href="repo.html_url"
            target="_blank"
            rel="noreferrer"
            :aria-label="`View ${repo.name} source on GitHub`"
          >
            <i i-custom:github />
            Source
          </a>
        </div>
      </div>

      <div class="project-card__light" aria-hidden="true" />
      <a
        class="project-card__link"
        :href="primaryUrl"
        target="_blank"
        rel="noreferrer"
        :aria-label="`Open ${repo.name}${previewUrl ? ' website' : ' on GitHub'}`"
      />
    </div>
  </article>
</template>

<style scoped>
.project-card {
  --project-page: #e9e9e5;
  --project-card-surface: color-mix(in srgb, currentColor 4%, transparent);
  --project-card-surface-hover: color-mix(in srgb, currentColor 6.5%, transparent);
  --project-card-border: color-mix(in srgb, currentColor 18%, transparent);
  --project-card-border-active: color-mix(in srgb, currentColor 34%, transparent);
  --project-card-shadow: rgb(47 47 39 / 12%);
  --project-preview-background: color-mix(in srgb, currentColor 9%, var(--project-page));
  --project-preview-shade: rgb(17 17 15 / 15%);
  --project-preview-wash: rgb(233 233 229 / 2%);
  --project-domain-background: rgb(233 233 229 / 90%);
  --project-domain-border: rgb(17 17 15 / 18%);
  --project-domain-color: #11110f;
  --project-spotlight: rgb(255 255 255 / 42%);
  --project-preview-filter: grayscale(0.72) saturate(0.58) contrast(0.96);
  --project-preview-filter-hover: grayscale(0.28) saturate(0.76) contrast(0.98);
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

:global(.dark) .project-card {
  --project-page: #11110f;
  --project-card-shadow: rgb(0 0 0 / 30%);
  --project-preview-background: color-mix(in srgb, currentColor 5%, var(--project-page));
  --project-preview-shade: rgb(17 17 15 / 72%);
  --project-preview-wash: rgb(17 17 15 / 68%);
  --project-domain-background: rgb(17 17 15 / 88%);
  --project-domain-border: rgb(233 233 229 / 17%);
  --project-domain-color: #e9e9e5;
  --project-spotlight: rgb(233 233 229 / 9%);
  --project-preview-filter: grayscale(0.9) saturate(0.38) brightness(0.48) contrast(1.04);
  --project-preview-filter-hover: grayscale(0.58) saturate(0.58) brightness(0.62) contrast(1.02);
}

.project-card__surface {
  position: relative;
  height: 100%;
  overflow: hidden;
  border: 1px dashed var(--project-card-border);
  border-radius: 0.45rem;
  background: var(--project-card-surface);
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
  border-color: var(--project-card-border-active);
  background: var(--project-card-surface-hover);
  box-shadow: 0 1.4rem 3rem var(--project-card-shadow);
}

.project-card__preview {
  --preview-scale: 0.38;
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  /* background: var(--project-preview-background); */
  transform: translateZ(0.4rem);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover .project-card__preview {
  transform: translateZ(1rem) scale(1.012);
}

.project-card__preview iframe {
  position: relative;
  z-index: 0;
  width: calc(100% / var(--preview-scale));
  height: calc(100% / var(--preview-scale));
  border: 0;
  opacity: 1;
  pointer-events: none;
  transform: scale(var(--preview-scale));
  transform-origin: top left;
  filter: var(--project-preview-filter);
  transition:
    filter 400ms ease,
    opacity 400ms ease;
}

.project-card:hover .project-card__preview iframe {
  filter: var(--project-preview-filter-hover);
}

.project-card__domain {
  position: absolute;
  top: 0.65rem;
  left: 0.65rem;
  z-index: 2;
  display: inline-flex;
  max-width: calc(100% - 1.3rem);
  align-items: center;
  gap: 0.38rem;
  overflow: hidden;
  padding: 0.3rem 0.48rem;
  border-radius: 0.28rem;
  background: var(--project-domain-background);
  color: var(--project-domain-color);
  font-size: 0.58rem;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(1rem);
}

.project-card__preview::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(to bottom, transparent 65%, var(--project-preview-shade)),
    linear-gradient(var(--project-preview-wash), var(--project-preview-wash));
  content: '';
  pointer-events: none;
}

.project-card__preview.is-repository::after {
  display: none;
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
  justify-content: center;
  align-items: center;
  isolation: isolate;
  padding: 1rem 1.05rem 0.95rem;
  color: color-mix(in srgb, var(--repo-accent) 72%, #11110f);
  background:
    radial-gradient(
      circle at 104% -12%,
      color-mix(in srgb, var(--repo-accent) 28%, transparent),
      transparent 48%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--repo-accent) 14%, var(--project-page)),
      color-mix(in srgb, currentColor 3%, var(--project-page)) 72%
    );
  transition: color 320ms ease;
}

.project-card__repo-cover::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-size: 2.75rem 2.75rem;
  content: '';
  -webkit-mask-image: linear-gradient(105deg, rgb(0 0 0 / 76%), transparent 88%);
  mask-image: linear-gradient(105deg, rgb(0 0 0 / 76%), transparent 88%);
}

.project-card__repo-cover::after {
  position: absolute;
  top: 50%;
  right: -11%;
  z-index: -1;
  width: 44%;
  aspect-ratio: 1;
  border: 1px solid color-mix(in srgb, var(--repo-accent) 32%, transparent);
  border-radius: 50%;
  box-shadow:
    0 0 0 1.15rem color-mix(in srgb, var(--repo-accent) 5%, transparent),
    0 0 0 2.3rem color-mix(in srgb, var(--repo-accent) 4%, transparent);
  content: '';
  transform: translateY(-50%);
}

.project-card__repo-cover strong {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 560;
  line-height: 0.76;
  overflow-wrap: anywhere;
  text-transform: lowercase;
  text-shadow: 0 0.7rem 2.2rem color-mix(in srgb, var(--repo-accent) 18%, transparent);
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover .project-card__repo-cover strong {
  transform: translateX(0.18rem);
}

.project-card__repo-mark {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-card__repo-mark span {
  width: clamp(3rem, 28%, 5.5rem);
  height: 0.18rem;
  background: var(--repo-accent);
  box-shadow: 0 0 1.1rem color-mix(in srgb, var(--repo-accent) 42%, transparent);
}

.project-card__repo-mark i {
  width: 1.35rem;
  height: 1.35rem;
  color: color-mix(in srgb, var(--repo-accent) 66%, currentColor);
  opacity: 0.74;
}

:global(.dark) .project-card__repo-cover {
  color: color-mix(in srgb, var(--repo-accent) 76%, #e9e9e5);
  background:
    radial-gradient(
      circle at 104% -12%,
      color-mix(in srgb, var(--repo-accent) 20%, transparent),
      transparent 48%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--repo-accent) 12%, var(--project-page)),
      color-mix(in srgb, currentColor 4%, var(--project-page)) 72%
    );
}

.project-card__content {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 10.25rem;
  flex-direction: column;
  padding: 1.1rem 1.15rem 1rem;
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
  flex: 1;
  margin: 0.7rem 0 1.25rem;
  font-size: 0.76rem;
  line-height: 1.55;
  opacity: 0.64;
  text-wrap: pretty;
}

.project-card__meta {
  display: flex;
  min-height: 1.2rem;
  align-items: center;
  gap: 0.72rem;
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.62;
}

.project-card__meta > span,
.project-card__source {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}

.project-card__meta > span > i:not(.project-card__language i),
.project-card__source > i {
  width: 0.76rem;
  height: 0.76rem;
}

.project-card__source {
  position: relative;
  z-index: 6;
  margin-left: auto;
  color: inherit;
  text-decoration: none;
  transition: opacity 180ms ease;
}

.project-card__source:hover {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 0.18rem;
}

.project-card__light {
  position: absolute;
  inset: -1px;
  z-index: 3;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms ease;
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

@media (max-width: 43.99rem), (hover: none) {
  .project-card__preview {
    --preview-scale: 0.31;
  }

  .project-card__preview iframe,
  .project-card:hover .project-card__preview iframe {
    opacity: 1;
    filter: var(--project-preview-filter-hover);
  }

  .project-card__preview:not(.is-repository)::after {
    background:
      linear-gradient(to bottom, transparent 72%, var(--project-preview-shade)),
      linear-gradient(var(--project-preview-wash), var(--project-preview-wash));
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
