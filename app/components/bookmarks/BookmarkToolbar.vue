<script setup lang="ts">
defineProps<{
  tags: string[]
  total: number
  folderCount: number
  isAdmin: boolean
}>()

const query = defineModel<string>('query', { required: true })
const tag = defineModel<string>('tag', { required: true })
const emit = defineEmits<{ create: [kind: 'bookmark' | 'folder'] }>()
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

useEventListener(document, 'keydown', (event) => {
  const target = event.target
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  if (event.key !== '/' || isTyping) return
  event.preventDefault()
  searchInput.value?.focus()
})
</script>

<template>
  <section class="toolbar" aria-label="书签筛选">
    <label class="search-field">
      <i class="i-hugeicons:search-01" aria-hidden="true" />
      <span class="sr-only">搜索书签</span>
      <input ref="searchInput" v-model="query" type="search" placeholder="搜索名称、网址或标签" />
      <kbd>/</kbd>
    </label>

    <div class="toolbar__meta">
      <span>{{ total }} 个书签</span>
      <span>{{ folderCount }} 个文件夹</span>
    </div>

    <label v-if="tags.length" class="tag-filter">
      <span class="sr-only">按标签筛选</span>
      <select v-model="tag">
        <option value="">全部标签</option>
        <option v-for="item in tags" :key="item" :value="item">{{ item }}</option>
      </select>
      <i class="i-hugeicons:arrow-down-01" aria-hidden="true" />
    </label>

    <div v-if="isAdmin" class="toolbar__actions">
      <button type="button" @click="emit('create', 'folder')">
        <i class="i-hugeicons:folder-add" aria-hidden="true" /> 新建文件夹
      </button>
      <button type="button" class="toolbar__primary" @click="emit('create', 'bookmark')">
        <i class="i-hugeicons:link-add" aria-hidden="true" /> 添加书签
      </button>
    </div>
  </section>
</template>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: minmax(16rem, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 2.2rem;
}
.search-field {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
  min-height: 2.9rem;
  padding: 0 0.9rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in srgb, currentColor 3%, transparent);
}
.search-field:focus-within {
  border-color: color-mix(in srgb, currentColor 48%, transparent);
}
.search-field > i {
  opacity: 0.42;
}
.search-field input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.78rem;
}
.search-field input::placeholder {
  color: currentColor;
  opacity: 0.42;
}
.search-field kbd {
  padding: 0.15rem 0.35rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.3rem;
  font:
    0.58rem ui-monospace,
    monospace;
  opacity: 0.46;
}
.toolbar__meta {
  display: flex;
  gap: 0.9rem;
  padding: 0 0.45rem;
  font-size: 0.65rem;
  white-space: nowrap;
  opacity: 0.46;
}
.tag-filter {
  position: relative;
  display: flex;
  align-items: center;
}
.tag-filter select {
  min-height: 2.9rem;
  padding: 0 2.3rem 0 0.85rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.75rem;
  appearance: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.7rem;
}
.tag-filter i {
  position: absolute;
  right: 0.75rem;
  pointer-events: none;
  opacity: 0.45;
}
.toolbar__actions {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  gap: 0.55rem;
}
.toolbar__actions button {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.35rem;
  padding: 0 0.8rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.65rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
}
.toolbar__actions button:active {
  transform: translateY(1px);
}
.toolbar__actions .toolbar__primary {
  background: #11110f;
  color: #e9e9e5;
}
.dark .toolbar__actions .toolbar__primary {
  background: #e9e9e5;
  color: #11110f;
}
@media (max-width: 900px) {
  .toolbar {
    grid-template-columns: 1fr auto;
  }
  .toolbar__meta {
    display: none;
  }
}
@media (max-width: 600px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
  .tag-filter select {
    width: 100%;
  }
  .toolbar__actions {
    justify-content: stretch;
  }
  .toolbar__actions button {
    flex: 1;
    justify-content: center;
  }
}
</style>
