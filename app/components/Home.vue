<script setup lang="ts">
import type { Photo, PostPreview } from '~/types'
import HomePhotosPreview from './home/HomePhotosPreview.vue'
import HomePostsPreview from './home/HomePostsPreview.vue'
import HomeProjectsPreview from './home/HomeProjectsPreview.vue'
import HomeSection from './home/HomeSection.vue'

defineProps<{
  posts: PostPreview[]
  photos: Photo[]
}>()

const sections = {
  photos: {
    description: 'Light, weather, and ordinary moments worth keeping.',
    icon: 'i-hugeicons:image-03',
    label: 'View all photos',
    title: 'Photos',
    to: '/photos',
  },
  projects: {
    description: 'Open source tools I build, maintain, and learn from.',
    icon: 'i-hugeicons:package-search',
    label: 'View all projects',
    title: 'Projects',
    to: '/projects',
  },
  posts: {
    description: 'Notes on front-end engineering, tooling, and the details in between.',
    icon: 'i-hugeicons:note-edit',
    label: 'View all posts',
    title: 'Posts',
    to: '/posts',
  },
} as const
</script>

<template>
  <div class="w-full min-w-0 overflow-x-clip">
    <section
      class="relative grid min-h-100svh place-items-center px-[clamp(1.5rem,5vw,5rem)] py-[clamp(4.5rem,9vw,8rem)] [container-type:inline-size] lt-md:(px-6 pb-24)"
    >
      <MeInfo class="h-auto! w-[min(100%,72rem)]!" />
    </section>

    <div
      class="mx-auto grid w-[min(calc(100%-clamp(2rem,6vw,6rem)),72rem)] gap-[clamp(1.5rem,4vw,3.5rem)] pb-[clamp(5rem,10vw,9rem)] lt-md:w-[calc(100%-2rem)]"
    >
      <HomeSection id="photos" v-bind="sections.photos">
        <HomePhotosPreview :photos="photos" />
      </HomeSection>

      <HomeSection id="projects" v-bind="sections.projects">
        <HomeProjectsPreview />
      </HomeSection>

      <HomeSection id="posts" v-bind="sections.posts">
        <HomePostsPreview :posts="posts" />
      </HomeSection>
    </div>
  </div>
</template>
