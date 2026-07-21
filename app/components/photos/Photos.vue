<script lang="ts" setup>
import type { Photo } from '~/types'
import { VirtualWaterfall } from '@lhlyu/vue-virtual-waterfall'

const props = withDefaults(
  defineProps<{
    photos?: Photo[]
    pageScroll?: boolean
  }>(),
  {
    photos: () => [],
    pageScroll: false,
  },
)
const emit = defineEmits<{
  open: [photo: Photo, source: HTMLElement]
}>()

const {
  loading,
  error,
  allPhotos,
  hasMore,
  totalPhotos,
  isEmpty,
  scrollContainer,
  handleScroll,
  calcItemHeight,
  initPhotos,
  refreshPhotos,
} = usePhotos(props.photos)

function openPreview(photo: Photo, event: MouseEvent) {
  emit('open', photo, event.currentTarget as HTMLElement)
}

onMounted(() => {
  initPhotos()
})
</script>

<template>
  <div class="photos-gallery flex h-full min-h-0 w-full flex-col" :class="{ 'h-auto': pageScroll }">
    <!-- 错误状态 -->
    <div v-if="error" class="flex flex-col justify-center items-center h-64 p-4">
      <div class="text-red-500 text-lg mb-4">
        {{ error }}
      </div>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        @click="refreshPhotos"
      >
        Reload
      </button>
    </div>

    <!-- 初始加载状态 -->
    <div v-else-if="!allPhotos.length && loading" class="flex justify-center items-center h-64">
      <div class="text-lg">Loading photos...</div>
    </div>

    <!-- 瀑布流容器 -->
    <div
      v-else
      ref="scrollContainer"
      class="photos-scroll flex-1 overflow-auto"
      :class="{ 'flex-none! overflow-visible!': pageScroll }"
      @scroll="pageScroll ? undefined : handleScroll()"
    >
      <VirtualWaterfall
        :items="allPhotos"
        :calc-item-height="calcItemHeight"
        :gap="12"
        :padding="16"
        :item-min-width="300"
        :min-column-count="1"
        :max-column-count="5"
        :virtual="!pageScroll"
        row-key="id"
      >
        <template #default="{ item }">
          <button
            type="button"
            class="photo-card"
            :data-photo-transition-id="item.id"
            :aria-label="`View ${item.filename}`"
            @click="openPreview(item, $event)"
          >
            <ImgBlurHash
              :src="item.thumbnail"
              :blurhash="item.blurhash"
              :aspect-ratio="item.width / item.height"
              class="photo-card__image"
            />
            <PhotosPhotoHoverInfo :photo="item" />
          </button>
        </template>
      </VirtualWaterfall>

      <!-- 加载更多指示器 -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="flex items-center gap-2 text-gray-500">
          <div
            class="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"
          />
          <span>Loading...</span>
        </div>
      </div>

      <!-- 没有更多数据提示 -->
      <div
        v-else-if="!pageScroll && !hasMore && totalPhotos > 0"
        class="flex justify-center items-center py-8"
      >
        <div class="text-basecolor text-op-50 text-sm">
          All {{ totalPhotos }} photos are displayed
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="isEmpty" class="flex justify-center items-center py-16">
        <div class="text-gray-500 text-center">
          <div class="text-2xl mb-2">
            <i i-hugeicons:file-edit />
          </div>
          <div>No photos available</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: zoom-in;
  outline: none;
}

.photo-card::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.photo-card:focus-visible {
  box-shadow: 0 0 0 2px currentColor;
}

.photo-card:hover :deep(.photo-hover-info),
.photo-card:focus-visible :deep(.photo-hover-info) {
  opacity: 1;
  transform: translateY(0);
}

.photo-card__image {
  display: block;
  width: 100%;
  height: auto;
  transform: scale(1.002);
  transition:
    transform 480ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 320ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .photo-card:hover .photo-card__image {
    filter: brightness(0.88) saturate(0.96);
    transform: scale(1.025);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-card__image {
    transition: none;
  }
}
</style>
