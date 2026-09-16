<script setup lang="ts">
import type { Bookmark, BookmarkKind } from '~/types'
import { bookmarkHost } from '~/utils/bookmarks'

const props = defineProps<{
  bookmarks: readonly Bookmark[]
  folders: readonly Bookmark[]
  childCounts: ReadonlyMap<string, number>
  folderNames: ReadonlyMap<string, string>
  loading: boolean
  total: number
  page: number
  totalPages: number
}>()

const search = defineModel<string>('search', { required: true })
const kind = defineModel<'all' | BookmarkKind>('kind', { required: true })
const visibility = defineModel<'all' | 'public' | 'private'>('visibility', { required: true })
const parentId = defineModel<string>('parentId', { required: true })
const emit = defineEmits<{
  edit: [bookmark: Bookmark]
  delete: [bookmark: Bookmark]
  page: [page: number]
  reset: []
}>()

function bookmarkDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function kindLabel(value: BookmarkKind) {
  return value === 'folder' ? '文件夹' : '书签'
}

function parentLabel(bookmark: Bookmark) {
  return bookmark.parentId ? (props.folderNames.get(bookmark.parentId) ?? '未知文件夹') : '根目录'
}
</script>

<template>
  <section class="bookmark-library" aria-labelledby="bookmark-library-title">
    <div class="library-toolbar">
      <div class="library-heading">
        <span class="library-kicker">BOOKMARK OPERATIONS / 02</span>
        <div>
          <h2 id="bookmark-library-title">书签资源</h2>
          <span>{{ total }} 项记录</span>
        </div>
      </div>

      <div class="library-filters" aria-label="书签查询条件">
        <label class="search-control">
          <i class="i-hugeicons:search-01" aria-hidden="true" />
          <span class="sr-only">搜索书签</span>
          <input v-model="search" type="search" placeholder="搜索名称、网址或标签" />
        </label>
        <label class="filter-control">
          <span>类型</span>
          <select v-model="kind" aria-label="筛选类型" data-cuelume-toggle="toggle">
            <option value="all">全部</option>
            <option value="bookmark">书签</option>
            <option value="folder">文件夹</option>
          </select>
        </label>
        <label class="filter-control">
          <span>可见性</span>
          <select v-model="visibility" aria-label="筛选可见性" data-cuelume-toggle="toggle">
            <option value="all">全部</option>
            <option value="public">公开</option>
            <option value="private">私密</option>
          </select>
        </label>
        <label class="filter-control">
          <span>目录</span>
          <select v-model="parentId" aria-label="筛选目录" data-cuelume-toggle="toggle">
            <option value="all">全部</option>
            <option value="root">根目录</option>
            <option v-for="folder in props.folders" :key="folder.id" :value="folder.id">
              {{ folder.title }}
            </option>
          </select>
        </label>
        <button
          v-if="search || kind !== 'all' || visibility !== 'all' || parentId !== 'all'"
          type="button"
          class="reset-filter"
          data-cuelume-toggle="droplet"
          @click="emit('reset')"
        >
          清空
        </button>
      </div>
    </div>

    <div class="table-shell">
      <table class="bookmark-table">
        <thead>
          <tr>
            <th scope="col">类型</th>
            <th scope="col">名称 / 地址</th>
            <th scope="col">目录</th>
            <th scope="col">标签</th>
            <th scope="col">可见性</th>
            <th scope="col">排序</th>
            <th scope="col">更新时间</th>
            <th scope="col"><span class="sr-only">操作</span></th>
          </tr>
        </thead>
        <tbody v-if="loading" aria-label="正在加载书签资源">
          <tr v-for="index in 8" :key="index" class="skeleton-row">
            <td><span class="skeleton-block skeleton-block--short" /></td>
            <td><span class="skeleton-block skeleton-block--wide" /></td>
            <td><span class="skeleton-block skeleton-block--medium" /></td>
            <td><span class="skeleton-block skeleton-block--medium" /></td>
            <td><span class="skeleton-block skeleton-block--short" /></td>
            <td><span class="skeleton-block skeleton-block--short" /></td>
            <td><span class="skeleton-block skeleton-block--date" /></td>
            <td><span class="skeleton-block skeleton-block--action" /></td>
          </tr>
        </tbody>
        <tbody v-else-if="!props.bookmarks.length">
          <tr>
            <td colspan="8" class="empty-state">
              <i class="i-hugeicons:book-open-02" aria-hidden="true" />
              <strong>没有匹配的书签</strong>
              <span>调整查询条件，或点击右上角新增资源。</span>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="bookmark in props.bookmarks" :key="bookmark.id">
            <td>
              <span class="kind-cell">
                <i
                  :class="
                    bookmark.kind === 'folder' ? 'i-hugeicons:folder-02' : 'i-hugeicons:link-02'
                  "
                  aria-hidden="true"
                />
                {{ kindLabel(bookmark.kind) }}
              </span>
            </td>
            <td>
              <div class="bookmark-name-cell">
                <button
                  type="button"
                  class="asset-name-button"
                  :aria-label="`编辑 ${bookmark.title}`"
                  data-cuelume-toggle="pulse"
                  @click="emit('edit', bookmark)"
                >
                  <strong>{{ bookmark.title }}</strong>
                  <span v-if="bookmark.kind === 'folder'">
                    {{ props.childCounts.get(bookmark.id) ?? 0 }} 个项目
                  </span>
                  <span v-else>{{ bookmarkHost(bookmark.url) || '未设置网址' }}</span>
                </button>
                <a
                  v-if="bookmark.kind === 'bookmark' && bookmark.url"
                  class="bookmark-url"
                  :href="bookmark.url"
                  target="_blank"
                  rel="noreferrer"
                  :aria-label="`在新标签页打开 ${bookmark.title}`"
                  data-cuelume-hover="tick"
                  data-cuelume-toggle="scan"
                >
                  <i class="i-hugeicons:arrow-up-right-01" aria-hidden="true" />
                </a>
              </div>
            </td>
            <td class="muted-cell">{{ parentLabel(bookmark) }}</td>
            <td>
              <div v-if="bookmark.tags.length" class="tag-list" aria-label="标签">
                <span v-for="tag in bookmark.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
                <small v-if="bookmark.tags.length > 3">+{{ bookmark.tags.length - 3 }}</small>
              </div>
              <span v-else class="muted-cell">—</span>
            </td>
            <td>
              <span class="visibility-tag" :class="{ 'visibility-tag--private': bookmark.private }">
                <i aria-hidden="true" /> {{ bookmark.private ? '私密' : '公开' }}
              </span>
            </td>
            <td class="numeric-cell">{{ bookmark.sortOrder }}</td>
            <td class="date-cell">{{ bookmarkDate(bookmark.modifiedAt) }}</td>
            <td>
              <div class="row-actions">
                <button
                  type="button"
                  :aria-label="`编辑 ${bookmark.title}`"
                  data-cuelume-toggle="pulse"
                  @click="emit('edit', bookmark)"
                >
                  <i class="i-hugeicons:edit-02" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  :aria-label="`删除 ${bookmark.title}`"
                  data-cuelume-toggle="droplet"
                  @click="emit('delete', bookmark)"
                >
                  <i class="i-hugeicons:delete-02" aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="totalPages > 1" class="pagination" aria-label="书签资源分页">
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <div>
        <button
          type="button"
          :disabled="page <= 1"
          data-cuelume-toggle="page"
          @click="emit('page', page - 1)"
        >
          <i class="i-hugeicons:arrow-left-01" aria-hidden="true" /> 上一页
        </button>
        <button
          type="button"
          :disabled="page >= totalPages"
          data-cuelume-toggle="page"
          @click="emit('page', page + 1)"
        >
          下一页 <i class="i-hugeicons:arrow-right-01" aria-hidden="true" />
        </button>
      </div>
    </nav>
  </section>
</template>

<style scoped>
.bookmark-library {
  padding-top: 2.25rem;
}
.library-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1rem;
}
.library-heading {
  display: grid;
  gap: 0.6rem;
}
.library-kicker {
  font-size: 0.56rem;
  letter-spacing: 0.12em;
  opacity: 0.44;
}
.library-heading > div {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
}
.library-heading h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 550;
  letter-spacing: -0.03em;
}
.library-heading > div > span {
  font-size: 0.61rem;
  opacity: 0.42;
}
.library-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.search-control,
.filter-control {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.15rem;
  padding: 0 0.65rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.45rem;
  box-sizing: border-box;
}
.search-control {
  width: min(15rem, 24vw);
}
.search-control i {
  flex: none;
  font-size: 0.82rem;
  opacity: 0.46;
}
.search-control input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.63rem;
}
.search-control input::placeholder {
  color: currentColor;
  opacity: 0.4;
}
.filter-control {
  gap: 0.35rem;
}
.filter-control > span {
  font-size: 0.56rem;
  opacity: 0.4;
}
.filter-control select {
  min-width: 3.4rem;
  max-width: 8rem;
  padding: 0 0.7rem 0 0;
  overflow: hidden;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.62rem;
  text-overflow: ellipsis;
}
.reset-filter {
  min-height: 2.15rem;
  padding: 0 0.45rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.6rem;
  opacity: 0.52;
}
.table-shell {
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 0.7rem;
  background: color-mix(in srgb, currentColor 2.5%, transparent);
}
.bookmark-table {
  width: 100%;
  min-width: 70rem;
  border-collapse: collapse;
  text-align: left;
}
.bookmark-table th {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 11%, transparent);
  color: currentColor;
  font-size: 0.56rem;
  font-weight: 500;
  opacity: 0.46;
  white-space: nowrap;
}
.bookmark-table td {
  height: 4.4rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 9%, transparent);
  color: currentColor;
  font-size: 0.64rem;
  vertical-align: middle;
}
.bookmark-table tbody tr:last-child td {
  border-bottom: 0;
}
.kind-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: color-mix(in srgb, currentColor 68%, transparent);
  font-size: 0.58rem;
  white-space: nowrap;
}
.kind-cell i {
  font-size: 0.85rem;
}
.bookmark-name-cell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  max-width: 22rem;
}
.asset-name-button {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 0.28rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.asset-name-button strong,
.asset-name-button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.asset-name-button strong {
  font-size: 0.68rem;
  font-weight: 500;
}
.asset-name-button span,
.date-cell,
.muted-cell {
  font-size: 0.57rem;
  opacity: 0.42;
}
.bookmark-url {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  place-items: center;
  border-radius: 0.35rem;
  color: inherit;
  opacity: 0.42;
}
.tag-list {
  display: flex;
  max-width: 15rem;
  align-items: center;
  gap: 0.25rem;
}
.tag-list span,
.tag-list small {
  max-width: 5.5rem;
  overflow: hidden;
  padding: 0.26rem 0.35rem;
  border-radius: 0.28rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  font-size: 0.53rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tag-list small {
  padding-inline: 0.25rem;
  background: transparent;
  opacity: 0.5;
}
.visibility-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.3rem 0.42rem;
  border-radius: 0.35rem;
  background: color-mix(in srgb, #568c68 11%, transparent);
  color: #46775a;
  font-size: 0.56rem;
  white-space: nowrap;
}
.dark .visibility-tag {
  color: #8ac19a;
}
.visibility-tag i {
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 50%;
  background: currentColor;
}
.visibility-tag--private {
  background: color-mix(in srgb, #b06b3a 12%, transparent);
  color: #9a5b30;
}
.dark .visibility-tag--private {
  color: #e0a477;
}
.numeric-cell {
  font-variant-numeric: tabular-nums;
  opacity: 0.58;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}
.row-actions button {
  display: grid;
  width: 1.9rem;
  height: 1.9rem;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.44;
}
.skeleton-row td {
  height: 4.4rem;
}
.skeleton-block {
  display: block;
  height: 0.62rem;
  border-radius: 0.25rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
  animation: table-pulse 1.2s ease-in-out infinite alternate;
}
.skeleton-block--wide {
  width: min(14rem, 70%);
}
.skeleton-block--medium {
  width: 5rem;
}
.skeleton-block--short {
  width: 3.5rem;
}
.skeleton-block--date {
  width: 5rem;
}
.skeleton-block--action {
  width: 2rem;
  margin-left: auto;
}
.empty-state {
  height: 15rem !important;
  text-align: center !important;
}
.empty-state i,
.empty-state strong,
.empty-state span {
  display: block;
  margin-inline: auto;
}
.empty-state i {
  margin-bottom: 0.55rem;
  font-size: 1.4rem;
  opacity: 0.28;
}
.empty-state strong {
  margin-bottom: 0.3rem;
  font-size: 0.68rem;
  font-weight: 500;
}
.empty-state span {
  font-size: 0.59rem;
  opacity: 0.42;
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0 0;
}
.pagination > span {
  font-size: 0.58rem;
  opacity: 0.42;
}
.pagination > div {
  display: flex;
  gap: 0.45rem;
}
.pagination button {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 0.42rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.59rem;
}
.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
@media (hover: hover) and (pointer: fine) {
  .reset-filter:hover,
  .row-actions button:hover,
  .bookmark-url:hover {
    opacity: 1;
  }
  .asset-name-button:hover strong {
    color: #a13d32;
  }
}
@keyframes table-pulse {
  to {
    opacity: 0.42;
  }
}
@media (max-width: 1120px) {
  .library-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;
  }
  .library-filters {
    flex-wrap: wrap;
  }
  .search-control {
    width: min(100%, 19rem);
  }
}
@media (max-width: 599.9px) {
  .library-filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .search-control {
    grid-column: 1 / -1;
    width: 100%;
  }
  .filter-control {
    justify-content: space-between;
  }
  .reset-filter {
    justify-self: start;
  }
  .pagination {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
  }
}
</style>
