<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'
import { createBookmarkCanvasLayout } from '~/utils/bookmarkCanvas'
import BookmarkTree from './BookmarkTree.vue'

const props = defineProps<{
  items: BookmarkNode[]
  tags: string[]
  bookmarkCount: number
  folderCount: number
}>()

const query = defineModel<string>('query', { required: true })
const tag = defineModel<string>('tag', { required: true })
const viewport = useTemplateRef<HTMLElement>('viewport')
const surface = useTemplateRef<HTMLElement>('surface')
const hoveredId = shallowRef<string | null>(null)
const selectedId = shallowRef<string | null>(null)
const controlsOpen = shallowRef(false)
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
const layout = computed(() => createBookmarkCanvasLayout(props.items))
const contentWidth = computed(() => layout.value.width)
const contentHeight = computed(() => layout.value.height)
const selectedNode = computed(
  () => layout.value.nodes.find((node) => node.id === selectedId.value && node.item)?.item || null,
)

const {
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
} = useCanvasViewport({ viewport, surface, contentWidth, contentHeight })

function selectNode(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

function clearFilters() {
  query.value = ''
  tag.value = ''
}

useEventListener(document, 'keydown', (event) => {
  const target = event.target
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  if (event.key === '/' && !isTyping) {
    event.preventDefault()
    searchInput.value?.focus()
  }
  if (event.key === 'Escape') {
    selectedId.value = null
    searchInput.value?.blur()
  }
  if (event.key === '0' && !isTyping) fit()
})

watch(layout, () => {
  if (selectedId.value && !layout.value.parentById.has(selectedId.value)) selectedId.value = null
})
</script>

<template>
  <section class="bookmark-canvas" aria-label="书签关系画布">
    <header class="canvas-header">
      <div class="canvas-title">
        <h1>Bookmarks</h1>
        <span>{{ bookmarkCount }} links / {{ folderCount }} folders</span>
      </div>

      <div class="canvas-search">
        <i class="i-hugeicons:search-01" aria-hidden="true" />
        <input ref="searchInput" v-model="query" type="search" placeholder="Search the canvas" />
        <kbd>/</kbd>
      </div>

      <button
        class="canvas-filter-toggle"
        :class="{ 'is-active': controlsOpen || tag }"
        type="button"
        :aria-expanded="controlsOpen"
        aria-label="显示筛选器"
        @click="controlsOpen = !controlsOpen"
      >
        <i class="i-hugeicons:filter-horizontal" aria-hidden="true" />
      </button>
    </header>

    <div v-show="controlsOpen" class="canvas-filter-panel">
      <label>
        <span>Filter by tag</span>
        <select v-model="tag">
          <option value="">All tags</option>
          <option v-for="item in tags" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <button v-if="query || tag" type="button" @click="clearFilters">Clear filters</button>
    </div>

    <div
      ref="viewport"
      class="canvas-viewport"
      tabindex="0"
      @wheel="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="canvas-grid" aria-hidden="true" />
      <div ref="surface" class="canvas-surface" :class="{ 'is-overview': isOverview }">
        <BookmarkTree
          :layout="layout"
          :hovered-id="hoveredId"
          :selected-id="selectedId"
          :overview="isOverview"
          :bounds="bounds"
          @hover="hoveredId = $event"
          @select="selectNode"
        />
      </div>

      <div class="canvas-hint" aria-hidden="true">
        <i class="i-hugeicons:mouse-01" />
        <span>Drag to move<br />Scroll to zoom</span>
      </div>

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
          <i class="i-hugeicons:focus" />
        </button>
      </div>

      <aside v-if="selectedNode" class="canvas-inspector" aria-live="polite">
        <button type="button" aria-label="关闭节点详情" @click="selectedId = null">
          <i class="i-hugeicons:cancel-01" />
        </button>
        <span>{{ selectedNode.kind === 'folder' ? 'Folder' : 'Bookmark' }}</span>
        <h2>{{ selectedNode.title }}</h2>
        <p v-if="selectedNode.description">{{ selectedNode.description }}</p>
        <div v-if="selectedNode.tags.length" class="canvas-inspector__tags">
          <span v-for="item in selectedNode.tags" :key="item">#{{ item }}</span>
        </div>
        <a v-if="selectedNode.url" :href="selectedNode.url" target="_blank" rel="noreferrer">
          Open link <i class="i-hugeicons:arrow-up-right-01" />
        </a>
      </aside>

      <div v-if="!items.length" class="canvas-empty">
        <i class="i-hugeicons:route-02" aria-hidden="true" />
        <h2>No nodes found</h2>
        <p>Try another search or clear the active filter.</p>
        <button v-if="query || tag" type="button" @click="clearFilters">Reset view</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bookmark-canvas {
  --canvas-bg: #e9e9e5;
  --canvas-ink: #11110f;
  --canvas-node: rgb(242 242 237 / 0.9);
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
  color: var(--canvas-ink);
}
.dark .bookmark-canvas {
  --canvas-bg: #11110f;
  --canvas-ink: #e9e9e5;
  --canvas-node: rgb(27 27 24 / 0.9);
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
  gap: 0.7rem;
  pointer-events: none;
}
.canvas-title {
  margin-right: auto;
  pointer-events: auto;
}
.canvas-title h1 {
  margin: 0;
  font-size: clamp(1.25rem, 2.4vw, 2rem);
  font-weight: 650;
  line-height: 1;
  letter-spacing: -0.055em;
}
.canvas-title span {
  display: block;
  margin-top: 0.38rem;
  font:
    0.53rem ui-monospace,
    monospace;
  opacity: 0.42;
  text-transform: uppercase;
}
.canvas-search {
  display: grid;
  width: min(19rem, 34vw);
  height: 2.55rem;
  box-sizing: border-box;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0 0.75rem;
  border: 1px solid var(--canvas-line-strong);
  border-radius: 0.75rem;
  background: var(--canvas-node);
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
.canvas-filter-toggle {
  display: grid;
  height: 2.55rem;
  border: 1px solid var(--canvas-line-strong);
  border-radius: 0.75rem;
  place-items: center;
  background: var(--canvas-node);
  color: inherit;
  cursor: pointer;
  pointer-events: auto;
}
.canvas-filter-toggle {
  width: 2.55rem;
}
.canvas-filter-toggle.is-active {
  border-color: var(--canvas-accent);
  color: var(--canvas-accent);
}
.canvas-filter-panel {
  position: absolute;
  z-index: 11;
  top: clamp(4.2rem, 7vw, 5.2rem);
  right: clamp(1rem, 2.5vw, 2rem);
  display: flex;
  width: 14rem;
  box-sizing: border-box;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.9rem;
  border: 1px solid var(--canvas-line-strong);
  border-radius: 0.85rem;
  background: var(--canvas-node);
  box-shadow: 0 1rem 3rem var(--canvas-shadow);
}
.canvas-filter-panel label span {
  display: block;
  margin-bottom: 0.45rem;
  font:
    0.52rem ui-monospace,
    monospace;
  opacity: 0.46;
  text-transform: uppercase;
}
.canvas-filter-panel select,
.canvas-filter-panel button {
  width: 100%;
  height: 2.2rem;
  border: 1px solid var(--canvas-line-strong);
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  font:
    0.64rem ui-monospace,
    monospace;
}
.canvas-filter-panel button {
  cursor: pointer;
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
.canvas-surface.is-overview :deep(.canvas-node--folder .canvas-node__main),
.canvas-surface.is-overview :deep(.canvas-node--root .canvas-node__root) {
  transform: scale(2);
}
.canvas-surface.is-overview :deep(.canvas-node--folder .canvas-node__main:hover),
.canvas-surface.is-overview :deep(.canvas-node--folder .canvas-node__main:focus-visible),
.canvas-surface.is-overview :deep(.canvas-node--folder.is-active .canvas-node__main),
.canvas-surface.is-overview :deep(.canvas-node--folder.is-selected .canvas-node__main),
.canvas-surface.is-overview :deep(.canvas-node--root .canvas-node__root:hover),
.canvas-surface.is-overview :deep(.canvas-node--root .canvas-node__root:focus-visible) {
  transform: translateY(-2px) scale(2.04);
}
.canvas-controls {
  position: absolute;
  z-index: 4;
  right: clamp(1rem, 2.5vw, 2rem);
  bottom: clamp(1rem, 2.5vw, 2rem);
  display: flex;
  overflow: hidden;
  border: 1px solid var(--canvas-line-strong);
  border-radius: 0.75rem;
  background: var(--canvas-node);
}
.canvas-controls button {
  display: grid;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--canvas-line-strong);
  place-items: center;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.canvas-controls button:first-child {
  border-left: 0;
}
.canvas-controls .canvas-controls__scale {
  width: 3.5rem;
  font:
    0.52rem ui-monospace,
    monospace;
}
.canvas-controls button:hover {
  background: var(--canvas-icon);
}
.canvas-hint {
  position: absolute;
  z-index: 3;
  bottom: clamp(1rem, 2.5vw, 2rem);
  left: clamp(4.75rem, 7vw, 6.5rem);
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font:
    0.52rem/1.45 ui-monospace,
    monospace;
  opacity: 0.34;
  text-transform: uppercase;
}
.canvas-hint > i {
  font-size: 1rem;
}
.canvas-inspector {
  position: absolute;
  z-index: 5;
  right: clamp(1rem, 2.5vw, 2rem);
  bottom: clamp(4.5rem, 8vw, 5.5rem);
  width: min(18rem, calc(100vw - 2rem));
  box-sizing: border-box;
  padding: 1rem;
  border: 1px solid var(--canvas-line-strong);
  border-radius: 0.85rem;
  background: var(--canvas-node);
  box-shadow: 0 1rem 3rem var(--canvas-shadow);
  animation: inspector-in 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
.canvas-inspector > button {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  display: grid;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  border: 0;
  border-radius: 0.45rem;
  place-items: center;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.canvas-inspector > span {
  font:
    0.5rem ui-monospace,
    monospace;
  opacity: 0.42;
  text-transform: uppercase;
}
.canvas-inspector h2 {
  margin: 0.45rem 2rem 0 0;
  font-size: 1rem;
  letter-spacing: -0.025em;
}
.canvas-inspector p {
  margin: 0.7rem 0 0;
  font-size: 0.68rem;
  line-height: 1.55;
  opacity: 0.62;
}
.canvas-inspector__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.7rem;
}
.canvas-inspector__tags span {
  font:
    0.53rem ui-monospace,
    monospace;
  opacity: 0.52;
}
.canvas-inspector > a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.9rem;
  color: var(--canvas-accent);
  font-size: 0.68rem;
  text-decoration: none;
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
@keyframes inspector-in {
  from {
    opacity: 0;
    transform: translateY(0.7rem) scale(0.98);
  }
}
@media (max-width: 760px) {
  .canvas-header {
    right: 0.85rem;
    left: 0.85rem;
  }
  .canvas-title span {
    display: none;
  }
  .canvas-search {
    width: auto;
    flex: 1;
  }
  .canvas-search kbd,
  .canvas-filter-panel {
    top: 4.3rem;
    right: 0.85rem;
  }
  .canvas-hint {
    display: none;
  }
  .canvas-controls {
    right: 0.85rem;
    bottom: 5.2rem;
  }
  .canvas-inspector {
    right: 0.85rem;
    bottom: 8.5rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .canvas-inspector {
    animation: none;
  }
}
</style>
