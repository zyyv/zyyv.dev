<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoDetail from '~/components/photos/PhotoDetail.vue'
import { Ripplable, type RipplableListItem } from 'ripplable'
import 'ripplable/styles.css'

const props = defineProps<{
  photos: Photo[]
}>()

const currentPhoto = shallowRef<Photo | null>(null)
const previewPhotos = computed(() => props.photos.slice(0, 15) as unknown as RipplableListItem[])

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
    <div v-if="previewPhotos.length" class="w-full h-50vh">
      <Ripplable :autoplay="1" :fps="true" :list="previewPhotos">
        <template #card="{ src, label, index }">
          <div class="photo-card">
            <img :src="src" alt="" class="photo-card__image" />
            <div class="photo-card__shade" />
            <div class="photo-card__meta">
              <span class="photo-card__eyebrow">Frame {{ label }}</span>
              <strong class="photo-card__title">Visual {{ index + 1 }}</strong>
            </div>
          </div>
        </template>
      </Ripplable>
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
.photo-card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 28px;
  background: #020617;
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.photo-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-card__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(1, 4, 9, 0.08), rgba(1, 4, 9, 0.72)),
    linear-gradient(135deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.22));
}

.photo-card__meta {
  position: absolute;
  right: 1rem;
  top: 1rem;
  left: 1rem;
  display: grid;
  gap: 0.15rem;
}

.photo-card__eyebrow {
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.photo-card__title {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.1;
}
</style>
