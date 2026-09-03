<script setup lang="ts">
import type { BookmarkCanvasBounds, BookmarkCanvasLayout } from '~/utils/bookmarkCanvas'
import { bookmarkAncestorIds, bookmarkNodeInBounds } from '~/utils/bookmarkCanvas'
import BookmarkCanvasNode from './BookmarkCanvasNode.vue'

const props = defineProps<{
  layout: BookmarkCanvasLayout
  hoveredId: string | null
  selectedId: string | null
  overview: boolean
  bounds: BookmarkCanvasBounds | null
}>()

const emit = defineEmits<{
  hover: [id: string | null]
  select: [id: string]
}>()

const focusId = computed(() => props.hoveredId || props.selectedId)
const activeIds = computed(() => bookmarkAncestorIds(focusId.value, props.layout.parentById))
const visibleNodes = computed(() => {
  if (props.overview) {
    return props.layout.nodes.filter((node) => !node.item || node.item.kind === 'folder')
  }
  if (!props.bounds) return props.layout.nodes
  return props.layout.nodes.filter((node) => bookmarkNodeInBounds(node, props.bounds!))
})
const overviewLeaves = computed(() =>
  props.overview ? props.layout.nodes.filter((node) => node.item?.kind === 'bookmark') : [],
)
const visibleNodeIds = computed(() => new Set(visibleNodes.value.map((node) => node.id)))
const visibleEdges = computed(() => {
  if (props.overview) return props.layout.edges
  return props.layout.edges.filter(
    (edge) =>
      visibleNodeIds.value.has(edge.parentId) ||
      visibleNodeIds.value.has(edge.childId) ||
      activeIds.value.has(edge.childId),
  )
})
</script>

<template>
  <div class="bookmark-tree" :style="{ width: `${layout.width}px`, height: `${layout.height}px` }">
    <svg
      class="bookmark-tree__connections"
      :viewBox="`0 0 ${layout.width} ${layout.height}`"
      aria-hidden="true"
    >
      <path
        v-for="edge in visibleEdges"
        :key="edge.id"
        class="bookmark-tree__edge"
        :class="{ 'is-active': activeIds.has(edge.childId) }"
        :d="edge.path"
        pathLength="1"
      />
      <circle
        v-for="node in overviewLeaves"
        :key="node.id"
        class="bookmark-tree__leaf"
        :cx="node.x"
        :cy="node.y"
        r="7"
      />
    </svg>

    <BookmarkCanvasNode
      v-for="node in visibleNodes"
      :key="node.id"
      v-memo="[activeIds.has(node.id), selectedId === node.id]"
      :node="node"
      :active="activeIds.has(node.id)"
      :selected="selectedId === node.id"
      @activate="emit('hover', $event)"
      @select="emit('select', $event)"
    />
  </div>
</template>

<style scoped>
.bookmark-tree {
  position: relative;
  transform-origin: 0 0;
}
.bookmark-tree__connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.bookmark-tree__edge {
  fill: none;
  stroke: var(--canvas-line);
  stroke-width: 1.15;
  stroke-dasharray: 2 8;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  transition:
    stroke 180ms ease,
    stroke-width 180ms ease,
    stroke-dasharray 180ms ease,
    opacity 180ms ease;
}
.bookmark-tree__leaf {
  fill: var(--canvas-node);
  stroke: var(--canvas-line);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
.bookmark-tree__edge.is-active {
  stroke: var(--canvas-accent);
  stroke-width: 2.25;
  stroke-dasharray: 1 0;
}
@media (prefers-reduced-motion: reduce) {
  .bookmark-tree__edge {
    transition: none;
  }
}
</style>
