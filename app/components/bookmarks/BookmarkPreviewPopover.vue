<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'
import { bookmarkHost } from '~/utils/bookmarks'

const props = defineProps<{
  node: BookmarkNode
  x: number
  y: number
}>()

const host = computed(() => bookmarkHost(props.node.url))
const position = computed(() => {
  const width = import.meta.client ? window.innerWidth : 1440
  const height = import.meta.client ? window.innerHeight : 900
  return {
    left: `${Math.max(8, Math.min(props.x + 18, width - 310))}px`,
    top: `${Math.max(8, Math.min(props.y + 18, height - 250))}px`,
  }
})
</script>

<template>
  <aside class="node-preview" :style="position" aria-hidden="true">
    <div class="node-preview__copy">
      <strong>{{ node.title }}</strong>
      <span>{{ node.kind === 'folder' ? `${node.children.length} nodes` : host }}</span>
      <p v-if="node.description">{{ node.description }}</p>
    </div>
    <iframe
      v-if="node.url"
      :src="node.url"
      :title="`${node.title} hover preview`"
      loading="lazy"
      referrerpolicy="no-referrer"
      sandbox="allow-forms allow-scripts allow-same-origin"
    />
  </aside>
</template>

<style scoped>
.node-preview {
  position: fixed;
  z-index: 40;
  width: 18rem;
  overflow: hidden;
  border: 1px dashed var(--canvas-line-strong);
  border-radius: 0;
  background: color-mix(in srgb, var(--canvas-node) 68%, transparent);
  box-shadow: 0 1rem 3rem var(--canvas-shadow);
  backdrop-filter: blur(1rem);
  pointer-events: none;
  animation: preview-in 160ms ease-out;
  user-select: none;
}
.node-preview__copy {
  padding: 0.7rem 0.75rem;
}
.node-preview strong,
.node-preview span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-preview strong {
  font-size: 0.7rem;
}
.node-preview span {
  margin-top: 0.18rem;
  font:
    0.5rem ui-monospace,
    monospace;
  opacity: 0.46;
}
.node-preview p {
  display: -webkit-box;
  margin: 0.45rem 0 0;
  overflow: hidden;
  font-size: 0.58rem;
  line-height: 1.45;
  opacity: 0.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.node-preview iframe {
  display: block;
  width: 100%;
  height: 9.5rem;
  border: 0;
  border-top: 1px dashed var(--canvas-line-strong);
  border-radius: 0;
  background: white;
}
@keyframes preview-in {
  from {
    opacity: 0;
    transform: translateY(0.25rem) scale(0.985);
  }
}
@media (max-width: 760px), (hover: none) {
  .node-preview {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .node-preview {
    animation: none;
  }
}
</style>
