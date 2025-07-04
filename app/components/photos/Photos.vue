<script lang="ts" setup>
import { VirtualWaterfall } from '@lhlyu/vue-virtual-waterfall'

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
} = usePhotos()

onMounted(() => {
  initPhotos()
})
</script>

<template>
  <div class="photos-container h-screen flex flex-col">
    <!-- 错误状态 -->
    <div v-if="error" class="flex flex-col justify-center items-center h-64 p-4">
      <div class="text-red-500 text-lg mb-4">
        {{ error }}
      </div>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        @click="refreshPhotos"
      >
        重新加载
      </button>
    </div>

    <!-- 初始加载状态 -->
    <div v-else-if="!allPhotos.length && loading" class="flex justify-center items-center h-64">
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
        :item-min-width="300"
        :min-column-count="1"
        :max-column-count="5"
        :virtual="true"
        row-key="id"
      >
        <template #default="{ item }">
          <ImgBlurHash
            :src="item.path"
            :blurhash="item.blurhash"
            :aspect-ratio="item.width / item.height"
            class="w-full h-auto hover:scale-105 trans"
          />
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
