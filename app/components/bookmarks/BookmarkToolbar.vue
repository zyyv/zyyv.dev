<script setup lang="ts">
defineProps<{
  tags: string[]
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
      <span class="search-field__command" aria-hidden="true">$ rg</span>
      <span class="sr-only">搜索书签</span>
      <input ref="searchInput" v-model="query" type="search" placeholder="title | url | tag" />
      <kbd>press /</kbd>
    </label>

    <label v-if="tags.length" class="tag-filter">
      <span class="sr-only">按标签筛选</span>
      <select v-model="tag">
        <option value="">label:any</option>
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
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin: 0 0 clamp(3rem, 6vw, 5rem);
  padding-bottom: 0.8rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  font-family: ui-monospace, monospace;
}
.search-field {
  display: grid;
  grid-template-columns: auto 1fr auto;
  min-width: 12rem;
  flex: 1;
  align-items: center;
  gap: 0.6rem;
}
.search-field__command {
  color: #c8342d;
  font-size: 0.68rem;
  white-space: nowrap;
}
.search-field input {
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font:
    0.68rem ui-monospace,
    monospace;
}
.search-field input::placeholder {
  color: currentColor;
  opacity: 0.42;
}
.search-field kbd {
  font:
    0.52rem ui-monospace,
    monospace;
  letter-spacing: 0.04em;
  opacity: 0.36;
  text-transform: uppercase;
}
.tag-filter {
  position: relative;
  display: flex;
  align-items: center;
}
.tag-filter select {
  padding: 0 1.4rem 0 0;
  border: 0;
  appearance: none;
  background: transparent;
  color: inherit;
  font:
    0.6rem ui-monospace,
    monospace;
}
.tag-filter i {
  position: absolute;
  right: 0;
  pointer-events: none;
  opacity: 0.45;
}
.toolbar__actions {
  display: flex;
  gap: 0.8rem;
}
.toolbar__actions button {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font:
    0.58rem ui-monospace,
    monospace;
  text-transform: uppercase;
}
.toolbar__actions button:active {
  transform: translateY(1px);
}
.toolbar__actions .toolbar__primary {
  color: #c8342d;
}
@media (max-width: 600px) {
  .toolbar {
    flex-wrap: wrap;
    gap: 0.9rem 1.25rem;
  }
  .search-field {
    min-width: 100%;
  }
  .search-field kbd {
    display: none;
  }
  .tag-filter select {
    width: auto;
  }
  .toolbar__actions {
    margin-left: auto;
  }
}
</style>
