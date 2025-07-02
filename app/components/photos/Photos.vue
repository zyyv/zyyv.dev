<script lang="ts" setup>
import { VirtualWaterfall } from '@lhlyu/vue-virtual-waterfall'

const {
  loading,
  allPhotos,
  hasMore,
  totalPhotos,
  isEmpty,
  scrollContainer,
  handleScroll,
  calcItemHeight,
  initPhotos,
} = usePhotos()

onMounted(() => {
  initPhotos()
})
</script>

<template>
  <div class="photos-container h-screen flex flex-col">
    <!-- 初始加载状态 -->
    <div v-if="!allPhotos.length && loading" class="flex justify-center items-center h-64">
      <div class="text-lg">
        Loading photos...
      </div>
    </div>

    <!-- 瀑布流容器 -->
    <div
      v-else
      ref="scrollContainer"
      class="flex-1 overflow-auto"
      @scroll="handleScroll"
    >
      <VirtualWaterfall
        :items="allPhotos"
        :calc-item-height="calcItemHeight"
        :gap="12"
        :padding="16"
        :item-min-width="200"
        :min-column-count="1"
        :max-column-count="5"
        :virtual="true"
        row-key="id"
      >
        <template #default="{ item }">
          <div class="bg-white">
            <ImgBlurHash
              :src="item.path"
              :blurhash="item.blurhash"
              class="w-full h-auto hover:scale-105 trans"
            />
          </div>
        </template>
      </VirtualWaterfall>

      <!-- 加载更多指示器 -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="flex items-center gap-2 text-gray-500">
          <div class="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>加载更多照片...</span>
        </div>
      </div>

      <!-- 没有更多数据提示 -->
      <div v-else-if="!hasMore && totalPhotos > 0" class="flex justify-center items-center py-8">
        <div class="text-gray-500 text-sm">
          已显示所有 {{ totalPhotos }} 张照片
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="isEmpty" class="flex justify-center items-center py-16">
        <div class="text-gray-500 text-center">
          <div class="text-2xl mb-2">
            📷
          </div>
          <div>暂无照片</div>
        </div>
      </div>
    </div>
  </div>
</template>
