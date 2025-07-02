<script lang="ts" setup>
import { decode } from 'blurhash'

// Props
interface Props {
  mode?: string
  blurhash?: string
  src: string
  srcset?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'img',
})

// Refs and state
const placeholderSrc = ref<string>()
const isLoaded = ref(false)
const isImgMode = props.mode === 'img'
const attrs = useAttrs()
const url = computed(() => isLoaded.value || !placeholderSrc.value ? props.src : placeholderSrc.value)

// Utility function for creating a data URL from an array of pixels
function getDataUrlFromArr(arr: Uint8ClampedArray, w: number, h: number) {
  if (typeof w === 'undefined' || typeof h === 'undefined')
    w = h = Math.sqrt(arr.length / 4)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  canvas.width = w
  canvas.height = h

  const imgData = ctx.createImageData(w, h)
  imgData.data.set(arr)
  ctx.putImageData(imgData, 0, 0)

  return canvas.toDataURL()
}

onMounted(() => {
  // Decode the blurhash if available
  if (props.blurhash) {
    const pixels = decode(props.blurhash, 32, 32)
    placeholderSrc.value = getDataUrlFromArr(pixels, 32, 32)
  }

  // Create a temporary image to check when the image has loaded
  const img = document.createElement('img')
  img.onload = () => {
    isLoaded.value = true
  }
  img.src = props.src
  if (props.srcset)
    img.srcset = props.srcset

  // Fallback to mark as loaded after a timeout in case the image takes too long
  setTimeout(() => {
    isLoaded.value = true
  }, 3000)
})
</script>

<template>
  <img v-if="isImgMode" v-bind="attrs" :src="url" :srcset object-cover>
  <div v-else v-bind="attrs" :style="{ backgroundImage: `url(${url})`, backgroundSize: 'cover' }" />
</template>
