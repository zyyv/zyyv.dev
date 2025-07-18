<script setup lang="ts">
const model = defineModel<{
  x: number
  y: number
}>()
const state = defineModel('state', { type: Boolean, default: false })
const container = ref<HTMLElement | null>(null)
const dragging = ref(false)

watchEffect(() => {
  state.value = dragging.value
})

function getRelativePosition(e: MouseEvent | TouchEvent) {
  const rect = container.value!.getBoundingClientRect()
  let clientX: number, clientY: number
  if (e instanceof TouchEvent) {
    clientX = e.touches[0]!.clientX
    clientY = e.touches[0]!.clientY
  }
  else {
    clientX = e.clientX
    clientY = e.clientY
  }
  let x = (clientX - rect.left) / rect.width
  let y = (clientY - rect.top) / rect.height
  x = Math.max(0, Math.min(1, x))
  y = Math.max(0, Math.min(1, y))
  return { x, y }
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!dragging.value)
    return
  const pos = getRelativePosition(e)
  model.value!.x = pos.x
  model.value!.y = pos.y
}

function stopDrag() {
  dragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
}

function startDrag(e: MouseEvent | TouchEvent) {
  dragging.value = true
  onDrag(e)
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('touchend', stopDrag)
}
onBeforeUnmount(stopDrag)
</script>

<template>
  <div ref="container" class="relative w-full h-full select-none">
    <!-- 横纵坐标轴 -->
    <div
      :class="{ trans: !dragging }"
      class="absolute border-l-1 border-dashed border-op-15 border-dark dark:border-white" :style="{
        left: `${model!.x * 100}%`,
        top: 0,
        height: '100%',
        width: 0,
        pointerEvents: 'none',
        transform: 'translateX(-0.5px)',
      }"
    />
    <div
      :class="{ trans: !dragging }"
      class="absolute border-t-1 border-dashed border-op-15 border-dark dark:border-white" :style="{
        top: `${model!.y * 100}%`,
        left: 0,
        width: '100%',
        height: 0,
        pointerEvents: 'none',
        transform: 'translateY(-0.5px)',
      }"
    />
    <!-- 原点 -->
    <div
      :class="{ trans: !dragging }"
      class="absolute size-2 hover:size-3 z-10 origin-dot rounded-full pointer-events-auto!"
      :style="{
        left: `${model!.x * 100}%`,
        top: `${model!.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        cursor: dragging ? 'grabbing' : 'grab',
      }"
      title="Drag to move"
      @mousedown.stop.prevent="startDrag"
      @touchstart.stop.prevent="startDrag"
    >
      <span class="ripple" />
    </div>
  </div>
</template>

<style scoped>
.origin-dot {
  background: linear-gradient(135deg, #a78bfa 0%, #f87171 100%);
  box-shadow: 0 0 12px 2px #a78bfa55;
  position: relative;
  overflow: visible;
}

.ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 150%;
  height: 150%;
  pointer-events: none;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, #f8717144 40%, transparent 70%);
  animation: ripple-wave 1.6s infinite;
  z-index: 1;
}

@keyframes ripple-wave {
  0% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1);
  }

  70% {
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(2.5);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(3);
  }
}
</style>
