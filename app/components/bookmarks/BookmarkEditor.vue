<script setup lang="ts">
import type { Bookmark, BookmarkInput, BookmarkKind } from '~/types'

const props = defineProps<{
  bookmark: Bookmark | null
  initialKind: BookmarkKind
  initialParentId: string | null
  folders: readonly Bookmark[]
  busy: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [input: BookmarkInput]
}>()

const form = reactive({
  kind: 'bookmark' as BookmarkKind,
  title: '',
  url: '',
  parentId: '',
  description: '',
  iconUrl: '',
  tags: '',
  private: false,
  sortOrder: 0,
})
const titleInput = useTemplateRef<HTMLInputElement>('titleInput')

watch(
  () => [props.bookmark, props.initialKind, props.initialParentId] as const,
  async () => {
    const item = props.bookmark
    form.kind = item?.kind ?? props.initialKind
    form.title = item?.title ?? ''
    form.url = item?.url ?? ''
    form.parentId = item?.parentId ?? props.initialParentId ?? ''
    form.description = item?.description ?? ''
    form.iconUrl = item?.iconUrl ?? ''
    form.tags = item?.tags.join(', ') ?? ''
    form.private = item?.private ?? false
    form.sortOrder = item?.sortOrder ?? 0
    await nextTick()
    titleInput.value?.focus()
  },
  { immediate: true },
)

const title = computed(() =>
  props.bookmark ? '编辑项目' : form.kind === 'folder' ? '新建文件夹' : '添加书签',
)

function submit() {
  emit('save', {
    kind: form.kind,
    title: form.title,
    url: form.kind === 'bookmark' ? form.url : null,
    parentId: form.parentId || null,
    description: form.description || null,
    iconUrl: form.iconUrl || null,
    tags: form.tags
      .split(/[,，]/u)
      .map((tag) => tag.trim())
      .filter(Boolean),
    private: form.private,
    sortOrder: Number(form.sortOrder) || 0,
  })
}
</script>

<template>
  <div class="editor-backdrop" role="presentation" @click.self="emit('close')">
    <section class="editor" role="dialog" aria-modal="true" aria-labelledby="bookmark-editor-title">
      <header class="editor__header">
        <div>
          <span>{{ bookmark ? 'UPDATE' : 'CREATE' }}</span>
          <h2 id="bookmark-editor-title">{{ title }}</h2>
        </div>
        <button type="button" aria-label="关闭" @click="emit('close')">
          <i class="i-hugeicons:cancel-01" aria-hidden="true" />
        </button>
      </header>

      <form @submit.prevent="submit">
        <fieldset class="editor__kind">
          <legend>类型</legend>
          <label>
            <input
              v-model="form.kind"
              type="radio"
              value="bookmark"
              :disabled="Boolean(bookmark?.kind === 'folder' && bookmark)"
            />
            <span><i class="i-hugeicons:link-02" aria-hidden="true" /> 书签</span>
          </label>
          <label>
            <input
              v-model="form.kind"
              type="radio"
              value="folder"
              :disabled="Boolean(bookmark?.kind === 'bookmark' && bookmark)"
            />
            <span><i class="i-hugeicons:folder-02" aria-hidden="true" /> 文件夹</span>
          </label>
        </fieldset>

        <div class="editor__grid">
          <label class="editor__field">
            <span>名称</span>
            <input
              ref="titleInput"
              v-model="form.title"
              required
              maxlength="120"
              placeholder="例如：Vue 生态"
            />
          </label>
          <label class="editor__field">
            <span>所在文件夹</span>
            <select v-model="form.parentId">
              <option value="">书签栏根目录</option>
              <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                {{ folder.title }}
              </option>
            </select>
          </label>
          <label v-if="form.kind === 'bookmark'" class="editor__field editor__field--wide">
            <span>网址</span>
            <input
              v-model="form.url"
              required
              type="url"
              maxlength="2048"
              placeholder="https://example.com"
            />
          </label>
          <label class="editor__field editor__field--wide">
            <span>说明</span>
            <textarea
              v-model="form.description"
              rows="3"
              maxlength="400"
              placeholder="为什么值得收藏，或适合在什么场景使用"
            />
          </label>
          <label class="editor__field">
            <span>图标地址</span>
            <input
              v-model="form.iconUrl"
              type="url"
              maxlength="2048"
              placeholder="可选，https://..."
            />
          </label>
          <label class="editor__field">
            <span>标签</span>
            <input v-model="form.tags" maxlength="396" placeholder="Vue, 工具, 阅读" />
            <small>用逗号分隔，最多 12 个</small>
          </label>
          <label class="editor__field">
            <span>排序</span>
            <input v-model.number="form.sortOrder" type="number" min="0" step="1" />
          </label>
          <label class="editor__visibility">
            <input v-model="form.private" type="checkbox" />
            <span>
              <strong>仅维护者可见</strong>
              <small>访客看不到此项目；私密文件夹也会隐藏其内容。</small>
            </span>
          </label>
        </div>

        <footer>
          <button type="button" @click="emit('close')">取消</button>
          <button
            type="submit"
            :disabled="busy || !form.title || (form.kind === 'bookmark' && !form.url)"
          >
            {{ busy ? '保存中' : '保存' }}
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<style scoped>
.editor-backdrop {
  position: fixed;
  z-index: 70;
  inset: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 1rem;
  background: rgb(17 17 15 / 48%);
  backdrop-filter: blur(7px);
}
.editor {
  width: min(100%, 42rem);
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 1.4rem;
  border-radius: 0.85rem;
  background: #e9e9e5;
  color: #11110f;
  box-shadow: 0 1.5rem 5rem rgb(17 17 15 / 24%);
}
.dark .editor {
  background: #181816;
  color: #e9e9e5;
}
.editor__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.editor__header span {
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  opacity: 0.4;
}
.editor__header h2 {
  margin: 0.35rem 0 0;
  font-size: 1.55rem;
  font-weight: 550;
  letter-spacing: -0.045em;
}
.editor__header button {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  border: 0;
  border-radius: 0.55rem;
  place-items: center;
  background: color-mix(in srgb, currentColor 7%, transparent);
  color: inherit;
  cursor: pointer;
}
.editor__kind {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0;
  border: 0;
}
.editor__kind legend {
  margin-bottom: 0.55rem;
  font-size: 0.65rem;
  opacity: 0.56;
}
.editor__kind input {
  position: absolute;
  opacity: 0;
}
.editor__kind span {
  display: flex;
  min-height: 2.6rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.65rem;
  cursor: pointer;
  font-size: 0.7rem;
}
.editor__kind input:checked + span {
  border-color: currentColor;
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.editor__kind input:disabled + span {
  cursor: not-allowed;
  opacity: 0.45;
}
.editor__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.editor__field {
  display: grid;
  gap: 0.45rem;
}
.editor__field--wide {
  grid-column: 1 / -1;
}
.editor__field > span {
  font-size: 0.65rem;
  opacity: 0.56;
}
.editor__field input,
.editor__field select,
.editor__field textarea {
  width: 100%;
  min-width: 0;
  padding: 0.72rem 0.75rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.6rem;
  outline: 0;
  background: transparent;
  box-sizing: border-box;
  color: inherit;
  font: inherit;
  font-size: 0.72rem;
}
.editor__field textarea {
  resize: vertical;
  line-height: 1.5;
}
.editor__field input:focus,
.editor__field select:focus,
.editor__field textarea:focus {
  border-color: color-mix(in srgb, currentColor 55%, transparent);
}
.editor__field input::placeholder,
.editor__field textarea::placeholder {
  color: currentColor;
  opacity: 0.38;
}
.editor__field small,
.editor__visibility small {
  font-size: 0.57rem;
  line-height: 1.4;
  opacity: 0.42;
}
.editor__visibility {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding-top: 1.45rem;
}
.editor__visibility input {
  margin-top: 0.15rem;
  accent-color: currentColor;
}
.editor__visibility strong,
.editor__visibility small {
  display: block;
}
.editor__visibility strong {
  margin-bottom: 0.2rem;
  font-size: 0.68rem;
  font-weight: 550;
}
.editor footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 1.5rem;
}
.editor footer button {
  min-height: 2.7rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.65rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
}
.editor footer button:last-child {
  border-color: #11110f;
  background: #11110f;
  color: #e9e9e5;
}
.dark .editor footer button:last-child {
  border-color: #e9e9e5;
  background: #e9e9e5;
  color: #11110f;
}
.editor footer button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}
.editor footer button:active:not(:disabled) {
  transform: translateY(1px);
}
@media (max-width: 600px) {
  .editor-backdrop {
    align-items: end;
    padding: 0;
  }
  .editor {
    width: 100%;
    max-height: 92dvh;
    border-radius: 0.9rem 0.9rem 0 0;
    box-sizing: border-box;
  }
  .editor__grid {
    grid-template-columns: 1fr;
  }
  .editor__field--wide {
    grid-column: auto;
  }
}
</style>
