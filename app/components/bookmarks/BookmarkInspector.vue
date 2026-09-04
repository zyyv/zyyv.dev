<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'
import { bookmarkHost } from '~/utils/bookmarks'

const props = defineProps<{
  node: BookmarkNode
  canGoBack: boolean
}>()
const emit = defineEmits<{
  back: []
  close: []
  select: [id: string]
  open: [node: BookmarkNode]
}>()

const host = computed(() => bookmarkHost(props.node.url))
</script>

<template>
  <aside data-canvas-ui class="canvas-inspector" aria-live="polite" @pointerdown.stop @wheel.stop>
    <header class="canvas-inspector__header">
      <button
        class="canvas-inspector__back"
        type="button"
        aria-label="返回上一层"
        :disabled="!canGoBack"
        @click.stop="emit('back')"
      >
        <i class="i-hugeicons:arrow-left-01" />
      </button>
      <h2>
        <i v-if="node.kind === 'folder'" class="i-hugeicons:folder-02" aria-hidden="true" />
        <span>{{ node.title }}</span>
      </h2>
      <button
        class="canvas-inspector__close"
        type="button"
        aria-label="关闭节点详情"
        @click.stop="emit('close')"
      >
        <i class="i-hugeicons:cancel-01" />
      </button>
    </header>

    <div v-if="node.kind === 'folder'" class="canvas-inspector__folder">
      <ul v-if="node.children.length">
        <li v-for="child in node.children" :key="child.id">
          <button
            type="button"
            :aria-label="`${child.title}，单击查看，双击打开`"
            @click="emit('select', child.id)"
            @dblclick="child.kind === 'bookmark' && emit('open', child)"
          >
            <i
              v-if="child.kind === 'folder'"
              class="i-hugeicons:folder-02 canvas-inspector__folder-icon"
              aria-hidden="true"
            />
            <span>{{ child.title }}</span>
          </button>
        </li>
      </ul>
      <p v-else class="canvas-inspector__empty">Empty folder</p>
    </div>

    <template v-else>
      <div class="canvas-inspector__meta">
        <span>{{ host }}</span>
        <p v-if="node.description">{{ node.description }}</p>
        <div v-if="node.tags.length" class="canvas-inspector__tags">
          <span v-for="item in node.tags" :key="item">#{{ item }}</span>
        </div>
      </div>
      <div class="canvas-inspector__frame">
        <iframe
          v-if="node.url"
          :key="node.id"
          :src="node.url"
          :title="`${node.title} preview`"
          loading="lazy"
          referrerpolicy="no-referrer"
          sandbox="allow-forms allow-scripts allow-same-origin"
        />
      </div>
      <button class="canvas-inspector__open" type="button" @click="emit('open', node)">
        Open <i class="i-hugeicons:arrow-up-right-01" />
      </button>
    </template>
  </aside>
</template>

<style scoped>
.canvas-inspector {
  position: absolute;
  z-index: 8;
  top: 5rem;
  right: clamp(1rem, 2.5vw, 2rem);
  width: min(25rem, calc(100vw - 5.8rem));
  max-height: calc(100dvh - 7rem);
  box-sizing: border-box;
  overflow: auto;
  border: 1px dashed var(--canvas-line-strong);
  border-radius: 0;
  background: color-mix(in srgb, var(--canvas-node) 68%, transparent);
  box-shadow: 0 1.25rem 4rem var(--canvas-shadow);
  backdrop-filter: blur(1rem);
  animation: inspector-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}
.canvas-inspector__header {
  display: grid;
  min-height: 2.65rem;
  grid-template-columns: 2.65rem minmax(0, 1fr) 2.65rem;
  border-bottom: 1px dashed var(--canvas-line-strong);
}
.canvas-inspector__header h2 {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.45rem;
  overflow: hidden;
  margin: 0;
  padding: 0.78rem 0.85rem;
  font-size: 0.76rem;
  font-weight: 640;
  letter-spacing: -0.015em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-inspector__header h2 span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-inspector__header button {
  display: grid;
  padding: 0;
  border: 0;
  place-items: center;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.canvas-inspector__back {
  border-right: 1px dashed var(--canvas-line-strong) !important;
}
.canvas-inspector__back:disabled {
  opacity: 0.18;
  cursor: default;
}
.canvas-inspector__close {
  border-left: 1px dashed var(--canvas-line-strong) !important;
}
.canvas-inspector__header button:hover,
.canvas-inspector__header button:focus-visible {
  outline: 0;
  background: var(--canvas-icon);
}
.canvas-inspector__folder ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.canvas-inspector__folder li:not(:first-child) {
  border-top: 1px dashed var(--canvas-line-strong);
}
.canvas-inspector__folder button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  padding: 0.72rem 0.85rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.68rem;
  font-weight: 560;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-inspector__folder button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-inspector__folder-icon {
  flex: 0 0 auto;
  font-size: 0.82rem;
  opacity: 0.68;
}
.canvas-inspector__folder button:hover,
.canvas-inspector__folder button:focus-visible {
  outline: 0;
  background: color-mix(in srgb, currentColor 5%, transparent);
}
.canvas-inspector__empty {
  margin: 0;
  padding: 1.5rem 0.85rem;
  font:
    0.55rem ui-monospace,
    monospace;
  opacity: 0.45;
}
.canvas-inspector__meta {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px dashed var(--canvas-line-strong);
}
.canvas-inspector__meta > span {
  font:
    0.53rem ui-monospace,
    monospace;
  opacity: 0.48;
}
.canvas-inspector__meta p {
  margin: 0.5rem 0 0;
  font-size: 0.63rem;
  line-height: 1.5;
  opacity: 0.62;
}
.canvas-inspector__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.55rem;
}
.canvas-inspector__tags span {
  font:
    0.5rem ui-monospace,
    monospace;
  opacity: 0.52;
}
.canvas-inspector__frame {
  height: min(20rem, 42vh);
  background: white;
}
.canvas-inspector__frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
.canvas-inspector__open {
  display: flex;
  width: 100%;
  min-height: 2.35rem;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.85rem;
  border: 0;
  border-top: 1px dashed var(--canvas-line-strong);
  background: transparent;
  color: inherit;
  font:
    0.55rem ui-monospace,
    monospace;
  cursor: pointer;
}
.canvas-inspector__open:hover,
.canvas-inspector__open:focus-visible {
  outline: 0;
  background: var(--canvas-icon);
}
@keyframes inspector-in {
  from {
    opacity: 0;
    transform: translateX(0.4rem);
  }
}
@media (max-width: 760px) {
  .canvas-inspector {
    top: auto;
    right: 0.75rem;
    bottom: 4.5rem;
    width: calc(100vw - 1.5rem);
    max-height: 58dvh;
  }
}
@media (prefers-reduced-motion: reduce) {
  .canvas-inspector {
    animation: none;
  }
}
</style>
