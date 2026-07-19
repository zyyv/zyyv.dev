<script setup lang="ts">
import type { Photo } from '~/types'
import dayjs from 'dayjs'
import PhotosPhotoDetail from '~/components/photos/PhotoDetail.vue'

const route = useRoute()
const router = useRouter()
const photoId = computed(() => String(route.params.id))

// The gallery and detail page deliberately share this async-data key. A click
// from /photos reuses the already-loaded list with no extra request. A direct
// production visit renders from the single-photo endpoint first, then loads the
// filmstrip on the client without delaying the main image.
const { data: photoResponse, status: listStatus } = await usePublicPhotos({
  lazy: true,
  server: import.meta.dev,
})
const listedPhotos = computed(() => photoResponse.value.photos)
const listedPhoto = computed(
  () => listedPhotos.value.find((item) => item.id === photoId.value) ?? null,
)

// Keep the request dormant when the gallery cache already contains the photo.
// In local development /api/photos/** is proxied to the deployed site, where a
// newly-added detail endpoint may not exist yet, so the full-list fallback is
// used until the endpoint has been deployed.
const {
  data: fetchedPhoto,
  error: fetchError,
  execute: fetchPhoto,
} = await useFetch<Photo>(() => `/api/photos/${encodeURIComponent(photoId.value)}`, {
  immediate: false,
  dedupe: 'cancel',
  watch: false,
})

async function ensurePhoto() {
  if (import.meta.dev || listedPhoto.value) return
  await fetchPhoto()
}

await ensurePhoto()

watch(photoId, () => {
  void ensurePhoto()
})

const photo = computed(() => {
  if (fetchedPhoto.value?.id === photoId.value) return fetchedPhoto.value
  return listedPhoto.value
})
const photos = computed(() => {
  if (!photo.value || listedPhoto.value) return listedPhotos.value
  // Give direct visits a useful one-item filmstrip immediately. The complete
  // navigation list replaces it as soon as the lazy gallery request resolves.
  return [photo.value]
})

const { isTransitioning, closePhoto } = usePhotoViewTransition()

if (import.meta.server && !import.meta.dev && fetchError.value?.statusCode === 404) {
  setResponseStatus(useRequestEvent()!, 404)
}

const listSettled = computed(() => listStatus.value === 'success' || listStatus.value === 'error')
const detailNotFound = computed(() => fetchError.value?.statusCode === 404)
const notFound = computed(
  () => !photo.value && (detailNotFound.value || (import.meta.dev && listSettled.value)),
)

const pageTitle = computed(() =>
  photo.value ? `${photo.value.filename} - Photos - Chris` : 'Photo - Chris',
)
const pageDescription = computed(() => {
  const current = photo.value
  if (!current) return 'Chris的摄影作品'
  const captured = current.exif?.dateTime ?? current.createdAt
  return `${current.filename} · ${current.width} x ${current.height} · Shot on ${dayjs(captured).format('YYYY-MM-DD')} - Chris的摄影作品`
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogType: 'website',
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: computed(() => photo.value?.compressed ?? 'https://zyyv.dev/og.png#1'),
  ogUrl: computed(() => `https://zyyv.dev/photos/${photoId.value}`),
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: computed(() => photo.value?.compressed ?? 'https://zyyv.dev/og.png#1'),
})

useHead({
  link: [{ rel: 'canonical', href: computed(() => `https://zyyv.dev/photos/${photoId.value}`) }],
})

const currentIndex = computed(() => {
  if (!photo.value) return -1
  return photos.value.findIndex((item) => item.id === photo.value?.id)
})

function selectPhoto(target: Photo) {
  if (target.id === photoId.value) return
  // Replace instead of push: the URL always points at the viewed photo (so the
  // share button copies the right link) without filling history with every
  // filmstrip/prev/next switch.
  router.replace(`/photos/${target.id}`)
}

function showPrevPhoto() {
  const prev = photos.value[currentIndex.value - 1]
  if (prev) selectPhoto(prev)
}

function showNextPhoto() {
  const next = photos.value[currentIndex.value + 1]
  if (next) selectPhoto(next)
}

function close() {
  if (photo.value) {
    void closePhoto(photo.value.id)
  } else {
    router.push('/photos')
  }
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="photo-detail-page">
    <PhotosPhotoDetail
      v-if="photo"
      :photo="photo"
      :photos="photos"
      :visible="true"
      :transitioning="isTransitioning"
      @close="close"
      @prev="showPrevPhoto"
      @next="showNextPhoto"
      @select="selectPhoto"
    />

    <div v-else-if="notFound" class="photo-detail-page__status">
      <i class="i-hugeicons:image-not-found-01" aria-hidden="true" />
      <p>This photo is unavailable or private.</p>
      <NuxtLink to="/photos">Back to gallery</NuxtLink>
    </div>

    <div v-else class="photo-detail-page__status" aria-live="polite">
      <div class="photo-detail-page__spinner" />
      <p>Loading photo...</p>
    </div>
  </div>
</template>

<style scoped>
.photo-detail-page {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  contain: layout;
}

.photo-detail-page__status {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  gap: 0.75rem;
  font-size: 0.85rem;
  opacity: 0.72;
}

.photo-detail-page__status i {
  font-size: 1.6rem;
}

.photo-detail-page__status p {
  margin: 0;
}

.photo-detail-page__status a {
  color: inherit;
  font-size: 0.78rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  opacity: 0.8;
}

.photo-detail-page__spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  opacity: 0.6;
  animation: photo-detail-page-spin 0.8s linear infinite;
}

@keyframes photo-detail-page-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-detail-page__spinner {
    animation: none;
  }
}
</style>
