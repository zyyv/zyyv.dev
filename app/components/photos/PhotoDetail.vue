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
  select: [photo: Photo]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const thumbnailRefs = ref<HTMLElement[]>([])

const currentIndex = computed(() => {
  if (!props.photo || !props.photos.length)
    return -1
  return props.photos.findIndex(p => p.id === props.photo?.id)
})
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.photos.length - 1)

watch(
  [currentIndex, () => props.visible],
  async ([index, visible]) => {
    if (!visible || index < 0)
      return

    await nextTick()
    thumbnailRefs.value[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  },
  { flush: 'post' },
)

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

function photoPreviewSrc(item: Photo): string {
  return item.thumbnail || item.path
}

function setThumbnailRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el instanceof HTMLElement)
    thumbnailRefs.value[index] = el
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && photo"
      class="fixed inset-0 z-[2147483647] bg-black/86 backdrop-blur-md flex items-center justify-center"
      @click.self="emit('close')"
    >
      <!-- 关闭按钮 -->
      <button
        class="absolute top-4 right-4 z-10 size-10 fcc rounded-full bg-white/10 text-white/78 hover:bg-white/18 hover:text-white transition-colors"
        aria-label="关闭预览"
        @click="emit('close')"
      >
        <i i-hugeicons:cancel-01 />
      </button>

      <!-- 主要内容区域 -->
      <div class="w-full h-full max-w-[96rem] mx-auto p-4 pt-16 lg:pt-4 flex flex-col gap-4">
        <div class="min-h-0 flex-1 flex flex-col lg:flex-row gap-4">
          <!-- 图片区域 -->
          <div class="relative min-h-0 flex-1 flex items-center justify-center px-10 sm:px-14">
            <button
              v-if="hasPrev"
              class="absolute left--3.5 sm:left--2 top-1/2 -translate-y-1/2 z-10 size-11 fcc rounded-full bg-black/16 text-2xl cursor-pointer text-white/78 backdrop-blur hover:bg-white/16 hover:text-white transition-colors"
              aria-label="上一张"
              @click="emit('prev')"
            >
              <i i-hugeicons:arrow-left-01 />
            </button>

            <img
              :src="photo.path"
              :alt="photo.filename"
              class="max-w-full max-h-full object-contain rounded-md shadow-2xl shadow-black/30"
              @click.stop
            >

            <button
              v-if="hasNext"
              class="absolute right--3.5 sm:right--2 top-1/2 -translate-y-1/2 z-10 size-11 fcc rounded-full bg-black/16 text-2xl cursor-pointer text-white/78 backdrop-blur hover:bg-white/16 hover:text-white transition-colors"
              aria-label="下一张"
              @click="emit('next')"
            >
              <i i-hugeicons:arrow-right-01 />
            </button>
          </div>

          <!-- 图片信息面板 -->
          <aside
            class="w-full max-h-[40vh] lg:max-h-none lg:w-84 shrink-0 overflow-y-auto rounded-lg border border-white/12 p-5 text-white shadow-2xl shadow-black/30 bg-gray-600/10"
            @click.stop
          >
            <div class="mb-5 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="mt-1 truncate text-lg font-semibold">
                  {{ photo.filename || photo.id }}
                </h3>
              </div>
              <div class="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                {{ currentIndex + 1 }} / {{ photos.length }}
              </div>
            </div>

            <div class="space-y-5">
              <!-- 基本信息 -->
              <section>
                <div class="mb-3 flex items-center gap-2 text-sm font-medium text-white/88">
                  <i class="i-hugeicons:image-03 text-base text-sky-300" />
                  <span>基本信息</span>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:file-01 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">文件名</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ photo.id }}</span>
                  </div>
                  <div class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:maximize-01 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">尺寸</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ photo.width }} x {{ photo.height }}</span>
                  </div>
                  <div class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:database-01 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">文件大小</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ photo.sizeFormatted }}</span>
                  </div>
                  <div class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:calendar-03 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">修改时间</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ formatDate(photo.modifiedAt.toString()) }}</span>
                  </div>
                </div>
              </section>

              <!-- EXIF 信息 -->
              <section v-if="photo.exif" class="border-t border-white/12 pt-5">
                <div class="mb-3 flex items-center gap-2 text-sm font-medium text-white/88">
                  <i class="i-hugeicons:camera-ai text-base text-amber-300" />
                  <span>拍摄信息</span>
                </div>
                <div class="space-y-2 text-sm">
                  <div v-if="photo.exif.make && photo.exif.model" class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:camera-01 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">相机</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ photo.exif.make }} {{ photo.exif.model }}</span>
                  </div>
                  <div v-if="photo.exif.lens" class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:camera-lens mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">镜头</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ photo.exif.lens }}</span>
                  </div>
                  <div v-if="photo.exif.focalLength" class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:zoom-in-area mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">焦距</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ photo.exif.focalLength }}mm</span>
                  </div>
                  <div v-if="photo.exif.fNumber" class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:iris-scan mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">光圈</span>
                    <span class="min-w-0 break-words text-right text-white/88">f/{{ photo.exif.fNumber }}</span>
                  </div>
                  <div v-if="photo.exif.exposureTime" class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:timer-01 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">快门</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ formatExposureTime(photo.exif.exposureTime) }}</span>
                  </div>
                  <div v-if="photo.exif.iso" class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:settings-05 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">ISO</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ photo.exif.iso }}</span>
                  </div>
                  <div v-if="photo.exif.dateTime" class="grid grid-cols-[1.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 rounded-md bg-white/[0.045] px-3 py-2">
                    <i class="i-hugeicons:clock-01 mt-0.5 text-white/45" />
                    <span class="shrink-0 whitespace-nowrap text-white/55">拍摄时间</span>
                    <span class="min-w-0 break-words text-right text-white/88">{{ formatDate(photo.exif.dateTime) }}</span>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>

        <!-- 缩略图列表 -->
        <div
          class="shrink-0 rounded-lg p-3 bg-gray-600/10"
          @click.stop
        >
          <div class="flex gap-2 overflow-x-auto overscroll-x-contain scroll-smooth scroll-none">
            <button
              v-for="(item, index) in photos"
              :key="item.id"
              :ref="el => setThumbnailRef(el, index)"
              class="relative h-18 w-24 shrink-0 overflow-hidden rounded-md border transition-all"
              :class="item.id === photo.id ? 'border-stone-400 border-dashed shadow-lg shadow-white/12 opacity-100' : 'border-white/12 opacity-58 hover:opacity-90 hover:border-white/35'"
              :aria-label="`预览 ${item.filename || item.id}`"
              @click="emit('select', item)"
            >
              <img
                :src="photoPreviewSrc(item)"
                :alt="item.filename"
                class="size-full object-cover"
                loading="lazy"
              >
              <!-- <div
                v-if="item.id === photo.id"
                class="absolute inset-x-0 bottom-0 h-0.75 bg-white"
              /> -->
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
