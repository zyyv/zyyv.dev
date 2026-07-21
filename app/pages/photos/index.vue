<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoDetail from '~/components/photos/PhotoDetail.vue'
import PhotosGallery from '~/components/photos/Photos.vue'
import RipplablePhotos from '~/components/photos/RipplablePhotos.vue'

const route = useRoute()
const photosPageRef = useTemplateRef<HTMLElement>('photosPage')
const { data: photoResponse } = await usePublicPhotos()
const photos = computed(() => photoResponse.value.photos)
const currentPhoto = shallowRef<Photo | null>(null)
const showPreview = computed(() => currentPhoto.value !== null)
const sharedPhotoId = computed(() =>
  typeof route.query.photo === 'string' ? route.query.photo : null,
)
const currentIndex = computed(() => {
  if (!currentPhoto.value) return -1
  return photos.value.findIndex((photo) => photo.id === currentPhoto.value?.id)
})

const { mode, isTransitioning } = usePhotosViewMode()
const {
  isTransitioning: isPhotoTransitioning,
  openPhoto,
  closePhoto,
} = usePhotoDialogViewTransition({ sourceRoot: photosPageRef })

async function openPreview(photo: Photo, source: HTMLElement | null = null) {
  await openPhoto(source, () => {
    currentPhoto.value = photo
  })
}

async function closePreview() {
  if (!currentPhoto.value) return
  await closePhoto(currentPhoto.value.id, () => {
    currentPhoto.value = null
  })
}

function showPrevPhoto() {
  const photo = photos.value[currentIndex.value - 1]
  if (photo) currentPhoto.value = photo
}

function showNextPhoto() {
  const photo = photos.value[currentIndex.value + 1]
  if (photo) currentPhoto.value = photo
}

function openSharedPhoto(photoId: string | null) {
  if (!photoId) return
  const photo = photos.value.find((item) => item.id === photoId)
  if (photo) void openPreview(photo)
}

watch(sharedPhotoId, openSharedPhoto)

onMounted(() => {
  openSharedPhoto(sharedPhotoId.value)
})

watch(
  showPreview,
  (visible) => {
    if (import.meta.client) document.body.style.overflow = visible ? 'hidden' : ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

useSeoMeta({
  title: 'Photos - Chris',
  description: 'Chris的摄影作品集',
  ogType: 'website',
  ogTitle: 'Photos - Chris',
  ogDescription: 'Chris的摄影作品集',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/photos',
  twitterTitle: 'Photos - Chris',
  twitterDescription: 'Chris的摄影作品集',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/photos' }],
})
</script>

<template>
  <div ref="photosPage" class="photos-page">
    <Transition name="photos-view" mode="out-in" :css="!isTransitioning">
      <PhotosGallery
        v-if="mode === 'waterfall'"
        key="waterfall"
        :photos="photos"
        @open="openPreview"
      />
      <RipplablePhotos v-else key="ripplable" :photos="photos" @open="openPreview" />
    </Transition>

    <PhotoDetail
      :photo="currentPhoto"
      :photos="photos"
      :visible="showPreview"
      :transitioning="isPhotoTransitioning"
      @close="closePreview"
      @prev="showPrevPhoto"
      @next="showNextPhoto"
      @select="openPreview"
    />
  </div>
</template>

<style scoped>
.photos-page {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  contain: layout;
}

.photos-view-enter-active,
.photos-view-leave-active {
  transition:
    opacity 220ms ease,
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photos-view-enter-from {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.992);
}

.photos-view-leave-to {
  opacity: 0;
  transform: translateY(-0.45rem) scale(0.996);
}

@media (prefers-reduced-motion: reduce) {
  .photos-view-enter-active,
  .photos-view-leave-active {
    transition-duration: 1ms;
  }
}
</style>
