<script setup lang="ts">
import type { Photo } from '~/types'
import HomePhotosPreview from './home/HomePhotosPreview.vue'
import HomeHero from './home/HomeHero.vue'
import { seededShuffle } from '~/utils/shuffle'

const props = defineProps<{
  photos: Photo[]
}>()

const photoSeed = useState('home-photo-seed', () => Math.random())
const randomPhotos = computed(() => seededShuffle(props.photos, photoSeed.value))
const heroPhotos = computed(() => randomPhotos.value.slice(0, 3))
const streamPhotos = computed(() => randomPhotos.value.slice(3, 25))
</script>

<template>
  <div class="home-page w-full min-w-0 overflow-x-clip">
    <HomeHero :photos="heroPhotos" />

    <HomePhotosPreview :photos="streamPhotos" />
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
