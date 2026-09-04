<script setup lang="ts">
import type { BookmarkCanvasNode } from '~/utils/bookmarkCanvas'

const props = defineProps<{
  node: BookmarkCanvasNode
  active: boolean
  selected: boolean
  semanticScale: number
  centerX: number
  centerY: number
  positionScale: number
}>()

const emit = defineEmits<{
  activate: [id: string | null, x?: number, y?: number]
  select: [id: string]
  open: [id: string]
}>()

const style = computed(() => {
  const x = props.centerX + (props.node.x - props.centerX) * props.positionScale
  const y = props.centerY + (props.node.y - props.centerY) * props.positionScale
  const scale = props.node.item?.kind === 'bookmark' ? 1 : props.semanticScale
  return {
    transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`,
    '--branch-color': props.node.branchColor,
    '--node-size': `${props.node.size}px`,
  }
})

function activate(event: MouseEvent | FocusEvent) {
  if (!props.node.item) return
  const mouseEvent = event instanceof MouseEvent ? event : null
  emit('activate', props.node.id, mouseEvent?.clientX, mouseEvent?.clientY)
}
</script>

<template>
  <article
    data-canvas-node
    class="canvas-node"
    :class="[
      node.item?.kind ? `canvas-node--${node.item.kind}` : 'canvas-node--root',
      { 'is-active': active, 'is-selected': selected },
    ]"
    :style="style"
    @mouseenter="activate"
    @mouseleave="emit('activate', null)"
    @focusin="activate"
    @focusout="emit('activate', null)"
  >
    <button
      class="canvas-node__main"
      type="button"
      :disabled="!node.item"
      :aria-pressed="selected"
      :aria-label="node.item?.title || 'Bookmarks'"
      @click="node.item && emit('select', node.id)"
      @dblclick="node.item?.kind === 'bookmark' && emit('open', node.id)"
    >
      <strong>{{ node.item?.title || 'Bookmarks' }}</strong>
    </button>
  </article>
</template>

<style scoped>
.canvas-node {
  position: absolute;
  z-index: 2;
  width: 11.5rem;
  color: var(--canvas-ink);
  font-family: 'DM Sans', sans-serif;
  transform-origin: center;
  user-select: none;
}
.canvas-node:hover,
.canvas-node:focus-within,
.canvas-node.is-active,
.canvas-node.is-selected {
  z-index: 30;
}
.canvas-node__main {
  appearance: none;
  display: block;
  width: 100%;
  min-height: 2.75rem;
  box-sizing: border-box;
  padding: 0.72rem 0.8rem;
  border: 1px dashed color-mix(in srgb, var(--branch-color) 72%, var(--canvas-line));
  border-radius: 0;
  outline: 0;
  background: var(--canvas-node);
  background-clip: padding-box;
  box-shadow: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 180ms ease,
    color 180ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.canvas-node:not(.canvas-node--root) .canvas-node__main:hover,
.canvas-node:not(.canvas-node--root) .canvas-node__main:focus-visible,
.canvas-node.is-active .canvas-node__main,
.canvas-node.is-selected .canvas-node__main {
  outline: 0;
  border-style: solid;
  border-color: var(--branch-color);
  color: color-mix(in srgb, var(--branch-color) 68%, var(--canvas-ink));
  transform: translateY(-1px);
}
.canvas-node__main:active {
  transform: translateY(1px);
}
.canvas-node__main strong {
  display: block;
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 620;
  letter-spacing: -0.012em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-node--root {
  width: 8rem;
}
.canvas-node--root .canvas-node__main {
  background: var(--canvas-root);
  cursor: default;
}
.canvas-node--folder {
  width: var(--node-size);
}
.canvas-node--folder .canvas-node__main {
  display: grid;
  min-height: 0;
  aspect-ratio: 1;
  padding: 0.55rem;
  border-radius: 50%;
  place-items: center;
  text-align: center;
}
.canvas-node--folder .canvas-node__main strong {
  width: 100%;
}
@media (prefers-reduced-motion: reduce) {
  .canvas-node__main {
    transition: none;
  }
}
</style>
