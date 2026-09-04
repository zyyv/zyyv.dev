<script setup lang="ts">
import { buildBookmarkTree, filterBookmarkTree } from '~/utils/bookmarks'
import BookmarkCanvas from './BookmarkCanvas.vue'
import BookmarkLoading from './BookmarkLoading.vue'

const query = shallowRef('')
const showLoading = shallowRef(true)
const { bookmarks, loading, error, loadBookmarks } = useBookmarks()

const tree = computed(() => buildBookmarkTree(bookmarks.value))
const filteredTree = computed(() => filterBookmarkTree(tree.value, query.value, ''))
onMounted(loadBookmarks)
</script>

<template>
  <div class="bookmarks-page">
    <BookmarkLoading v-if="showLoading" :ready="!loading" @complete="showLoading = false" />

    <Transition name="bookmarks-reveal" appear>
      <BookmarkCanvas v-if="!showLoading" v-model:query="query" :items="filteredTree" />
    </Transition>

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
.bookmarks-reveal-enter-active {
  transition:
    opacity 520ms ease,
    clip-path 720ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 720ms cubic-bezier(0.16, 1, 0.3, 1);
}
.bookmarks-reveal-enter-from {
  opacity: 0;
  clip-path: inset(48% 12% round 1.5rem);
  transform: scale(0.985);
}
@media (max-width: 600px) {
  .bookmarks-error {
    bottom: 5.4rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bookmarks-reveal-enter-active {
    transition: opacity 160ms ease;
  }
  .bookmarks-reveal-enter-from {
    clip-path: none;
    transform: none;
  }
}
</style>
