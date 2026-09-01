<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'

const props = defineProps<{
  items: BookmarkNode[]
}>()

function countBookmarks(nodes: BookmarkNode[]): number {
  return nodes.reduce(
    (total, item) => total + (item.kind === 'bookmark' ? 1 : countBookmarks(item.children)),
    0,
  )
}

const looseCount = computed(() => props.items.filter((item) => item.kind === 'bookmark').length)
const folders = computed(() =>
  props.items
    .filter((item) => item.kind === 'folder')
    .map((item, index) => ({
      id: item.id,
      index: String(index + 1).padStart(2, '0'),
      title: item.title,
      count: countBookmarks(item.children),
    })),
)
</script>

<template>
  <aside class="bookmark-sidebar">
    <p>Directories</p>
    <nav aria-label="书签目录">
      <a v-if="looseCount" href="#bookmark-loose">
        <span>00</span><strong>root</strong><small>{{ looseCount }}</small>
      </a>
      <a v-for="folder in folders" :key="folder.id" :href="`#bookmark-folder-${folder.id}`">
        <span>{{ folder.index }}</span
        ><strong>{{ folder.title }}</strong
        ><small>{{ folder.count }}</small>
      </a>
    </nav>
  </aside>
</template>

<style scoped>
.bookmark-sidebar {
  position: sticky;
  top: 5rem;
  max-height: calc(100dvh - 6rem);
  overflow-y: auto;
  font-family: ui-monospace, monospace;
}
.bookmark-sidebar > p {
  margin: 0 0 0.8rem;
  font-size: 0.52rem;
  letter-spacing: 0.08em;
  opacity: 0.36;
  text-transform: uppercase;
}
.bookmark-sidebar nav {
  display: grid;
  gap: 0.2rem;
}
.bookmark-sidebar nav a {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr) auto;
  min-height: 2rem;
  align-items: center;
  padding: 0;
  color: inherit;
  font-size: 0.6rem;
  text-decoration: none;
  transition: background-color 140ms ease;
}
.bookmark-sidebar nav a:hover,
.bookmark-sidebar nav a:focus-visible {
  outline: 0;
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.bookmark-sidebar nav a span,
.bookmark-sidebar nav a small {
  opacity: 0.34;
}
.bookmark-sidebar nav a strong {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 600px) {
  .bookmark-sidebar {
    position: static;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .bookmark-sidebar > p {
    margin-bottom: 0.65rem;
  }
  .bookmark-sidebar nav {
    display: flex;
    padding: 0;
  }
  .bookmark-sidebar nav a {
    grid-template-columns: auto auto auto;
    min-height: 2.8rem;
    flex: 0 0 auto;
    gap: 0.45rem;
    padding-right: 1.25rem;
  }
}
</style>
