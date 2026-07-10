<script lang="ts" setup>
import type { Photo, PostPreview } from '~/types'

defineProps<{
  posts: PostPreview[]
  photos: Photo[]
}>()

const sections = {
  photos: {
    icon: 'i-hugeicons:image-03',
    label: 'View all photos',
    to: '/photos',
  },
  projects: {
    icon: 'i-hugeicons:package-search',
    label: 'View all projects',
    to: '/projects',
  },
  posts: {
    icon: 'i-hugeicons:note-edit',
    label: 'View all posts',
    to: '/posts',
  },
}
</script>

<template>
  <div class="home-scroll">
    <section class="home-hero">
      <MeInfo />
    </section>

    <section id="photos" class="home-section" aria-labelledby="photos-title">
      <header class="home-section-header">
        <i :class="sections.photos.icon" aria-hidden="true" />
        <h2 id="photos-title">Photos</h2>
      </header>
      <Photos :photos="photos.slice(0, 8)" page-scroll />
      <footer class="home-section-footer">
        <NuxtLink :to="sections.photos.to" class="home-section-link">
          {{ sections.photos.label }}
          <i class="i-hugeicons:arrow-up-right-02" />
        </NuxtLink>
      </footer>
    </section>

    <section id="projects" class="home-section" aria-labelledby="projects-title">
      <header class="home-section-header">
        <i :class="sections.projects.icon" aria-hidden="true" />
        <h2 id="projects-title">Projects</h2>
      </header>
      <Projects />
      <footer class="home-section-footer">
        <NuxtLink :to="sections.projects.to" class="home-section-link">
          {{ sections.projects.label }}
          <i class="i-hugeicons:arrow-up-right-02" />
        </NuxtLink>
      </footer>
    </section>

    <section id="posts" class="home-section" aria-labelledby="posts-title">
      <header class="home-section-header">
        <i :class="sections.posts.icon" aria-hidden="true" />
        <h2 id="posts-title">Posts</h2>
      </header>
      <Posts :posts="posts" />
      <footer class="home-section-footer">
        <NuxtLink :to="sections.posts.to" class="home-section-link">
          {{ sections.posts.label }}
          <i class="i-hugeicons:arrow-up-right-02" />
        </NuxtLink>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.home-scroll {
  width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.home-hero {
  position: relative;
  display: grid;
  min-height: 100svh;
  place-items: center;
  padding: clamp(4.5rem, 9vw, 8rem) clamp(1.5rem, 5vw, 5rem);
  container-type: inline-size;
}

.home-hero :deep(.me-info) {
  width: min(100%, 72rem);
  height: auto;
}

.home-section-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.35rem;
}

.home-section {
  width: min(calc(100% - clamp(2rem, 8vw, 8rem)), 68rem);
  margin-inline: auto;
  padding-block: clamp(4.5rem, 9vw, 8rem);
  border-top: 1px dashed rgb(120 120 120 / 24%);
  scroll-margin-top: 2rem;
  container-type: inline-size;
}

.home-section-header {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: clamp(1.75rem, 4vw, 3rem);
}

.home-section-header > i {
  display: inline-grid;
  width: 1.15em;
  height: 1.15em;
  flex: 0 0 auto;
  font-size: clamp(1.75rem, 3vw, 2.75rem);
  opacity: 0.48;
}

.home-section-header h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 0.95;
}

.home-section-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: clamp(1.25rem, 3vw, 2rem);
  padding-top: 1rem;
}

.home-section-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: inherit;
  font-size: 0.85rem;
  opacity: 0.58;
  text-decoration: none;
  transition:
    gap 180ms ease,
    opacity 180ms ease;
}

.home-section-link:hover {
  gap: 0.6rem;
  opacity: 1;
}

@keyframes home-section-reveal {
  from {
    opacity: 0.14;
    transform: translateY(2.5rem) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .home-section {
      animation-name: home-section-reveal;
      animation-fill-mode: both;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      animation-timeline: view();
      animation-range: entry 0% entry 80%;
    }
  }
}

@media (max-width: 767px) {
  .home-hero {
    align-items: center;
    padding-inline: 1.5rem;
    padding-bottom: 6rem;
  }

  .home-section {
    width: calc(100% - 2rem);
    padding-block: 4.5rem;
  }

  .home-section-header {
    margin-bottom: 1.75rem;
  }

  .home-section-header h2 {
    font-size: 2.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-section-link {
    transition: none;
  }
}
</style>
