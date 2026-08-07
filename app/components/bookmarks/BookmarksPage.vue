<script setup lang="ts">
import type { Bookmark, BookmarkInput, BookmarkKind } from '~/types'
import type { BookmarkNode } from '~/utils/bookmarks'
import { buildBookmarkTree, filterBookmarkTree } from '~/utils/bookmarks'
import BookmarkBar from './BookmarkBar.vue'
import BookmarkCollection from './BookmarkCollection.vue'
import BookmarkEditor from './BookmarkEditor.vue'
import BookmarkToolbar from './BookmarkToolbar.vue'

const query = shallowRef('')
const selectedTag = shallowRef('')
const editorOpen = shallowRef(false)
const editingBookmark = shallowRef<Bookmark | null>(null)
const initialKind = shallowRef<BookmarkKind>('bookmark')
const initialParentId = shallowRef<string | null>(null)
const deleteTarget = shallowRef<BookmarkNode | null>(null)

const {
  bookmarks,
  loading,
  mutating,
  isAdmin,
  error,
  loadBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
} = useBookmarks()

const tree = computed(() => buildBookmarkTree(bookmarks.value))
const filteredTree = computed(() => filterBookmarkTree(tree.value, query.value, selectedTag.value))
const tags = computed(() => [...new Set(bookmarks.value.flatMap((item) => item.tags))].sort())
const bookmarkCount = computed(
  () => bookmarks.value.filter((item) => item.kind === 'bookmark').length,
)
const folderCount = computed(() => bookmarks.value.filter((item) => item.kind === 'folder').length)
const emptyTitle = computed(() => {
  if (bookmarks.value.length) return '没有匹配的书签'
  return isAdmin.value ? '书签栏还是空的' : '暂时没有公开书签'
})
const emptyDescription = computed(() => {
  if (bookmarks.value.length) return '换个关键词或清除标签筛选。'
  return isAdmin.value
    ? '从这里添加第一个书签，或先创建一个文件夹。'
    : '这里还没有可供访客浏览的内容。'
})

const editorFolders = computed(() => {
  const excluded = new Set<string>()
  const selected = editingBookmark.value
  if (selected?.kind === 'folder') {
    excluded.add(selected.id)
    const visit = (id: string) => {
      for (const item of bookmarks.value) {
        if (item.parentId !== id) continue
        excluded.add(item.id)
        if (item.kind === 'folder') visit(item.id)
      }
    }
    visit(selected.id)
  }
  return bookmarks.value.filter((item) => item.kind === 'folder' && !excluded.has(item.id))
})

const deleteDescendantCount = computed(() => {
  if (!deleteTarget.value || deleteTarget.value.kind !== 'folder') return 0
  let total = 0
  const count = (nodes: BookmarkNode[]) => {
    for (const node of nodes) {
      total += 1
      count(node.children)
    }
  }
  count(deleteTarget.value.children)
  return total
})

function openCreate(kind: BookmarkKind, parentId: string | null = null) {
  editingBookmark.value = null
  initialKind.value = kind
  initialParentId.value = parentId
  editorOpen.value = true
}

function openEdit(item: Bookmark) {
  editingBookmark.value = item
  initialKind.value = item.kind
  initialParentId.value = item.parentId
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
  editingBookmark.value = null
}

async function saveBookmark(input: BookmarkInput) {
  try {
    if (editingBookmark.value) await updateBookmark(editingBookmark.value.id, input)
    else await createBookmark(input)
    closeEditor()
  } catch {
    // The persistent error banner keeps the API message visible while the editor stays open.
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteBookmark(deleteTarget.value.id)
    deleteTarget.value = null
  } catch {
    // Keep the confirmation open so the user can retry.
  }
}

onMounted(loadBookmarks)
</script>

<template>
  <div class="bookmarks-page interior-shell">
    <PageHeader
      title="Bookmarks"
      eyebrow="Library / useful links"
      description="A small, organized corner for tools, references, and pages worth returning to."
    />

    <div v-if="loading" class="bookmarks-loading" aria-label="正在加载书签">
      <span v-for="index in 6" :key="index" />
    </div>

    <template v-else>
      <p v-if="error" class="bookmarks-error" role="alert">
        <i class="i-hugeicons:alert-02" aria-hidden="true" /> {{ error }}
      </p>

      <div v-if="isAdmin" class="admin-notice">
        <span><i class="i-hugeicons:square-lock-02" aria-hidden="true" /> 私密模式</span>
        <p>私密会话已启用，可以直接维护这页的公开与私密书签。</p>
      </div>

      <BookmarkToolbar
        v-model:query="query"
        v-model:tag="selectedTag"
        :tags="tags"
        :total="bookmarkCount"
        :folder-count="folderCount"
        :is-admin="isAdmin"
        @create="openCreate($event)"
      />

      <BookmarkBar
        :items="filteredTree"
        :is-admin="isAdmin"
        @edit="openEdit"
        @delete="deleteTarget = $event"
      />

      <BookmarkCollection
        v-if="filteredTree.length"
        :items="filteredTree"
        :is-admin="isAdmin"
        @edit="openEdit"
        @delete="deleteTarget = $event"
        @create="openCreate('bookmark', $event)"
      />

      <section v-else class="bookmarks-empty">
        <i class="i-hugeicons:bookmark-02" aria-hidden="true" />
        <h2>{{ emptyTitle }}</h2>
        <p>{{ emptyDescription }}</p>
        <button v-if="isAdmin && !bookmarks.length" type="button" @click="openCreate('bookmark')">
          添加书签
        </button>
      </section>
    </template>
  </div>

  <BookmarkEditor
    v-if="editorOpen"
    :bookmark="editingBookmark"
    :initial-kind="initialKind"
    :initial-parent-id="initialParentId"
    :folders="editorFolders"
    :busy="mutating"
    @close="closeEditor"
    @save="saveBookmark"
  />

  <div
    v-if="deleteTarget"
    class="delete-backdrop"
    role="presentation"
    @click.self="deleteTarget = null"
  >
    <section
      class="delete-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bookmark-delete-title"
    >
      <span>不可撤销</span>
      <h2 id="bookmark-delete-title">删除「{{ deleteTarget.title }}」？</h2>
      <p v-if="deleteDescendantCount">
        这个文件夹内的 {{ deleteDescendantCount }} 个项目也会被删除。
      </p>
      <p v-else>这条书签会从数据库中永久删除。</p>
      <div>
        <button type="button" @click="deleteTarget = null">取消</button>
        <button type="button" :disabled="mutating" @click="confirmDelete">
          {{ mutating ? '删除中' : '确认删除' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.bookmarks-page {
  padding-bottom: clamp(6rem, 12vw, 9rem);
}
.bookmarks-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: 0.75rem;
}
.bookmarks-loading span {
  height: 6rem;
  border-radius: 0.8rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  animation: bookmark-pulse 1.2s ease-in-out infinite alternate;
}
.bookmarks-loading span:nth-child(even) {
  animation-delay: 160ms;
}
.bookmarks-error {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid color-mix(in srgb, #a13d32 30%, transparent);
  border-radius: 0.7rem;
  color: #a13d32;
  font-size: 0.7rem;
}
.admin-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 0.7rem;
  background: color-mix(in srgb, currentColor 4%, transparent);
}
.admin-notice span {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  font-weight: 550;
}
.admin-notice p {
  margin: 0;
  font-size: 0.62rem;
  opacity: 0.46;
}
.bookmarks-empty {
  display: grid;
  min-height: 18rem;
  place-items: center;
  align-content: center;
  padding: 2rem;
  border: 1px dashed color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 0.85rem;
  text-align: center;
}
.bookmarks-empty > i {
  margin-bottom: 1rem;
  font-size: 1.7rem;
  opacity: 0.28;
}
.bookmarks-empty h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 550;
}
.bookmarks-empty p {
  margin: 0.5rem 0 0;
  font-size: 0.7rem;
  opacity: 0.46;
}
.bookmarks-empty button {
  margin-top: 1.2rem;
  padding: 0.65rem 0.9rem;
  border: 0;
  border-radius: 0.6rem;
  background: #11110f;
  color: #e9e9e5;
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
}
.dark .bookmarks-empty button {
  background: #e9e9e5;
  color: #11110f;
}
.delete-backdrop {
  position: fixed;
  z-index: 75;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(17 17 15 / 48%);
  backdrop-filter: blur(7px);
}
.delete-dialog {
  width: min(100%, 27rem);
  padding: 1.5rem;
  border-radius: 0.85rem;
  background: #e9e9e5;
  color: #11110f;
  box-shadow: 0 1.5rem 5rem rgb(17 17 15 / 24%);
}
.dark .delete-dialog {
  background: #181816;
  color: #e9e9e5;
}
.delete-dialog > span {
  color: #a13d32;
  font-size: 0.58rem;
  letter-spacing: 0.08em;
}
.delete-dialog h2 {
  margin: 0.65rem 0;
  font-size: 1.25rem;
  font-weight: 550;
  letter-spacing: -0.035em;
}
.delete-dialog p {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.6;
  opacity: 0.5;
}
.delete-dialog div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 1.4rem;
}
.delete-dialog button {
  min-height: 2.65rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.6rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.7rem;
}
.delete-dialog button:last-child {
  border-color: #a13d32;
  background: #a13d32;
  color: #fff;
}
.delete-dialog button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
@keyframes bookmark-pulse {
  to {
    opacity: 0.42;
  }
}
@media (max-width: 600px) {
  .admin-notice {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bookmarks-loading span {
    animation: none;
  }
}
</style>
