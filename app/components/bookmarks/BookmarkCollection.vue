<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'
import BookmarkItem from './BookmarkItem.vue'

defineOptions({ name: 'BookmarkCollection' })

const props = withDefaults(
  defineProps<{
    items: BookmarkNode[]
    isAdmin: boolean
    depth?: number
  }>(),
  { depth: 0 },
)

const emit = defineEmits<{
  edit: [item: BookmarkNode]
  delete: [item: BookmarkNode]
  create: [parentId: string]
}>()

const folders = computed(() => props.items.filter((item) => item.kind === 'folder'))
const looseBookmarks = computed(() => props.items.filter((item) => item.kind === 'bookmark'))
</script>

<template>
  <div class="collection" :class="{ 'collection--nested': depth > 0 }">
    <section v-if="looseBookmarks.length" id="bookmark-loose" class="collection__group">
      <header v-if="depth === 0" class="collection__heading">
        <div>
          <span class="collection__path">./</span>
          <h2>root</h2>
          <span>[{{ looseBookmarks.length }}]</span>
        </div>
      </header>
      <div class="collection__grid">
        <BookmarkItem
          v-for="item in looseBookmarks"
          :key="item.id"
          :item="item"
          :is-admin="isAdmin"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </section>

    <section
      v-for="folder in folders"
      :id="`bookmark-folder-${folder.id}`"
      :key="folder.id"
      class="collection__group"
    >
      <header class="collection__heading">
        <div>
          <span class="collection__path">{{ depth ? '../' : './' }}</span>
          <h2>{{ folder.title }}</h2>
          <span>[{{ folder.children.length }}]</span>
          <span v-if="isAdmin && folder.private" class="collection__private" title="仅维护者可见">
            <i class="i-hugeicons:square-lock-02" aria-hidden="true" /> 私密
          </span>
        </div>
        <div v-if="isAdmin" class="collection__actions">
          <button type="button" @click="emit('create', folder.id)">
            <i class="i-hugeicons:link-add" aria-hidden="true" /> 添加
          </button>
          <button type="button" :aria-label="`编辑 ${folder.title}`" @click="emit('edit', folder)">
            <i class="i-hugeicons:edit-02" aria-hidden="true" />
          </button>
          <button
            type="button"
            :aria-label="`删除 ${folder.title}`"
            @click="emit('delete', folder)"
          >
            <i class="i-hugeicons:delete-02" aria-hidden="true" />
          </button>
        </div>
      </header>

      <BookmarkCollection
        v-if="folder.children.length"
        :items="folder.children"
        :is-admin="isAdmin"
        :depth="depth + 1"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @create="emit('create', $event)"
      />
      <div v-else class="collection__empty">
        <span>空文件夹</span>
        <button v-if="isAdmin" type="button" @click="emit('create', folder.id)">
          添加第一个书签
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.collection__group + .collection__group {
  margin-top: clamp(2.5rem, 5vw, 4.5rem);
}
.collection__group {
  scroll-margin-top: 5rem;
}
.collection--nested > .collection__group + .collection__group {
  margin-top: 2rem;
}
.collection__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
  min-height: 2rem;
  padding: 0;
  font-family: ui-monospace, monospace;
}
.collection__heading > div {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.55rem;
}
.collection__heading h2 {
  overflow: hidden;
  margin: 0;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.collection__path {
  color: #c8342d;
  opacity: 1 !important;
}
.collection__heading span {
  font:
    0.58rem ui-monospace,
    monospace;
  opacity: 0.4;
}
.collection__heading .collection__private {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  font-family: inherit;
  font-size: 0.53rem;
  opacity: 0.58;
}
.collection__actions {
  flex: 0 0 auto;
}
.collection__actions button {
  display: grid;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 0;
  place-items: center;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.62rem;
}
.collection__actions button:first-child {
  display: flex;
  gap: 0.35rem;
}
.collection__actions button:hover {
  background: color-mix(in srgb, currentColor 8%, transparent);
}
.collection__grid {
  display: grid;
  gap: 0.15rem;
  counter-reset: bookmark;
}
.collection--nested .collection__group {
  margin-left: clamp(0.75rem, 2vw, 1.5rem);
}
.collection--nested .collection__heading h2 {
  font-size: 0.68rem;
}
.collection__empty {
  display: flex;
  min-height: 5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0;
  font-size: 0.68rem;
  opacity: 0.58;
}
.collection__empty button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}
@media (max-width: 600px) {
  .collection__actions button:first-child {
    width: 2rem;
    overflow: hidden;
    padding: 0;
    font-size: 0;
  }
  .collection__actions button:first-child i {
    font-size: 1rem;
  }
  .collection--nested .collection__group {
    margin-left: 0.5rem;
  }
}
</style>
