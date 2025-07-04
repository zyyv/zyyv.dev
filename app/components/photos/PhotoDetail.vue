<script lang="ts" setup>
import type { Photo } from '~/types'
import dayjs from 'dayjs'

interface Props {
  photo: Photo | null
  photos: Photo[]
  visible: boolean
}

interface Emits {
  close: []
  prev: []
  next: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentIndex = computed(() => {
  if (!props.photo || !props.photos.length)
    return -1
  return props.photos.findIndex(p => p.id === props.photo?.id)
})
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.photos.length - 1)

function handleKeydown(e: KeyboardEvent) {
  if (!props.visible)
    return

  switch (e.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowLeft':
      if (hasPrev.value)
        emit('prev')
      break
    case 'ArrowRight':
      if (hasNext.value)
        emit('next')
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function formatDate(dateString: string): string {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

function formatExposureTime(time?: number): string {
  if (!time)
    return ''
  if (time >= 1)
    return `${time}s`
  const fraction = Math.round(1 / time)
  return `1/${fraction}s`
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && photo"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      @click.self="emit('close')"
    >
      <!-- 关闭按钮 -->
      <button
        class="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
        @click="emit('close')"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- 上一张按钮 -->
      <button
        v-if="hasPrev"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white transition-colors"
        @click="emit('prev')"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- 下一张按钮 -->
      <button
        v-if="hasNext"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white transition-colors"
        @click="emit('next')"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- 主要内容区域 -->
      <div class="w-full h-full flex flex-col lg:flex-row max-w-7xl mx-auto p-4">
        <!-- 图片区域 -->
        <div class="flex-1 flex items-center justify-center min-h-0">
          <img
            :src="photo.path"
            :alt="photo.filename"
            class="max-w-full max-h-full object-contain"
            @click.stop
          >
        </div>

        <!-- 图片信息面板 -->
        <div class="w-full lg:w-80 bg-black/50 backdrop-blur-sm rounded-lg p-6 mt-4 lg:mt-0 lg:ml-4 text-white overflow-y-auto">
          <div class="space-y-4">
            <!-- 基本信息 -->
            <div>
              <h3 class="text-lg font-semibold mb-3">
                基本信息
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-white/70">文件名</span>
                  <span>{{ photo.id }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/70">尺寸</span>
                  <span>{{ photo.width }} × {{ photo.height }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/70">文件大小</span>
                  <span>{{ photo.sizeFormatted }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/70">修改时间</span>
                  <span>{{ formatDate(photo.modifiedAt.toString()) }}</span>
                </div>
              </div>
            </div>
            <!-- EXIF 信息 -->
            <div v-if="photo.exif" class="border-t border-white/20 pt-4">
              <h3 class="text-lg font-semibold mb-3">
                拍摄信息
              </h3>
              <div class="space-y-2 text-sm">
                <div v-if="photo.exif.make && photo.exif.model" class="flex justify-between">
                  <span class="text-white/70">相机</span>
                  <span>{{ photo.exif.make }} {{ photo.exif.model }}</span>
                </div>
                <div v-if="photo.exif.lens" class="flex justify-between">
                  <span class="text-white/70">镜头</span>
                  <span>{{ photo.exif.lens }}</span>
                </div>
                <div v-if="photo.exif.focalLength" class="flex justify-between">
                  <span class="text-white/70">焦距</span>
                  <span>{{ photo.exif.focalLength }}mm</span>
                </div>
                <div v-if="photo.exif.fNumber" class="flex justify-between">
                  <span class="text-white/70">光圈</span>
                  <span>f/{{ photo.exif.fNumber }}</span>
                </div>
                <div v-if="photo.exif.exposureTime" class="flex justify-between">
                  <span class="text-white/70">快门</span>
                  <span>{{ formatExposureTime(photo.exif.exposureTime) }}</span>
                </div>
                <div v-if="photo.exif.iso" class="flex justify-between">
                  <span class="text-white/70">ISO</span>
                  <span>{{ photo.exif.iso }}</span>
                </div>
                <div v-if="photo.exif.dateTime" class="flex justify-between">
                  <span class="text-white/70">拍摄时间</span>
                  <span>{{ formatDate(photo.exif.dateTime) }}</span>
                </div>
              </div>
            </div>

            <!-- 导航信息 -->
            <div class="border-t border-white/20 pt-4 text-center text-sm text-white/70">
              {{ currentIndex + 1 }} / {{ photos.length }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
