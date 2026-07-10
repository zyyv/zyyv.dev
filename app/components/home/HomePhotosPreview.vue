<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoDetail from '~/components/photos/PhotoDetail.vue'

const props = defineProps<{
  photos: Photo[]
}>()

const currentPhoto = shallowRef<Photo | null>(null)
const previewPhotos = computed(() => props.photos.slice(0, 5))
const currentIndex = computed(() => {
  if (!currentPhoto.value) return -1
  return props.photos.findIndex((photo) => photo.id === currentPhoto.value?.id)
})

function openPreview(photo: Photo) {
  currentPhoto.value = photo
  document.body.style.overflow = 'hidden'
}

function closePreview() {
  currentPhoto.value = null
  document.body.style.overflow = ''
}

function showPreviousPhoto() {
  if (currentIndex.value <= 0) return
  currentPhoto.value = props.photos[currentIndex.value - 1] ?? null
}

function showNextPhoto() {
  if (currentIndex.value < 0 || currentIndex.value >= props.photos.length - 1) return
  currentPhoto.value = props.photos[currentIndex.value + 1] ?? null
}

function selectPhoto(photo: Photo) {
  currentPhoto.value = photo
}

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <div v-if="previewPhotos.length" class="photo-grid">
      <button
        v-for="photo in previewPhotos"
        :key="photo.id"
        type="button"
        class="photo-tile group relative min-h-0 cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 focus-visible:(outline-2 outline-current outline-offset-3)"
        :aria-label="`Open photo ${photo.filename}`"
        @click="openPreview(photo)"
      >
        <ImgBlurHash
          :src="photo.thumbnail || photo.path"
          :blurhash="photo.blurhash"
          :aspect-ratio="photo.width / photo.height"
          :alt="photo.filename"
          class="size-full object-cover transition-[transform,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:(scale-103 saturate-110) motion-reduce:transition-none"
        />
      </button>
    </div>

    <div
      v-else
      class="grid min-h-72 place-items-center rounded-[0.9rem] [background-color:color-mix(in_srgb,currentColor_4%,transparent)]"
    >
      <div class="text-center op-52">
        <i class="i-hugeicons:image-not-found-01 mb-3 text-3xl" aria-hidden="true" />
        <p class="m-0 text-sm">No photos available</p>
      </div>
    </div>

    <PhotoDetail
      :photo="currentPhoto"
      :photos="photos"
      :visible="currentPhoto !== null"
      @close="closePreview"
      @prev="showPreviousPhoto"
      @next="showNextPhoto"
      @select="selectPhoto"
    />
  </div>
</template>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  height: clamp(25rem, 49vw, 35rem);
}

.photo-tile {
  border-radius: 0.9rem;
}

.photo-tile:first-child {
  grid-column: span 7;
  grid-row: span 2;
}

.photo-tile:nth-child(2) {
  grid-column: span 3;
}

.photo-tile:nth-child(3) {
  grid-column: span 2;
}

.photo-tile:nth-child(4) {
  grid-column: span 2;
}

.photo-tile:nth-child(5) {
  grid-column: span 3;
}

@media (max-width: 767.9px) {
  .photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto;
    height: auto;
  }

  .photo-tile,
  .photo-tile:nth-child(n) {
    grid-column: span 1;
    grid-row: auto;
    aspect-ratio: 1 / 1;
  }

  .photo-tile:first-child {
    grid-column: span 2;
    aspect-ratio: 16 / 10;
  }
}
</style>
