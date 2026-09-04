<script setup lang="ts">
import { buildBookmarkTree, filterBookmarkTree } from '~/utils/bookmarks'
import BookmarkCanvas from './BookmarkCanvas.vue'

const query = shallowRef('')
const { bookmarks, loading, error, loadBookmarks } = useBookmarks()

const tree = computed(() => buildBookmarkTree(bookmarks.value))
const filteredTree = computed(() => filterBookmarkTree(tree.value, query.value, ''))
onMounted(loadBookmarks)
</script>

<template>
  <div class="bookmarks-page">
    <div v-if="loading" class="bookmarks-loading" aria-label="正在加载书签">
      <div class="bookmarks-loading__mark" aria-hidden="true">
        <i class="i-hugeicons:book-open-02" />
        <span />
      </div>
      <p>Organizing bookmarks</p>
    </div>

    <Transition name="bookmarks-reveal" appear>
      <BookmarkCanvas v-if="!loading" v-model:query="query" :items="filteredTree" />
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
.bookmarks-loading {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  height: 100%;
  place-content: center;
  justify-items: center;
  background: color-mix(in srgb, #e9e9e5 52%, transparent);
  backdrop-filter: blur(1rem) saturate(0.85);
}
.dark .bookmarks-loading {
  background: color-mix(in srgb, #11110f 52%, transparent);
}
.bookmarks-loading__mark {
  position: relative;
  display: grid;
  width: 3.2rem;
  height: 3.2rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 1rem;
  place-items: center;
  background: color-mix(in srgb, currentColor 6%, transparent);
  box-shadow: inset 0 1px color-mix(in srgb, white 16%, transparent);
  font-size: 1.15rem;
  animation: loading-breathe 1.6s ease-in-out infinite;
}
.bookmarks-loading__mark span {
  position: absolute;
  right: 0.55rem;
  bottom: 0.55rem;
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 50%;
  background: #ef6259;
  box-shadow: 0 0 0.75rem #ef6259;
}
.bookmarks-loading p {
  margin: 0.8rem 0 0;
  font:
    0.58rem ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  opacity: 0.46;
  text-transform: uppercase;
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
@keyframes loading-breathe {
  50% {
    transform: translateY(-0.22rem);
    box-shadow:
      inset 0 1px color-mix(in srgb, white 18%, transparent),
      0 0.8rem 2.5rem color-mix(in srgb, currentColor 9%, transparent);
  }
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
  .bookmarks-loading__mark {
    animation: none;
  }
  .bookmarks-reveal-enter-active {
    transition: opacity 160ms ease;
  }
  .bookmarks-reveal-enter-from {
    clip-path: none;
    transform: none;
  }
}
</style>
