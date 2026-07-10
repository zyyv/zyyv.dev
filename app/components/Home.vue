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
  <div class="w-full min-w-0 overflow-x-clip">
    <section
      class="relative grid min-h-100svh place-items-center px-[clamp(1.5rem,5vw,5rem)] py-[clamp(4.5rem,9vw,8rem)] [container-type:inline-size] lt-md:(px-6 pb-24)"
    >
      <MeInfo class="h-auto! w-[min(100%,72rem)]!" />
    </section>

    <section
      id="photos"
      class="home-section mx-auto w-[min(calc(100%-clamp(2rem,8vw,8rem)),68rem)] scroll-mt-8 border-t border-dashed py-[clamp(4.5rem,9vw,8rem)] [border-top-color:rgb(120_120_120/24%)] [container-type:inline-size] lt-md:(w-[calc(100%-2rem)] py-18)"
      aria-labelledby="photos-title"
    >
      <header class="mb-[clamp(1.75rem,4vw,3rem)] flex items-center gap-[0.9rem] lt-md:mb-7">
        <i
          class="inline-grid size-[1.15em] flex-none text-[clamp(1.75rem,3vw,2.75rem)] op-48"
          :class="sections.photos.icon"
          aria-hidden="true"
        />
        <h2
          id="photos-title"
          class="m-0 text-[clamp(2rem,4vw,3.5rem)] leading-[0.95] font-600 tracking-[-0.055em] lt-md:text-4xl"
        >
          Photos
        </h2>
      </header>
      <Photos :photos="photos.slice(0, 8)" page-scroll />
      <footer class="mt-[clamp(1.25rem,3vw,2rem)] flex justify-end pt-4">
        <NuxtLink
          :to="sections.photos.to"
          class="inline-flex items-center gap-[0.35rem] color-inherit text-[0.85rem] op-58 no-underline transition-[gap,opacity] duration-180 ease hover:(gap-[0.6rem] op-100) focus-visible:(outline-2 outline-current outline-offset-[0.35rem]) motion-reduce:transition-none"
        >
          {{ sections.photos.label }}
          <i class="i-hugeicons:arrow-up-right-02" />
        </NuxtLink>
      </footer>
    </section>

    <section
      id="projects"
      class="home-section mx-auto w-[min(calc(100%-clamp(2rem,8vw,8rem)),68rem)] scroll-mt-8 border-t border-dashed py-[clamp(4.5rem,9vw,8rem)] [border-top-color:rgb(120_120_120/24%)] [container-type:inline-size] lt-md:(w-[calc(100%-2rem)] py-18)"
      aria-labelledby="projects-title"
    >
      <header class="mb-[clamp(1.75rem,4vw,3rem)] flex items-center gap-[0.9rem] lt-md:mb-7">
        <i
          class="inline-grid size-[1.15em] flex-none text-[clamp(1.75rem,3vw,2.75rem)] op-48"
          :class="sections.projects.icon"
          aria-hidden="true"
        />
        <h2
          id="projects-title"
          class="m-0 text-[clamp(2rem,4vw,3.5rem)] leading-[0.95] font-600 tracking-[-0.055em] lt-md:text-4xl"
        >
          Projects
        </h2>
      </header>
      <Projects />
      <footer class="mt-[clamp(1.25rem,3vw,2rem)] flex justify-end pt-4">
        <NuxtLink
          :to="sections.projects.to"
          class="inline-flex items-center gap-[0.35rem] color-inherit text-[0.85rem] op-58 no-underline transition-[gap,opacity] duration-180 ease hover:(gap-[0.6rem] op-100) focus-visible:(outline-2 outline-current outline-offset-[0.35rem]) motion-reduce:transition-none"
        >
          {{ sections.projects.label }}
          <i class="i-hugeicons:arrow-up-right-02" />
        </NuxtLink>
      </footer>
    </section>

    <section
      id="posts"
      class="home-section mx-auto w-[min(calc(100%-clamp(2rem,8vw,8rem)),68rem)] scroll-mt-8 border-t border-dashed py-[clamp(4.5rem,9vw,8rem)] [border-top-color:rgb(120_120_120/24%)] [container-type:inline-size] lt-md:(w-[calc(100%-2rem)] py-18)"
      aria-labelledby="posts-title"
    >
      <header class="mb-[clamp(1.75rem,4vw,3rem)] flex items-center gap-[0.9rem] lt-md:mb-7">
        <i
          class="inline-grid size-[1.15em] flex-none text-[clamp(1.75rem,3vw,2.75rem)] op-48"
          :class="sections.posts.icon"
          aria-hidden="true"
        />
        <h2
          id="posts-title"
          class="m-0 text-[clamp(2rem,4vw,3.5rem)] leading-[0.95] font-600 tracking-[-0.055em] lt-md:text-4xl"
        >
          Posts
        </h2>
      </header>
      <Posts :posts="posts" />
      <footer class="mt-[clamp(1.25rem,3vw,2rem)] flex justify-end pt-4">
        <NuxtLink
          :to="sections.posts.to"
          class="inline-flex items-center gap-[0.35rem] color-inherit text-[0.85rem] op-58 no-underline transition-[gap,opacity] duration-180 ease hover:(gap-[0.6rem] op-100) focus-visible:(outline-2 outline-current outline-offset-[0.35rem]) motion-reduce:transition-none"
        >
          {{ sections.posts.label }}
          <i class="i-hugeicons:arrow-up-right-02" />
        </NuxtLink>
      </footer>
    </section>
  </div>
</template>

<style scoped>
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
</style>
