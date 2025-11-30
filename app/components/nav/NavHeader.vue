<script setup lang="ts">
const { width: windowWidth, height: windowHeight } = useWindowSize()
const { menuItems } = useNavMenu()

const el = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isMounted = ref(false)
const isHovered = ref(false)

type DockPosition = 'left' | 'right' | 'top' | 'bottom'
const dockPosition = ref<DockPosition>('right')

// Initial position
const x = ref(0)
const y = ref(0)

onMounted(() => {
  isMounted.value = true
  x.value = windowWidth.value - 70
  y.value = windowHeight.value * 0.7
  dockPosition.value = 'right'
})

// Drag logic
const startX = ref(0)
const startY = ref(0)
const initialX = ref(0)
const initialY = ref(0)

function onPointerDown(e: PointerEvent) {
  e.preventDefault()
  isDragging.value = false
  isHovered.value = false
  startX.value = e.clientX
  startY.value = e.clientY
  initialX.value = x.value
  initialY.value = y.value

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  const dx = e.clientX - startX.value
  const dy = e.clientY - startY.value

  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    isDragging.value = true
    isHovered.value = false
  }

  x.value = initialX.value + dx
  y.value = initialY.value + dy
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)

  if (!isDragging.value) {
    // Click event if needed
  }

  snapToEdge()

  setTimeout(() => {
    isDragging.value = false
  }, 0)
}

function snapToEdge() {
  const buttonSize = 48
  const padding = 12

  // Current center position
  const cx = x.value + buttonSize / 2
  const cy = y.value + buttonSize / 2

  const distLeft = cx
  const distRight = windowWidth.value - cx
  const distTop = cy
  const distBottom = windowHeight.value - cy

  const minDist = Math.min(distLeft, distRight, distTop, distBottom)

  if (minDist === distLeft) {
    x.value = padding
    dockPosition.value = 'left'
  }
  else if (minDist === distRight) {
    x.value = windowWidth.value - buttonSize - padding
    dockPosition.value = 'right'
  }
  else if (minDist === distTop) {
    y.value = padding
    dockPosition.value = 'top'
  }
  else {
    y.value = windowHeight.value - buttonSize - padding
    dockPosition.value = 'bottom'
  }

  // Clamp the other axis to keep it within screen
  if (dockPosition.value === 'left' || dockPosition.value === 'right') {
    if (y.value < padding)
      y.value = padding
    if (y.value > windowHeight.value - buttonSize - padding)
      y.value = windowHeight.value - buttonSize - padding
  }
  else {
    if (x.value < padding)
      x.value = padding
    if (x.value > windowWidth.value - buttonSize - padding)
      x.value = windowWidth.value - buttonSize - padding
  }
}

function onMouseEnter() {
  if (!isDragging.value) {
    isHovered.value = true
  }
}

function onMouseLeave() {
  isHovered.value = false
}

// Fan layout calculation
function getItemStyle(index: number, total: number) {
  if (!isHovered.value) {
    return {
      transform: 'translate(0, 0) scale(0)',
      opacity: 0,
    }
  }

  const radius = 70
  let baseAngle = 0

  switch (dockPosition.value) {
    case 'left':
      baseAngle = 0
      break
    case 'right':
      baseAngle = 180
      break
    case 'top':
      baseAngle = 90
      break
    case 'bottom':
      baseAngle = 270
      break
  }

  // If only one item, place it directly at base angle
  let angle = baseAngle

  if (total > 1) {
    const span = 90 // 90 degrees span
    const startAngle = baseAngle - span / 2
    const step = span / (total - 1)
    angle = startAngle + step * index
  }

  // Convert to radians
  const rad = (angle * Math.PI) / 180
  const dx = Math.cos(rad) * radius
  const dy = Math.sin(rad) * radius

  return {
    transform: `translate(${dx}px, ${dy}px) scale(1)`,
    opacity: 1,
  }
}

onClickOutside(el, () => {
  isHovered.value = false
})

watch([windowWidth, windowHeight], () => {
  if (!isDragging.value && isMounted.value) {
    snapToEdge()
  }
})
</script>

<template>
  <div
    v-show="isMounted"
    ref="el"
    fixed z-999
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    }"
    @pointerdown="onPointerDown"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- AssistiveTouch Ball -->
    <div
      size-9 rounded-full bg="dark/40 dark:light/20" backdrop-blur-md
      flex items-center justify-center
      cursor-move select-none
      transition-all duration-300
      :class="isHovered ? 'opacity-100 bg-black/60 dark:bg-white/30' : 'opacity-50 hover:opacity-100'"
    >
      <div size-7 rounded-full bg="white/40 dark:black/40" shadow-sm />
    </div>

    <!-- Menu Items Container -->
    <div
      class="absolute top-1/2 left-1/2"
      w-0 h-0
      flex items-center justify-center
      pointer-events-none
    >
      <div
        v-for="(item, index) in menuItems"
        :key="item.key"
        absolute
        transition-all duration-300 cubic-bezier="0.34, 1.56, 0.64, 1"
        :style="getItemStyle(index, menuItems.length)"
        class="pointer-events-auto"
      >
        <div
          w-10 h-10 rounded-full bg="black/40 dark:white/20" backdrop-blur-md
          flex items-center justify-center
          hover="bg-black/60 dark:bg-white/30 scale-110"
          transition-all
          cursor-pointer
          @click="item.action"
        >
          <component :is="item.component" v-if="item.component" />
          <div v-else :class="item.icon" text-xl text-white dark:text-black />
        </div>
      </div>
    </div>
  </div>
</template>
