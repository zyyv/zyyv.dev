<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'
import { createBookmarkCanvasLayout, ROOT_ID } from '~/utils/bookmarkCanvas'
import BookmarkInspector from './BookmarkInspector.vue'
import BookmarkPreviewPopover from './BookmarkPreviewPopover.vue'
import BookmarkTree from './BookmarkTree.vue'

const props = defineProps<{
  items: BookmarkNode[]
}>()

const query = defineModel<string>('query', { required: true })
const viewport = useTemplateRef<HTMLElement>('viewport')
const surface = useTemplateRef<HTMLElement>('surface')
const hoveredId = shallowRef<string | null>(null)
const selectedId = shallowRef<string | null>(null)
const selectionHistory = shallowRef<string[]>([])
const previewX = shallowRef(0)
const previewY = shallowRef(0)
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
const layout = computed(() => createBookmarkCanvasLayout(props.items))
const contentWidth = computed(() => layout.value.width)
const contentHeight = computed(() => layout.value.height)
const selectedNode = computed(
  () => layout.value.nodes.find((node) => node.id === selectedId.value && node.item)?.item || null,
)
const hoveredNode = computed(
  () =>
    layout.value.nodes.find((node) => node.id === hoveredId.value && node.item?.kind === 'bookmark')
      ?.item || null,
)

const {
  scale,
  bounds,
  isOverview,
  scaleLabel,
  fit,
  zoomIn,
  zoomOut,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
} = useCanvasViewport({
  viewport,
  surface,
  contentWidth,
  contentHeight,
  onBackgroundTap: clearSelection,
})
const semanticScale = computed(() => Math.min(10, Math.max(1, scale.value ** -0.7)))
const overviewExpansion = computed(() =>
  isOverview.value ? Math.min(2.5, Math.max(1, 1 + ((0.36 - scale.value) / 0.325) * 1.5)) : 1,
)

function selectNode(id: string) {
  if (id === ROOT_ID) return
  selectionHistory.value = []
  selectedId.value = selectedId.value === id ? null : id
}

function inspectNode(id: string) {
  if (id === ROOT_ID || id === selectedId.value) return
  if (!layout.value.nodes.some((node) => node.id === id && node.item)) return
  if (selectedId.value) selectionHistory.value = [...selectionHistory.value, selectedId.value]
  selectedId.value = id
}

function inspectPreviousNode() {
  const previousId = selectionHistory.value.at(-1)
  if (!previousId) return
  selectionHistory.value = selectionHistory.value.slice(0, -1)
  selectedId.value = previousId
}

function clearSelection() {
  selectedId.value = null
  selectionHistory.value = []
}

function hoverNode(id: string | null, x?: number, y?: number) {
  hoveredId.value = id
  if (typeof x === 'number') previewX.value = x
  if (typeof y === 'number') previewY.value = y
}

function openNode(node: BookmarkNode | null) {
  if (node?.kind === 'bookmark' && node.url) window.open(node.url, '_blank', 'noopener,noreferrer')
}

function openNodeById(id: string) {
  const node = layout.value.nodes.find((item) => item.id === id)?.item || null
  openNode(node)
}

useEventListener(document, 'keydown', (event) => {
  const target = event.target
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  if (event.key === '/' && !isTyping) {
    event.preventDefault()
    searchInput.value?.focus()
  }
  if (event.key === 'Escape') {
    clearSelection()
    searchInput.value?.blur()
  }
  if (event.key === '0' && !isTyping) fit()
})

watch(layout, () => {
  if (selectedId.value && !layout.value.parentById.has(selectedId.value)) clearSelection()
})
</script>

<template>
  <section class="bookmark-canvas" aria-label="书签关系画布">
    <header data-canvas-ui class="canvas-header">
      <h1 class="canvas-title">Bookmarks</h1>

      <label class="canvas-search">
        <i class="i-hugeicons:search-01" aria-hidden="true" text-xs />
        <input ref="searchInput" v-model="query" type="search" placeholder="Search" />
        <kbd>/</kbd>
      </label>

      <div class="canvas-controls" aria-label="画布缩放控制">
        <button type="button" aria-label="缩小" @click="zoomOut">
          <i class="i-hugeicons:minus-sign" />
        </button>
        <button type="button" class="canvas-controls__scale" aria-label="适配全部节点" @click="fit">
          {{ scaleLabel }}
        </button>
        <button type="button" aria-label="放大" @click="zoomIn">
          <i class="i-hugeicons:add-01" />
        </button>
        <button type="button" aria-label="适配全部节点" @click="fit">
          <i class="i-hugeicons:center-focus" />
        </button>
      </div>
    </header>

    <div
      ref="viewport"
      class="canvas-viewport"
      tabindex="0"
      @wheel="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @lostpointercapture="onPointerCancel"
    >
      <div class="canvas-grid" aria-hidden="true" />
      <div ref="surface" class="canvas-surface" :class="{ 'is-overview': isOverview }">
        <BookmarkTree
          :layout="layout"
          :hovered-id="hoveredId"
          :selected-id="selectedId"
          :overview="isOverview"
          :semantic-scale="semanticScale"
          :overview-expansion="overviewExpansion"
          :bounds="bounds"
          @hover="hoverNode"
          @select="selectNode"
          @open="openNodeById"
        />
      </div>

      <BookmarkInspector
        v-if="selectedNode"
        :key="selectedNode.id"
        :node="selectedNode"
        :can-go-back="selectionHistory.length > 0"
        @back="inspectPreviousNode"
        @close="clearSelection"
        @select="inspectNode"
        @open="openNode"
      />

      <BookmarkPreviewPopover
        v-if="hoveredNode && hoveredId !== selectedId"
        :node="hoveredNode"
        :x="previewX"
        :y="previewY"
      />

      <div v-if="!items.length" class="canvas-empty">
        <i class="i-hugeicons:route-02" aria-hidden="true" />
        <h2>No bookmarks found</h2>
        <p>Try another search.</p>
        <button v-if="query" type="button" @click="query = ''">Reset view</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bookmark-canvas {
  --canvas-bg: rgb(233 233 229 / 0.38);
  --canvas-ink: #11110f;
  --canvas-node: #f2f2ed;
  --canvas-node-active: #f5f5f0;
  --canvas-root: #f7f7f2;
  --canvas-icon: rgb(17 17 15 / 0.055);
  --canvas-line: rgb(17 17 15 / 0.24);
  --canvas-line-strong: rgb(17 17 15 / 0.16);
  --canvas-accent: #c8342d;
  --canvas-accent-contrast: #fff;
  --canvas-shadow: rgb(17 17 15 / 0.06);
  --canvas-shadow-active: rgb(120 32 28 / 0.14);
  position: relative;
  height: 100dvh;
  min-height: 36rem;
  overflow: hidden;
  background: var(--canvas-bg);
  backdrop-filter: blur(0.18rem) saturate(0.92);
  color: var(--canvas-ink);
  user-select: none;
}
.dark .bookmark-canvas {
  --canvas-bg: rgb(17 17 15 / 0.42);
  --canvas-ink: #e9e9e5;
  --canvas-node: #1b1b18;
  --canvas-node-active: #23231f;
  --canvas-root: #20201c;
  --canvas-icon: rgb(233 233 229 / 0.07);
  --canvas-line: rgb(233 233 229 / 0.24);
  --canvas-line-strong: rgb(233 233 229 / 0.16);
  --canvas-accent: #ef6259;
  --canvas-accent-contrast: #11110f;
  --canvas-shadow: rgb(0 0 0 / 0.2);
  --canvas-shadow-active: rgb(239 98 89 / 0.12);
}
.canvas-header {
  position: absolute;
  z-index: 10;
  top: clamp(1rem, 2.5vw, 2rem);
  right: clamp(1rem, 2.5vw, 2rem);
  left: clamp(4.75rem, 7vw, 6.5rem);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}
.canvas-title {
  margin-right: auto;
  margin-block: 0;
  font-size: clamp(1.1rem, 2vw, 1.65rem);
  font-weight: 650;
  line-height: 1;
  letter-spacing: -0.045em;
  pointer-events: auto;
}
.canvas-search {
  display: grid;
  width: min(13rem, 28vw);
  min-height: 2rem;
  box-sizing: border-box;
  grid-template-columns: auto minmax(4rem, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.55rem;
  border: 1px dashed var(--canvas-line-strong);
  background: color-mix(in srgb, var(--canvas-node) 58%, transparent);
  backdrop-filter: blur(0.75rem);
  pointer-events: auto;
}
.canvas-search input {
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font:
    0.68rem ui-monospace,
    monospace;
}
.canvas-search kbd {
  font:
    0.55rem ui-monospace,
    monospace;
  opacity: 0.32;
}
.canvas-controls {
  display: flex;
  min-height: 2rem;
  overflow: hidden;
  border: 1px dashed var(--canvas-line-strong);
  background: color-mix(in srgb, var(--canvas-node) 58%, transparent);
  backdrop-filter: blur(0.75rem);
  pointer-events: auto;
}
.canvas-controls button {
  display: grid;
  width: 2rem;
  padding: 0;
  border: 0;
  place-items: center;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.75rem;
}
.canvas-controls > button:not(:first-child) {
  border-left: 1px dashed var(--canvas-line-strong);
}
.canvas-controls button:hover,
.canvas-controls button:focus-visible {
  outline: 0;
  background: var(--canvas-icon);
}
.canvas-controls button:active {
  transform: translateY(1px);
}
.canvas-controls .canvas-controls__scale {
  width: 2.8rem;
  font:
    0.48rem ui-monospace,
    monospace;
}
.canvas-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  outline: none;
  cursor: grab;
  touch-action: none;
}
.canvas-viewport.is-dragging {
  cursor: grabbing;
}
.canvas-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, var(--canvas-ink) 13%, transparent) 0.75px,
    transparent 0.9px
  );
  background-position: center;
  background-size: 22px 22px;
  opacity: 0.42;
  pointer-events: none;
}
.canvas-surface {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
.canvas-empty {
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 50%;
  width: min(24rem, calc(100% - 2rem));
  text-align: center;
  transform: translate(-50%, -50%);
}
.canvas-empty > i {
  font-size: 2rem;
  opacity: 0.3;
}
.canvas-empty h2 {
  margin: 0.8rem 0 0;
  font-size: 1rem;
}
.canvas-empty p {
  margin: 0.4rem 0 0;
  font-size: 0.68rem;
  opacity: 0.52;
}
.canvas-empty button {
  margin-top: 1rem;
  border: 0;
  background: transparent;
  color: var(--canvas-accent);
  cursor: pointer;
  font:
    0.62rem ui-monospace,
    monospace;
}
@media (max-width: 760px) {
  .canvas-header {
    right: 0.85rem;
    left: 0.85rem;
  }
  .canvas-search {
    width: auto;
    flex: 1;
  }
  .canvas-search kbd,
  .canvas-controls__scale {
    display: none;
  }
}
</style>
