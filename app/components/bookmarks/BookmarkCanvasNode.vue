<script setup lang="ts">
import type { BookmarkCanvasNode } from '~/utils/bookmarkCanvas'
import { bookmarkHost } from '~/utils/bookmarks'

const props = defineProps<{
  node: BookmarkCanvasNode
  active: boolean
  selected: boolean
}>()

const emit = defineEmits<{
  activate: [id: string | null]
  select: [id: string]
}>()

const host = computed(() => bookmarkHost(props.node.item?.url || null))
const style = computed(() => ({
  transform: `translate3d(${props.node.x}px, ${props.node.y}px, 0) translate(-50%, -50%)`,
}))
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
    @mouseenter="emit('activate', node.id)"
    @mouseleave="emit('activate', null)"
    @focusin="emit('activate', node.id)"
    @focusout="emit('activate', null)"
  >
    <button
      v-if="!node.item"
      class="canvas-node__root"
      type="button"
      :aria-pressed="selected"
      @click="emit('select', node.id)"
    >
      <span class="canvas-node__root-mark"><i class="i-hugeicons:asterisk-02" /></span>
      <span
        ><strong>root</strong><small>{{ node.childCount }} nodes</small></span
      >
    </button>

    <button
      v-else-if="node.item.kind === 'folder'"
      class="canvas-node__main"
      type="button"
      :aria-pressed="selected"
      @click="emit('select', node.id)"
    >
      <span class="canvas-node__icon"><i class="i-hugeicons:folder-02" /></span>
      <span class="canvas-node__copy">
        <strong>{{ node.item.title }}</strong>
        <small>{{ node.childCount }} {{ node.childCount === 1 ? 'item' : 'items' }}</small>
      </span>
      <i class="canvas-node__pin i-hugeicons:pin" aria-hidden="true" />
    </button>

    <a
      v-else
      class="canvas-node__main"
      :href="node.item.url || undefined"
      target="_blank"
      rel="noreferrer"
      :aria-label="`${node.item.title}，在新标签页打开`"
      @click="emit('select', node.id)"
    >
      <span class="canvas-node__icon">
        <img v-if="node.item.iconUrl" :src="node.item.iconUrl" alt="" loading="lazy" />
        <i v-else class="i-hugeicons:link-02" aria-hidden="true" />
      </span>
      <span class="canvas-node__copy">
        <strong>{{ node.item.title }}</strong>
        <small>{{ host }}</small>
      </span>
      <i class="canvas-node__open i-hugeicons:arrow-up-right-01" aria-hidden="true" />
    </a>
  </article>
</template>

<style scoped>
.canvas-node {
  position: absolute;
  z-index: 2;
  width: 12.25rem;
  color: var(--canvas-ink);
  font-family: 'DM Sans', sans-serif;
  transform-origin: center;
}
.canvas-node:hover,
.canvas-node:focus-within,
.canvas-node.is-active,
.canvas-node.is-selected {
  z-index: 30;
}
.canvas-node__main,
.canvas-node__root {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 3.9rem;
  box-sizing: border-box;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.72rem;
  padding: 0.65rem 0.72rem;
  border: 1px solid var(--canvas-line-strong);
  border-radius: 0.85rem;
  background: var(--canvas-node);
  box-shadow: 0 0.35rem 1rem var(--canvas-shadow);
  color: inherit;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition:
    border-color 180ms ease,
    box-shadow 220ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 180ms ease;
}
.canvas-node__main:hover,
.canvas-node__main:focus-visible,
.canvas-node__root:hover,
.canvas-node__root:focus-visible,
.canvas-node.is-active .canvas-node__main,
.canvas-node.is-selected .canvas-node__main {
  outline: 0;
  border-color: var(--canvas-accent);
  background: var(--canvas-node-active);
  box-shadow: 0 1rem 2.5rem var(--canvas-shadow-active);
  transform: translateY(-2px) scale(1.025);
}
.canvas-node__main:active,
.canvas-node__root:active {
  transform: translateY(1px) scale(0.985);
}
.canvas-node__icon,
.canvas-node__root-mark {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.62rem;
  place-items: center;
  background: var(--canvas-icon);
  font-size: 1rem;
}
.canvas-node__icon img {
  width: 1.15rem;
  height: 1.15rem;
  object-fit: contain;
}
.canvas-node__copy,
.canvas-node__root > span:last-child {
  min-width: 0;
}
.canvas-node__copy strong,
.canvas-node__copy small,
.canvas-node__root strong,
.canvas-node__root small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-node__copy strong,
.canvas-node__root strong {
  font-size: 0.76rem;
  font-weight: 620;
  letter-spacing: -0.015em;
}
.canvas-node__copy small,
.canvas-node__root small {
  margin-top: 0.2rem;
  font:
    0.54rem ui-monospace,
    monospace;
  opacity: 0.46;
}
.canvas-node__open,
.canvas-node__pin {
  font-size: 0.85rem;
  opacity: 0.26;
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}
.canvas-node:hover .canvas-node__open,
.canvas-node:focus-within .canvas-node__open {
  opacity: 0.75;
  transform: translate(2px, -2px);
}
.canvas-node.is-selected .canvas-node__pin {
  color: var(--canvas-accent);
  opacity: 1;
  transform: rotate(-18deg);
}
.canvas-node--folder .canvas-node__main {
  border-style: dashed;
}
.canvas-node--folder.is-active .canvas-node__main,
.canvas-node--folder.is-selected .canvas-node__main {
  border-style: solid;
}
.canvas-node--root {
  width: 9.5rem;
}
.canvas-node__root {
  min-height: 4.75rem;
  border-color: var(--canvas-accent);
  background: var(--canvas-root);
}
.canvas-node__root-mark {
  border-radius: 50%;
  background: var(--canvas-accent);
  color: var(--canvas-accent-contrast);
  font-size: 1.15rem;
}
@media (prefers-reduced-motion: reduce) {
  .canvas-node__main,
  .canvas-node__root,
  .canvas-node__open,
  .canvas-node__pin {
    transition: none;
  }
}
</style>
