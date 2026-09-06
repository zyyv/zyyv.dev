<script setup lang="ts">
import HomeHero from './home/HomeHero.vue'

const photoSection = useTemplateRef<HTMLElement>('photoSection')
const showPhotos = shallowRef(false)
const { stop } = useIntersectionObserver(
  photoSection,
  ([entry]) => {
    if (!entry?.isIntersecting) return
    showPhotos.value = true
    stop()
  },
  { rootMargin: '400px' },
)
</script>

<template>
  <div class="home-page w-full min-w-0 overflow-x-clip text-red/20">
    <HomeHero />

    <div id="photos" ref="photoSection" class="home-photo-section">
      <LazyHomePhotoSection v-if="showPhotos" />
    </div>
  </div>
</template>

<style scoped>
.home-photo-section {
  min-height: 340dvh;
}
@media (prefers-reduced-motion: reduce) {
  .home-photo-section {
    min-height: 100dvh;
  }
}
.home-page {
  background: transparent;
  color: #11110f;
}

:global(body:has(.home-page)) {
  background-color: #e9e9e5;
  background-image: none;
}

:global(.dark .home-page) {
  background: transparent;
  color: #e9e9e5;
}

:global(.dark body:has(.home-page)) {
  background-color: #11110f;
  background-image: none;
}
</style>
