<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'
import BookmarkItem from './BookmarkItem.vue'

const props = defineProps<{ items: BookmarkNode[]; isAdmin: boolean }>()
const emit = defineEmits<{
  edit: [item: BookmarkNode]
  delete: [item: BookmarkNode]
}>()

const openFolderId = shallowRef<string | null>(null)
const bar = useTemplateRef<HTMLElement>('bar')

onClickOutside(bar, () => {
  openFolderId.value = null
})

function toggleFolder(id: string) {
  openFolderId.value = openFolderId.value === id ? null : id
}

function folderBookmarks(item: BookmarkNode) {
  const results: Array<{ item: BookmarkNode; depth: number }> = []
  const visit = (nodes: BookmarkNode[], depth: number) => {
    for (const node of nodes) {
      results.push({ item: node, depth })
      if (node.kind === 'folder') visit(node.children, depth + 1)
    }
  }
  visit(item.children, 0)
  return results
}
</script>

<template>
  <section ref="bar" class="bookmark-bar" aria-label="书签栏">
    <div class="bookmark-bar__chrome" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <div class="bookmark-bar__track">
      <template v-for="item in props.items" :key="item.id">
        <a
          v-if="item.kind === 'bookmark'"
          class="bookmark-bar__item"
          :href="item.url || undefined"
          target="_blank"
          rel="noreferrer"
        >
          <img v-if="item.iconUrl" :src="item.iconUrl" alt="" />
          <i v-else class="i-hugeicons:link-02" aria-hidden="true" />
          <span>{{ item.title }}</span>
          <i
            v-if="isAdmin && item.private"
            class="i-hugeicons:square-lock-02 bookmark-bar__private"
            aria-label="私密"
          />
        </a>

        <div v-else class="bookmark-bar__folder">
          <button
            type="button"
            class="bookmark-bar__item"
            :aria-expanded="openFolderId === item.id"
            @click="toggleFolder(item.id)"
          >
            <i class="i-hugeicons:folder-02" aria-hidden="true" />
            <span>{{ item.title }}</span>
            <i
              v-if="isAdmin && item.private"
              class="i-hugeicons:square-lock-02 bookmark-bar__private"
              aria-label="私密"
            />
            <i class="i-hugeicons:arrow-down-01 bookmark-bar__chevron" aria-hidden="true" />
          </button>

          <Transition name="folder-menu">
            <div v-if="openFolderId === item.id" class="bookmark-bar__menu">
              <header>
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.children.length }} 个项目</span>
                </div>
                <div v-if="isAdmin">
                  <button
                    type="button"
                    :aria-label="`编辑 ${item.title}`"
                    @click="emit('edit', item)"
                  >
                    <i class="i-hugeicons:edit-02" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    :aria-label="`删除 ${item.title}`"
                    @click="emit('delete', item)"
                  >
                    <i class="i-hugeicons:delete-02" aria-hidden="true" />
                  </button>
                </div>
              </header>
              <div v-if="item.children.length" class="bookmark-bar__menu-list">
                <template v-for="entry in folderBookmarks(item)" :key="entry.item.id">
                  <BookmarkItem
                    v-if="entry.item.kind === 'bookmark'"
                    :item="entry.item"
                    :is-admin="isAdmin"
                    compact
                    :style="{ marginLeft: `${entry.depth * 0.75}rem` }"
                    @edit="emit('edit', $event)"
                    @delete="emit('delete', $event)"
                  />
                  <div
                    v-else
                    class="bookmark-bar__nested-folder"
                    :style="{ marginLeft: `${entry.depth * 0.75}rem` }"
                  >
                    <i class="i-hugeicons:folder-02" aria-hidden="true" />
                    <span>{{ entry.item.title }}</span>
                    <i
                      v-if="isAdmin && entry.item.private"
                      class="i-hugeicons:square-lock-02 bookmark-bar__private"
                      aria-label="私密"
                    />
                  </div>
                </template>
              </div>
              <p v-else>这个文件夹还是空的。</p>
            </div>
          </Transition>
        </div>
      </template>
      <span v-if="!items.length" class="bookmark-bar__empty">暂无匹配书签</span>
    </div>
  </section>
</template>

<style scoped>
.bookmark-bar {
  position: relative;
  z-index: 2;
  margin-bottom: clamp(3.5rem, 7vw, 5.5rem);
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.85rem;
  background: color-mix(in srgb, currentColor 4%, transparent);
  box-shadow: 0 1rem 3rem color-mix(in srgb, currentColor 5%, transparent);
}
.bookmark-bar__chrome {
  display: flex;
  gap: 0.35rem;
  padding: 0.65rem 0.8rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
.bookmark-bar__chrome span {
  width: 0.42rem;
  height: 0.42rem;
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  border-radius: 50%;
}
.bookmark-bar__track {
  display: flex;
  min-height: 3.15rem;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  padding: 0.45rem;
  scrollbar-width: none;
}
.bookmark-bar__track::-webkit-scrollbar {
  display: none;
}
.bookmark-bar__folder {
  position: relative;
  flex: 0 0 auto;
}
.bookmark-bar__item {
  display: flex;
  min-height: 2.2rem;
  max-width: 12rem;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.65rem;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
  text-decoration: none;
  white-space: nowrap;
}
.bookmark-bar__item:hover,
.bookmark-bar__item[aria-expanded='true'] {
  background: color-mix(in srgb, currentColor 9%, transparent);
}
.bookmark-bar__item img {
  width: 0.95rem;
  height: 0.95rem;
  object-fit: contain;
}
.bookmark-bar__item > i {
  flex: 0 0 auto;
  opacity: 0.52;
}
.bookmark-bar__item span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.bookmark-bar__chevron {
  font-size: 0.65rem;
}
.bookmark-bar__private {
  font-size: 0.7rem;
  opacity: 0.5;
}
.bookmark-bar__empty {
  padding: 0 0.6rem;
  font-size: 0.68rem;
  opacity: 0.42;
}
.bookmark-bar__menu {
  position: absolute;
  z-index: 10;
  top: calc(100% + 0.65rem);
  left: 0;
  width: min(22rem, calc(100vw - 2rem));
  max-height: min(30rem, 70vh);
  overflow-y: auto;
  padding: 0.55rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.8rem;
  background: #e9e9e5;
  color: #11110f;
  box-shadow: 0 1.2rem 3.5rem rgb(17 17 15 / 18%);
}
.dark .bookmark-bar__menu {
  background: #181816;
  color: #e9e9e5;
}
.bookmark-bar__menu header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0.55rem 0.8rem;
}
.bookmark-bar__menu header strong,
.bookmark-bar__menu header span {
  display: block;
}
.bookmark-bar__menu header strong {
  font-size: 0.75rem;
  font-weight: 550;
}
.bookmark-bar__menu header span {
  margin-top: 0.2rem;
  font-size: 0.58rem;
  opacity: 0.42;
}
.bookmark-bar__menu header > div:last-child {
  display: flex;
  gap: 0.2rem;
}
.bookmark-bar__menu header button {
  display: grid;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  place-items: center;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.bookmark-bar__menu header button:hover {
  background: color-mix(in srgb, currentColor 8%, transparent);
}
.bookmark-bar__nested-folder {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem;
  font-size: 0.64rem;
  font-weight: 550;
  opacity: 0.55;
}
.bookmark-bar__menu > p {
  margin: 0;
  padding: 1.8rem 0.6rem;
  font-size: 0.68rem;
  text-align: center;
  opacity: 0.42;
}
.folder-menu-enter-active,
.folder-menu-leave-active {
  transition:
    opacity 160ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.folder-menu-enter-from,
.folder-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem) scale(0.985);
}
@media (max-width: 600px) {
  .bookmark-bar__menu {
    position: fixed;
    top: auto;
    right: 1rem;
    bottom: 5rem;
    left: 1rem;
    width: auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .folder-menu-enter-active,
  .folder-menu-leave-active {
    transition: none;
  }
}
</style>
