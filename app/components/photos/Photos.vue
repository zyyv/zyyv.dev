<script lang="ts" setup>
import type { Photo } from '~/types'
import { VirtualWaterfall } from '@lhlyu/vue-virtual-waterfall'
import PhotoEmptyState from '~/components/photos/PhotoEmptyState.vue'
import PhotoCardMedia from '~/components/photos/PhotoCardMedia.vue'
import PhotoHoverInfo from '~/components/photos/PhotoHoverInfo.vue'

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
  handleScroll,
  calcItemHeight,
  refreshPhotos,
} = usePhotos(() => props.photos)

function openPreview(photo: Photo, event: MouseEvent) {
  emit('open', photo, event.currentTarget as HTMLElement)
}
</script>

<template>
  <div class="photos-gallery flex h-full min-h-0 w-full flex-col" :class="{ 'h-auto': pageScroll }">
    <!-- 错误状态 -->
    <div v-if="error" class="flex flex-col justify-center items-center h-64 p-4">
      <div class="text-red-500 text-lg mb-4">
        {{ error }}
      </div>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded @hover:bg-blue-600 transition-colors"
        data-cuelume-toggle="pulse"
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
      class="photos-scroll flex-1 overflow-auto"
      :class="{ 'flex-none! overflow-visible!': pageScroll }"
      @scroll="pageScroll ? undefined : handleScroll($event)"
    >
      <VirtualWaterfall
        :items="allPhotos"
        :calc-item-height="calcItemHeight"
        :gap="4"
        :padding="4"
        :item-min-width="300"
        :min-column-count="2"
        :max-column-count="6"
        :virtual="!pageScroll"
        row-key="id"
      >
        <template #default="{ item }">
          <button
            type="button"
            class="photo-card"
            :data-photo-transition-id="item.id"
            :aria-label="`View ${item.filename}`"
            data-cuelume-toggle="page"
            @click="openPreview(item, $event)"
          >
            <PhotoCardMedia
              :photo="item"
              :loading="item.id === allPhotos[0]?.id ? 'eager' : 'lazy'"
              class="photo-card__image"
              :style="{ '--media-aspect-ratio': `${item.width} / ${item.height}` }"
            />
            <PhotoHoverInfo :photo="item" />
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
        <PhotoEmptyState />
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

.photo-card:focus-visible :deep(.photo-hover-info) {
  opacity: 1;
  transform: translateY(0);
}

@media (hover: hover) and (pointer: fine) {
  .photo-card:hover :deep(.photo-hover-info) {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
