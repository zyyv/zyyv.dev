<script setup lang="ts">
import type { NewPhoto, PhotoExif } from '~/types'

const props = defineProps<{ photo: NewPhoto; busy: boolean }>()
const emit = defineEmits<{
  close: []
  save: [update: Pick<NewPhoto, 'filename' | 'private' | 'exif'>]
}>()

const filename = ref(props.photo.filename)
const isPrivate = ref(Boolean(props.photo.private))
const exif = reactive<PhotoExif>({
  ...props.photo.exif,
  gps: props.photo.exif?.gps ? { ...props.photo.exif.gps } : undefined,
})

function save() {
  emit('save', { filename: filename.value.trim(), private: isPrivate.value, exif: { ...exif } })
}

function formatExposure(value?: number) {
  if (!value) return '—'
  return value < 1 ? `1/${Math.round(1 / value)}s` : `${value}s`
}
</script>

<template>
  <div class="editor-backdrop" role="presentation" @click.self="emit('close')">
    <aside class="editor" aria-labelledby="editor-title">
      <header>
        <div>
          <span>编辑图片</span>
          <h2 id="editor-title">{{ photo.filename }}</h2>
        </div>
        <button type="button" aria-label="关闭编辑面板" @click="emit('close')">
          <i class="i-hugeicons:cancel-01" aria-hidden="true" />
        </button>
      </header>

      <img class="editor-image" :src="photo.compressed" :alt="photo.filename" />

      <form @submit.prevent="save">
        <label class="field">
          <span>文件名</span>
          <input v-model="filename" required maxlength="255" />
        </label>

        <label class="switch-field">
          <div>
            <strong>私密图片</strong>
            <span>私密图不会出现在公开照片页。</span>
          </div>
          <input v-model="isPrivate" type="checkbox" />
        </label>

        <div class="exif-heading">
          <span>EXIF</span>
          <small
            >{{ photo.width }} × {{ photo.height }} · {{ photo.compressedSizeFormatted }}</small
          >
        </div>
        <div class="exif-grid">
          <label class="field"
            ><span>相机品牌</span><input v-model="exif.make" placeholder="—"
          /></label>
          <label class="field"
            ><span>相机型号</span><input v-model="exif.model" placeholder="—"
          /></label>
          <label class="field"
            ><span>镜头</span><input v-model="exif.lens" placeholder="—"
          /></label>
          <label class="field"
            ><span>ISO</span><input v-model.number="exif.iso" type="number" placeholder="—"
          /></label>
          <label class="field"
            ><span>光圈</span
            ><input v-model.number="exif.fNumber" type="number" step="0.1" placeholder="—"
          /></label>
          <label class="field"
            ><span>焦距 (mm)</span
            ><input v-model.number="exif.focalLength" type="number" step="0.1" placeholder="—"
          /></label>
        </div>
        <p class="exposure-readout">当前快门：{{ formatExposure(exif.exposureTime) }}</p>

        <div class="editor-actions">
          <button type="button" @click="emit('close')">取消</button>
          <button type="submit" :disabled="busy || !filename.trim()">
            {{ busy ? '保存中' : '保存修改' }}
          </button>
        </div>
      </form>
    </aside>
  </div>
</template>

<style scoped>
.editor-backdrop {
  position: fixed;
  z-index: 60;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgb(17 17 15 / 42%);
  backdrop-filter: blur(5px);
}
.editor {
  width: min(100%, 34rem);
  height: 100dvh;
  overflow: auto;
  padding: 1.25rem;
  background: #e9e9e5;
  color: #11110f;
  box-sizing: border-box;
  box-shadow: -1rem 0 4rem rgb(17 17 15 / 14%);
  animation: editor-in 360ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dark .editor {
  background: #11110f;
  color: #e9e9e5;
}
.editor header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.editor header span {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.6rem;
  opacity: 0.42;
}
.editor h2 {
  max-width: 24rem;
  overflow: hidden;
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor header button {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.editor-image {
  display: block;
  width: 100%;
  max-height: 22rem;
  object-fit: contain;
  border-radius: 0.7rem;
  background: color-mix(in srgb, currentColor 5%, transparent);
}
.editor form {
  padding: 1.5rem 0;
}
.field {
  display: grid;
  gap: 0.45rem;
}
.field > span,
.exif-heading > span {
  font-size: 0.62rem;
  opacity: 0.48;
}
.field input {
  width: 100%;
  padding: 0.72rem;
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  border-radius: 0.5rem;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.72rem;
  box-sizing: border-box;
}
.field input:focus {
  border-color: color-mix(in srgb, currentColor 55%, transparent);
}
.switch-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem 0;
  border-block: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}
.switch-field div {
  display: grid;
  gap: 0.3rem;
}
.switch-field strong {
  font-size: 0.72rem;
  font-weight: 500;
}
.switch-field span {
  font-size: 0.62rem;
  opacity: 0.45;
}
.switch-field input {
  width: 1rem;
  height: 1rem;
  accent-color: currentColor;
}
.exif-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.8rem;
}
.exif-heading small {
  font-size: 0.58rem;
  opacity: 0.38;
}
.exif-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}
.exposure-readout {
  margin: 0.8rem 0 0;
  font-size: 0.6rem;
  opacity: 0.4;
}
.editor-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 0.7rem;
  margin-top: 1.75rem;
}
.editor-actions button {
  padding: 0.8rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.7rem;
}
.editor-actions button[type='submit'] {
  border-color: #11110f;
  background: #11110f;
  color: #f2f2ee;
}
.dark .editor-actions button[type='submit'] {
  border-color: #e9e9e5;
  background: #e9e9e5;
  color: #11110f;
}
.editor-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.editor-actions button:active:not(:disabled) {
  transform: translateY(1px);
}
@keyframes editor-in {
  from {
    transform: translateX(100%);
  }
}
@media (max-width: 479.9px) {
  .exif-grid {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .editor {
    animation: none;
  }
}
</style>
