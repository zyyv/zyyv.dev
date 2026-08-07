<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoDetail from '~/components/photos/PhotoDetail.vue'
import PhotosGallery from '~/components/photos/Photos.vue'
import RipplablePhotos from '~/components/photos/RipplablePhotos.vue'

const route = useRoute()
const { authenticated } = useAdminSession()
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
    <NuxtLink
      v-if="authenticated"
      to="/admin/photos"
      class="photos-admin-link"
      aria-label="整理照片"
    >
      <i class="i-hugeicons:settings-02" aria-hidden="true" />
      <span>整理照片</span>
    </NuxtLink>

    <Transition
      name="photos-view"
      :mode="isTransitioning ? undefined : 'out-in'"
      :css="!isTransitioning"
    >
      <PhotosGallery
        v-if="mode === 'waterfall'"
        key="waterfall"
        :photos="photos"
        @open="openPreview"
      />
      <RipplablePhotos
        v-else
        key="ripplable"
        :photos="photos"
        :preview-visible="showPreview"
        :focused-photo="currentPhoto"
        @open="openPreview"
      />
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
.photos-admin-link {
  position: fixed;
  z-index: 29;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.65rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  color: inherit;
  font-size: 0.64rem;
  text-decoration: none;
  backdrop-filter: blur(18px) saturate(135%);
  transition:
    transform 180ms ease,
    background-color 180ms ease;
}
.photos-admin-link:hover {
  background: color-mix(in srgb, currentColor 12%, transparent);
  transform: translateY(-1px);
}
.photos-admin-link:active {
  transform: translateY(1px);
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
  .photos-admin-link {
    transition: none;
  }
  .photos-view-enter-active,
  .photos-view-leave-active {
    transition-duration: 1ms;
  }
}
@media (max-width: 767.9px) {
  .photos-admin-link {
    top: 0.65rem;
    right: 0.65rem;
  }
  .photos-admin-link span {
    display: none;
  }
}
</style>
