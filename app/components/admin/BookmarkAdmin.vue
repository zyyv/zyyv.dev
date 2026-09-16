<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { play } from 'cuelume'
import type { Bookmark, BookmarkInput, BookmarkKind } from '~/types'
import BookmarkEditor from '../bookmarks/BookmarkEditor.vue'
import BookmarkLibrary from './BookmarkLibrary.vue'

const {
  bookmarks,
  loading,
  mutating,
  error,
  loadBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
} = useAdminBookmarks()

const search = shallowRef('')
const kind = shallowRef<'all' | BookmarkKind>('all')
const visibility = shallowRef<'all' | 'public' | 'private'>('all')
const parentId = shallowRef('all')
const page = shallowRef(1)
const pageSize = 24
const showEditor = shallowRef(false)
const editorBookmark = shallowRef<Bookmark | null>(null)
const editorInitialKind = shallowRef<BookmarkKind>('bookmark')
const editorInitialParentId = shallowRef<string | null>(null)
const deleteTarget = shallowRef<Bookmark | null>(null)

const folders = computed(() => bookmarks.value.filter((item) => item.kind === 'folder'))
const folderNames = computed(
  () => new Map(folders.value.map((folder) => [folder.id, folder.title] as const)),
)
const childCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const bookmark of bookmarks.value) {
    if (bookmark.parentId) counts.set(bookmark.parentId, (counts.get(bookmark.parentId) ?? 0) + 1)
  }
  return counts
})
const blockedFolderIds = computed(() => {
  const blocked = new Set<string>()
  const currentId = editorBookmark.value?.id
  if (!currentId || editorBookmark.value?.kind !== 'folder') return blocked

  const queue = [currentId]
  while (queue.length) {
    const parent = queue.shift()
    if (!parent) continue
    for (const bookmark of bookmarks.value) {
      if (bookmark.parentId !== parent || blocked.has(bookmark.id)) continue
      blocked.add(bookmark.id)
      if (bookmark.kind === 'folder') queue.push(bookmark.id)
    }
  }
  return blocked
})
const editorFolders = computed(() =>
  folders.value.filter(
    (folder) => folder.id !== editorBookmark.value?.id && !blockedFolderIds.value.has(folder.id),
  ),
)

const filteredBookmarks = computed(() => {
  const normalizedSearch = search.value.trim().toLocaleLowerCase()
  return bookmarks.value.filter((bookmark) => {
    if (kind.value !== 'all' && bookmark.kind !== kind.value) return false
    if (visibility.value === 'private' && !bookmark.private) return false
    if (visibility.value === 'public' && bookmark.private) return false
    if (parentId.value === 'root' && bookmark.parentId !== null) return false
    if (
      parentId.value !== 'all' &&
      parentId.value !== 'root' &&
      bookmark.parentId !== parentId.value
    ) {
      return false
    }
    if (!normalizedSearch) return true
    const haystack = [
      bookmark.title,
      bookmark.url,
      bookmark.description,
      bookmark.iconUrl,
      folderNames.value.get(bookmark.parentId ?? ''),
      ...bookmark.tags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
    return haystack.includes(normalizedSearch)
  })
})
const total = computed(() => filteredBookmarks.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const pagedBookmarks = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredBookmarks.value.slice(start, start + pageSize)
})

function resetFilters() {
  search.value = ''
  kind.value = 'all'
  visibility.value = 'all'
  parentId.value = 'all'
}

function openCreate(nextKind: BookmarkKind, nextParentId: string | null = null) {
  editorBookmark.value = null
  editorInitialKind.value = nextKind
  editorInitialParentId.value = nextParentId
  showEditor.value = true
}

function openEdit(bookmark: Bookmark) {
  editorBookmark.value = bookmark
  editorInitialKind.value = bookmark.kind
  editorInitialParentId.value = bookmark.parentId
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editorBookmark.value = null
}

async function handleSave(input: BookmarkInput) {
  try {
    if (editorBookmark.value) await updateBookmark(editorBookmark.value.id, input)
    else await createBookmark(input)
    play('success')
    closeEditor()
  } catch {
    play('error')
  }
}

function openDelete(bookmark: Bookmark) {
  deleteTarget.value = bookmark
}

function dismissDelete() {
  play('droplet')
  deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteBookmark(deleteTarget.value.id)
    play('success')
    deleteTarget.value = null
  } catch {
    play('error')
  }
}

watch([search, kind, visibility, parentId], () => {
  page.value = 1
})
watch(totalPages, (nextTotalPages) => {
  if (page.value > nextTotalPages) page.value = nextTotalPages
})

onMounted(() => loadBookmarks().catch(() => undefined))
</script>

<template>
  <div class="admin-workspace">
    <header class="workspace-header">
      <div class="workspace-brand">
        <span class="brand-mark">ZY / YV</span>
        <span class="brand-label">CONTENT OPERATIONS</span>
      </div>
      <nav class="workspace-nav" aria-label="后台模块">
        <NuxtLink to="/admin/photos" data-cuelume-hover="tick">图片库</NuxtLink>
        <NuxtLink to="/admin/bookmarks" class="is-active" data-cuelume-hover="tick">
          书签管理
        </NuxtLink>
      </nav>
      <div class="workspace-status">
        <span><i aria-hidden="true" /> D1 已连接</span>
        <NuxtLink to="/admin" data-cuelume-hover="tick">后台首页</NuxtLink>
      </div>
    </header>

    <div class="page-heading">
      <div>
        <span>BOOKMARK OPERATIONS</span>
        <h1>书签资源</h1>
        <p>在写入公开书签栏前，集中维护链接、目录、标签与访问范围。</p>
      </div>
      <div class="heading-actions">
        <button
          type="button"
          class="secondary-create-button"
          data-cuelume-toggle="pulse"
          @click="openCreate('folder')"
        >
          <i class="i-hugeicons:folder-add" aria-hidden="true" /> 新建文件夹
        </button>
        <button
          type="button"
          class="create-button"
          data-cuelume-toggle="pulse"
          @click="openCreate('bookmark')"
        >
          <i class="i-hugeicons:link-add" aria-hidden="true" /> 添加书签
        </button>
      </div>
    </div>

    <p v-if="error" class="workspace-error" role="alert">
      <i class="i-hugeicons:alert-02" aria-hidden="true" /> {{ error }}
    </p>

    <BookmarkLibrary
      v-model:search="search"
      v-model:kind="kind"
      v-model:visibility="visibility"
      v-model:parent-id="parentId"
      :bookmarks="pagedBookmarks"
      :folders="folders"
      :child-counts="childCounts"
      :folder-names="folderNames"
      :loading="loading"
      :total="total"
      :page="page"
      :total-pages="totalPages"
      @edit="openEdit"
      @delete="openDelete"
      @page="page = $event"
      @reset="resetFilters"
    />
  </div>

  <BookmarkEditor
    v-if="showEditor"
    :bookmark="editorBookmark"
    :initial-kind="editorInitialKind"
    :initial-parent-id="editorInitialParentId"
    :folders="editorFolders"
    :busy="mutating"
    :error="error"
    @close="closeEditor"
    @save="handleSave"
  />

  <div
    v-if="deleteTarget"
    class="confirm-backdrop"
    role="presentation"
    tabindex="-1"
    @click.self="dismissDelete"
    @keydown.esc="dismissDelete"
  >
    <section
      class="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bookmark-delete-title"
    >
      <span>不可撤销</span>
      <h2 id="bookmark-delete-title">删除 {{ deleteTarget.title }}？</h2>
      <p>
        {{
          deleteTarget.kind === 'folder'
            ? `这会同时删除文件夹及其 ${childCounts.get(deleteTarget.id) ?? 0} 个子项目。`
            : '这会从公开书签栏和维护列表中移除该链接。'
        }}
      </p>
      <div>
        <button type="button" data-cuelume-toggle="droplet" @click="dismissDelete">取消</button>
        <button
          type="button"
          :disabled="mutating"
          data-cuelume-toggle="pulse"
          @click="confirmDelete"
        >
          {{ mutating ? '删除中' : '确认删除' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-workspace {
  width: min(calc(100% - 3rem), 88rem);
  margin: 0 auto;
  padding: 5.7rem 0 5rem;
}
.workspace-header {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  min-height: 3.6rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
.workspace-brand {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 0.65rem;
}
.brand-mark {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: -0.06em;
}
.brand-label {
  font-size: 0.52rem;
  letter-spacing: 0.1em;
  opacity: 0.42;
}
.workspace-nav {
  display: flex;
  align-items: stretch;
  gap: 1.1rem;
  height: 3.6rem;
}
.workspace-nav a {
  position: relative;
  display: flex;
  align-items: center;
  color: inherit;
  font-size: 0.62rem;
  opacity: 0.46;
  text-decoration: none;
}
.workspace-nav a.is-active {
  opacity: 1;
}
.workspace-nav a.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: currentColor;
  content: '';
}
.workspace-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  padding-bottom: 0.35rem;
}
.workspace-status span {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.58rem;
  opacity: 0.48;
}
.workspace-status span i {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: #568c68;
}
.workspace-status a {
  color: inherit;
  font-size: 0.62rem;
  text-decoration: none;
}
.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  padding: 3rem 0 2.1rem;
}
.page-heading > div > span {
  display: block;
  margin-bottom: 0.7rem;
  font-size: 0.57rem;
  letter-spacing: 0.12em;
  opacity: 0.42;
}
.page-heading h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.8rem);
  font-weight: 550;
  letter-spacing: -0.07em;
}
.page-heading p {
  margin: 0.7rem 0 0;
  font-size: 0.66rem;
  line-height: 1.55;
  opacity: 0.45;
}
.heading-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.heading-actions button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.55rem;
  padding: 0 0.9rem;
  border-radius: 0.48rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.63rem;
}
.secondary-create-button {
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  background: transparent;
  color: inherit;
}
.create-button {
  border: 0;
  background: #11110f;
  color: #f2f2ee;
}
.dark .create-button {
  background: #e9e9e5;
  color: #11110f;
}
.heading-actions button:active {
  transform: translateY(1px);
}
.workspace-error {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 1rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid color-mix(in srgb, #c8342d 32%, transparent);
  border-radius: 0.45rem;
  color: #a13d32;
  font-size: 0.62rem;
}
.dark .workspace-error {
  color: #ef6259;
}
.confirm-backdrop {
  position: fixed;
  z-index: 90;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(17 17 15 / 54%);
  backdrop-filter: blur(8px);
}
.confirm-dialog {
  width: min(100%, 28rem);
  padding: 1.35rem;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 0.75rem;
  background: #e9e9e5;
  color: #11110f;
  box-shadow: 0 2rem 6rem rgb(17 17 15 / 28%);
}
.dark .confirm-dialog {
  background: #181816;
  color: #e9e9e5;
}
.confirm-dialog > span {
  font-size: 0.56rem;
  letter-spacing: 0.1em;
  opacity: 0.42;
}
.confirm-dialog h2 {
  margin: 0.45rem 0 0;
  font-size: 1.15rem;
  font-weight: 550;
  letter-spacing: -0.04em;
}
.confirm-dialog p {
  margin: 0.7rem 0 1.25rem;
  font-size: 0.66rem;
  line-height: 1.6;
  opacity: 0.58;
}
.confirm-dialog > div {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.confirm-dialog button {
  min-height: 2.35rem;
  padding: 0 0.85rem;
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  border-radius: 0.45rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.62rem;
}
.confirm-dialog button:last-child {
  border-color: transparent;
  background: #11110f;
  color: #f2f2ee;
}
.dark .confirm-dialog button:last-child {
  background: #e9e9e5;
  color: #11110f;
}
.confirm-dialog button:disabled {
  cursor: wait;
  opacity: 0.45;
}
@media (max-width: 767.9px) {
  .admin-workspace {
    width: min(calc(100% - 2rem), 40rem);
    padding: 4.9rem 0 4rem;
  }
  .workspace-header {
    align-items: stretch;
    flex-direction: column;
    gap: 0;
  }
  .workspace-brand {
    min-height: 3.2rem;
    align-items: center;
  }
  .workspace-nav {
    height: 2.7rem;
    gap: 1.3rem;
  }
  .workspace-nav a {
    align-items: flex-start;
    padding-top: 0.25rem;
  }
  .workspace-status {
    display: none;
  }
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .heading-actions {
    width: 100%;
  }
  .heading-actions button {
    flex: 1;
    justify-content: center;
  }
}
@media (max-width: 480px) {
  .heading-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
