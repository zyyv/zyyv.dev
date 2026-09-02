<script setup lang="ts">
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const colorMode = useColorMode()
const isDark = computed(() => colorMode.state.value === 'dark')
const { photoSources } = useBackgroundPhotos()
const { isReady, isUnavailable } = useVgpuBackground(canvas, isDark, photoSources)
</script>

<template>
  <div class="vgpu-background" :class="{ 'vgpu-background--ready': isReady }" aria-hidden="true">
    <canvas v-if="!isUnavailable" ref="canvas" class="vgpu-background__canvas" />
    <div class="vgpu-background__fallback" />
    <div class="vgpu-background__veil" />
  </div>
</template>

<style scoped>
.vgpu-background {
  position: fixed;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  background: #e9e9e5;
  pointer-events: none;
}

.vgpu-background__canvas,
.vgpu-background__fallback,
.vgpu-background__veil {
  position: absolute;
  width: 100%;
  height: 100%;
  inset: 0;
}

.vgpu-background__canvas {
  display: block;
  opacity: 0;
  transition: opacity 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.vgpu-background--ready .vgpu-background__canvas {
  opacity: 1;
}

.vgpu-background__fallback {
  background-color: #e9e9e5;
  background-image:
    radial-gradient(circle, rgb(65 92 75 / 18%) 0 0.06rem, transparent 0.08rem),
    radial-gradient(circle, rgb(105 82 128 / 13%) 0 0.05rem, transparent 0.07rem);
  background-position:
    0.8rem 1.4rem,
    2.6rem 3.2rem;
  background-size:
    5.25rem 5.25rem,
    7.5rem 7.5rem;
  transition: opacity 700ms ease;
}

.vgpu-background--ready .vgpu-background__fallback {
  opacity: 0;
}

.vgpu-background__veil {
  background: radial-gradient(circle at 50% 40%, rgb(233 233 229 / 18%), transparent 55%);
}

:global(.dark .vgpu-background) {
  background: #11110f;
}

:global(.dark .vgpu-background__fallback) {
  background-color: #11110f;
  background-image:
    radial-gradient(circle, rgb(112 158 129 / 20%) 0 0.06rem, transparent 0.08rem),
    radial-gradient(circle, rgb(142 118 171 / 16%) 0 0.05rem, transparent 0.07rem);
}

:global(.dark .vgpu-background__veil) {
  background: radial-gradient(circle at 50% 40%, rgb(17 17 15 / 18%), transparent 55%);
}

@media (prefers-reduced-motion: reduce) {
  .vgpu-background__canvas,
  .vgpu-background__fallback {
    transition: none;
  }
}
</style>
