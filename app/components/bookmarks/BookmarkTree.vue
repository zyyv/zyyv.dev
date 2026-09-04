<script setup lang="ts">
import type { BookmarkCanvasBounds, BookmarkCanvasLayout } from '~/utils/bookmarkCanvas'
import { bookmarkAncestorIds, bookmarkNodeInBounds } from '~/utils/bookmarkCanvas'
import BookmarkCanvasNode from './BookmarkCanvasNode.vue'

const props = defineProps<{
  layout: BookmarkCanvasLayout
  hoveredId: string | null
  selectedId: string | null
  overview: boolean
  semanticScale: number
  overviewExpansion: number
  bounds: BookmarkCanvasBounds | null
}>()

const emit = defineEmits<{
  hover: [id: string | null, x?: number, y?: number]
  select: [id: string]
  open: [id: string]
}>()

const childrenById = computed(() => {
  const children = new Map<string, string[]>()
  for (const edge of props.layout.edges) {
    const ids = children.get(edge.parentId) || []
    ids.push(edge.childId)
    children.set(edge.parentId, ids)
  }
  return children
})
const activeIds = computed(() => {
  const ids = bookmarkAncestorIds(props.selectedId, props.layout.parentById)
  const queue = props.selectedId ? [props.selectedId] : []
  while (queue.length) {
    const id = queue.shift()!
    for (const childId of childrenById.value.get(id) || []) {
      ids.add(childId)
      queue.push(childId)
    }
  }
  for (const id of bookmarkAncestorIds(props.hoveredId, props.layout.parentById)) ids.add(id)
  return ids
})
const structuralNodeIds = computed(
  () =>
    new Set(
      props.layout.nodes
        .filter((node) => !node.item || node.item.kind === 'folder')
        .map((node) => node.id),
    ),
)
const visibleNodes = computed(() => {
  if (props.overview) {
    return props.layout.nodes.filter((node) => !node.item || node.item.kind === 'folder')
  }
  if (!props.bounds) return props.layout.nodes
  return props.layout.nodes.filter((node) => bookmarkNodeInBounds(node, props.bounds!))
})
const visibleNodeIds = computed(() => new Set(visibleNodes.value.map((node) => node.id)))
const visibleEdges = computed(() => {
  if (props.overview) {
    return props.layout.edges.filter(
      (edge) =>
        structuralNodeIds.value.has(edge.parentId) && structuralNodeIds.value.has(edge.childId),
    )
  }
  return props.layout.edges.filter(
    (edge) =>
      visibleNodeIds.value.has(edge.parentId) ||
      visibleNodeIds.value.has(edge.childId) ||
      activeIds.value.has(edge.childId),
  )
})
</script>

<template>
  <div
    class="bookmark-tree"
    :class="{ 'is-overview': overview }"
    :style="{ width: `${layout.width}px`, height: `${layout.height}px` }"
  >
    <svg
      class="bookmark-tree__connections"
      :viewBox="`0 0 ${layout.width} ${layout.height}`"
      aria-hidden="true"
    >
      <g
        :transform="
          overview
            ? `translate(${layout.centerX} ${layout.centerY}) scale(${overviewExpansion}) translate(${-layout.centerX} ${-layout.centerY})`
            : undefined
        "
      >
        <path
          v-for="edge in visibleEdges"
          :key="edge.id"
          class="bookmark-tree__edge"
          :class="{ 'is-active': activeIds.has(edge.childId) }"
          :d="edge.path"
          :style="{ '--branch-color': edge.branchColor }"
          pathLength="1"
        />
      </g>
    </svg>

    <BookmarkCanvasNode
      v-for="node in visibleNodes"
      :key="node.id"
      v-memo="[activeIds.has(node.id), selectedId === node.id, semanticScale, overviewExpansion]"
      :node="node"
      :active="activeIds.has(node.id)"
      :selected="selectedId === node.id"
      :semantic-scale="semanticScale"
      :center-x="layout.centerX"
      :center-y="layout.centerY"
      :position-scale="overview ? overviewExpansion : 1"
      @activate="(id, x, y) => emit('hover', id, x, y)"
      @select="emit('select', $event)"
      @open="emit('open', $event)"
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
  opacity: 0.5;
  stroke: color-mix(in srgb, var(--branch-color) 72%, var(--canvas-line));
  stroke-width: 1;
  stroke-dasharray: 2 7;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  transition:
    stroke 180ms ease,
    stroke-width 180ms ease,
    stroke-dasharray 180ms ease,
    opacity 180ms ease;
}
.bookmark-tree__edge.is-active {
  opacity: 1;
  stroke: var(--branch-color);
  stroke-width: 2.25;
  stroke-dasharray: none;
}
.bookmark-tree.is-overview .bookmark-tree__edge {
  opacity: 0.72;
  stroke-width: 1.3;
}
@media (prefers-reduced-motion: reduce) {
  .bookmark-tree__edge {
    transition: none;
  }
}
</style>
