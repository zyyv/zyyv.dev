<script setup lang="ts">
import type { Photo, PostPreview } from '~/types'
import HomePhotosPreview from './home/HomePhotosPreview.vue'
import HomeHero from './home/HomeHero.vue'

defineProps<{
  posts: PostPreview[]
  photos: Photo[]
}>()

const sections = {
  projects: {
    description: 'Tools I build, maintain, and learn from in public.',
    icon: 'i-hugeicons:package-search',
    label: 'View all projects',
    secondaryTitle: '/ projects',
    title: 'Open source',
    to: '/projects',
  },
  posts: {
    description: 'Front-end engineering, tooling, and the details in between.',
    icon: 'i-hugeicons:note-edit',
    label: 'View all posts',
    secondaryTitle: '/ notes',
    title: 'Writing',
    to: '/posts',
  },
} as const
</script>

<template>
  <div class="home-page w-full min-w-0 overflow-x-clip">
    <HomeHero :photos="photos" />

    <HomePhotosPreview :photos="photos" />
  </div>
</template>

<style scoped>
.home-page {
  background: #e9e9e5;
  color: #11110f;
}

:global(body:has(.home-page)) {
  background-color: #e9e9e5;
  background-image: none;
}

:global(.dark .home-page) {
  background: #11110f;
  color: #e9e9e5;
}

:global(.dark body:has(.home-page)) {
  background-color: #11110f;
  background-image: none;
}
</style>
