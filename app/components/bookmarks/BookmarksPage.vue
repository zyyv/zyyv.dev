<script setup lang="ts">
import { buildBookmarkTree, filterBookmarkTree } from '~/utils/bookmarks'
import BookmarkCanvas from './BookmarkCanvas.vue'

const query = shallowRef('')
const selectedTag = shallowRef('')
const { bookmarks, loading, error, loadBookmarks } = useBookmarks()

const tree = computed(() => buildBookmarkTree(bookmarks.value))
const filteredTree = computed(() => filterBookmarkTree(tree.value, query.value, selectedTag.value))
const tags = computed(() => [...new Set(bookmarks.value.flatMap((item) => item.tags))].sort())
const bookmarkCount = computed(
  () => bookmarks.value.filter((item) => item.kind === 'bookmark').length,
)
const folderCount = computed(() => bookmarks.value.filter((item) => item.kind === 'folder').length)
onMounted(loadBookmarks)
</script>

<template>
  <div class="bookmarks-page">
    <div v-if="loading" class="bookmarks-loading" aria-label="正在加载书签">
      <div class="bookmarks-loading__root" />
      <span v-for="index in 7" :key="index" :style="{ '--index': index }" />
    </div>

    <BookmarkCanvas
      v-else
      v-model:query="query"
      v-model:tag="selectedTag"
      :items="filteredTree"
      :tags="tags"
      :bookmark-count="bookmarkCount"
      :folder-count="folderCount"
    />

    <p v-if="error" class="bookmarks-error" role="alert">
      <i class="i-hugeicons:alert-02" aria-hidden="true" /> {{ error }}
    </p>
  </div>
</template>

<style scoped>
.bookmarks-page {
  height: 100dvh;
  min-height: 36rem;
  overflow: hidden;
}
.bookmarks-loading {
  position: relative;
  height: 100%;
  overflow: hidden;
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, currentColor 12%, transparent) 0.75px,
    transparent 0.9px
  );
  background-position: center;
  background-size: 22px 22px;
}
.bookmarks-loading span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9rem;
  height: 3.5rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  animation: bookmark-pulse 900ms calc(var(--index) * 70ms) ease-in-out infinite alternate;
  transform: rotate(calc(var(--index) * 51deg)) translateX(20rem)
    rotate(calc(var(--index) * -51deg));
}
.bookmarks-loading__root {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 10%, transparent);
  transform: translate(-50%, -50%);
}
.bookmarks-error {
  position: fixed;
  z-index: 80;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  max-width: min(25rem, calc(100% - 2rem));
  margin: 0;
  padding: 0.85rem 1rem;
  border: 1px solid color-mix(in srgb, #c8342d 35%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in srgb, #e9e9e5 90%, transparent);
  box-shadow: 0 1rem 3rem rgb(17 17 15 / 0.12);
  color: #a13d32;
  font-size: 0.7rem;
}
.dark .bookmarks-error {
  background: color-mix(in srgb, #181816 90%, transparent);
  color: #ef6259;
}
@keyframes bookmark-pulse {
  to {
    opacity: 0.42;
  }
}
@media (max-width: 600px) {
  .bookmarks-error {
    bottom: 5.4rem;
  }
  .bookmarks-loading span {
    transform: rotate(calc(var(--index) * 51deg)) translateX(10rem)
      rotate(calc(var(--index) * -51deg));
  }
}
@media (prefers-reduced-motion: reduce) {
  .bookmarks-loading span {
    animation: none;
  }
}
</style>
