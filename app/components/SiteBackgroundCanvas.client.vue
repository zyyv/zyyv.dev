<script setup lang="ts">
const emit = defineEmits<{ ready: [value: boolean] }>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const route = useRoute()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.state.value === 'dark')
const routeKey = computed(() => route.fullPath)
const { photoSources } = useBackgroundPhotos(routeKey)
const { isReady, isUnavailable } = useVgpuBackground(canvas, isDark, photoSources)
watch(isReady, (ready) => emit('ready', ready))
</script>

<template>
  <canvas v-if="!isUnavailable" ref="canvas" />
</template>
