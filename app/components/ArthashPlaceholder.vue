<script setup lang="ts">
import type { Codec } from 'arthash'
import {
  arthashReady,
  decodeArthashToSvg,
  ensureArthashReady,
  type ArthashSvgOptions,
} from '~/utils/arthash'

const props = withDefaults(
  defineProps<{
    arthash?: string | null
    revealed: boolean
    arthashCodec?: Codec
    arthashOptions?: Omit<ArthashSvgOptions, 'codec'>
    animateReveal?: boolean
  }>(),
  {
    arthash: null,
    revealed: false,
    animateReveal: true,
  },
)

const rendered = computed(() => {
  void arthashReady.value
  return decodeArthashToSvg(props.arthash ?? undefined, {
    ...props.arthashOptions,
    codec: props.arthashCodec,
  })
})

const placeholder = useTemplateRef<HTMLDivElement>('placeholder')
const REVEAL_TOTAL_MS = 1000
const REVEAL_PER_SHAPE_MS = 220
const removed = shallowRef(false)
const wasVisible = shallowRef(false)
let removalTimer: ReturnType<typeof setTimeout> | undefined

function clearRemovalTimer() {
  if (!removalTimer) return
  clearTimeout(removalTimer)
  removalTimer = undefined
}

function svgChildren(): SVGGraphicsElement[] {
  const svg = placeholder.value?.querySelector('svg')
  if (!svg) return []

  const shapes: SVGGraphicsElement[] = []
  for (const node of Array.from(svg.children)) {
    const tag = node.tagName.toLowerCase()
    if (tag === 'defs' || tag === 'filter') continue

    if (tag === 'g') {
      for (const inner of Array.from((node as SVGGElement).children)) {
        shapes.push(inner as SVGGraphicsElement)
      }
    } else {
      shapes.push(node as SVGGraphicsElement)
    }
  }
  return shapes
}

function shapeArea(element: SVGGraphicsElement): number {
  try {
    const bounds = element.getBBox()
    return bounds.width * bounds.height
  } catch {
    return 0
  }
}

function rankedShapes() {
  return svgChildren()
    .map((element) => ({ element, area: shapeArea(element) }))
    .sort((a, b) => b.area - a.area)
    .map(({ element }) => element)
}

function applyStagger(shapes: SVGGraphicsElement[], opacity: '0' | '1', reverse: boolean) {
  const count = shapes.length
  if (!count) return

  const span = Math.max(0, REVEAL_TOTAL_MS - REVEAL_PER_SHAPE_MS)
  for (let index = 0; index < count; index += 1) {
    const slot = reverse ? count - 1 - index : index
    const delay = count <= 1 ? 0 : (span * slot) / (count - 1)
    const element = shapes[index]
    if (!element) continue

    element.style.transition = `opacity ${REVEAL_PER_SHAPE_MS}ms ease-out`
    element.style.transitionDelay = `${delay.toFixed(1)}ms`
    element.style.opacity = opacity
  }
}

function reveal() {
  applyStagger(rankedShapes(), '0', false)
}

function restore() {
  applyStagger(rankedShapes(), '1', true)
}

function reset() {
  for (const element of svgChildren()) {
    element.style.removeProperty('transition')
    element.style.removeProperty('transition-delay')
    element.style.removeProperty('opacity')
  }
}

function scheduleRemoval() {
  clearRemovalTimer()
  removalTimer = setTimeout(() => {
    removalTimer = undefined
    removed.value = true
  }, REVEAL_TOTAL_MS + 60)
}

watch(
  () => Boolean(rendered.value) && !props.revealed,
  (visible) => {
    if (visible) wasVisible.value = true
  },
  { immediate: true },
)

watch(
  [rendered, () => props.revealed],
  ([nextRendered, revealed], previous) => {
    const previousRendered = previous?.[0]
    clearRemovalTimer()
    removed.value = false

    if (!props.animateReveal) return

    // If the real image won the race against WASM initialization, do not
    // mount a placeholder after the image has already loaded.
    if (revealed && !wasVisible.value) {
      removed.value = true
      return
    }

    void nextTick(() => {
      if (!nextRendered) return
      if (nextRendered !== previousRendered) reset()
      if (revealed) {
        reveal()
        scheduleRemoval()
      } else {
        restore()
      }
    })
  },
  { immediate: true, flush: 'post' },
)

onMounted(() => {
  void ensureArthashReady()
})

onBeforeUnmount(clearRemovalTimer)
</script>

<template>
  <div
    v-if="rendered && !removed"
    ref="placeholder"
    class="arthash-placeholder"
    :class="{ 'arthash-placeholder--revealed': !props.animateReveal && props.revealed }"
    aria-hidden="true"
    v-html="rendered"
  />
</template>

<style scoped>
.arthash-placeholder {
  position: absolute;
  inset: 0;
  z-index: 1;
  contain: paint;
  pointer-events: none;
  transition: opacity 260ms ease;
}

.arthash-placeholder--revealed {
  opacity: 0;
}

.arthash-placeholder :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .arthash-placeholder {
    transition-duration: 1ms;
  }
}
</style>
