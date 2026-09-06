<script setup lang="ts">
import HomePhotosPreview from './HomePhotosPreview.vue'
import { seededShuffle } from '~/utils/shuffle'

const { data, status, error, refresh } = usePublicPhotos({ all: false, limit: 24 })
const photoSeed = useState('home-photo-seed', () => Math.random())
const photos = computed(() => seededShuffle(data.value.photos, photoSeed.value).slice(0, 22))
</script>

<template>
  <p v-if="status === 'pending'" class="px-4 py-16 text-center" role="status">Loading photos…</p>
  <div v-else-if="error" class="px-4 py-16 text-center" role="status">
    <p>Photos could not be loaded.</p>
    <button type="button" class="underline" @click="refresh()">Try again</button>
  </div>
  <HomePhotosPreview v-else :photos="photos" />
</template>
