<script setup lang="ts">
import type { PhotoUploadPayload } from '~/composables/useAdminPhotos'
import { extractPhotoMetadata } from '~/utils/photoMetadata'

defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: [payload: PhotoUploadPayload] }>()

const input = useTemplateRef<HTMLInputElement>('input')
const file = shallowRef<File | null>(null)
const preview = ref<string | null>(null)
const isPrivate = ref(false)
const processing = ref(false)
const localError = ref<string | null>(null)
const dragging = ref(false)

function revokePreview() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = null
}

function selectFile(nextFile?: File) {
  if (!nextFile) return
  localError.value = null
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
    localError.value = '仅支持 JPEG、PNG 和 WebP 图片。'
    return
  }
  if (nextFile.size > 20 * 1024 * 1024) {
    localError.value = '原图不能超过 20 MB。'
    return
  }
  revokePreview()
  file.value = nextFile
  preview.value = URL.createObjectURL(nextFile)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  selectFile(event.dataTransfer?.files[0])
}

async function submit() {
  if (!file.value) return
  processing.value = true
  localError.value = null
  try {
    const metadata = await extractPhotoMetadata(file.value)
    emit('submit', { file: file.value, private: isPrivate.value, ...metadata })
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '图片解析失败'
  } finally {
    processing.value = false
  }
}

function reset() {
  file.value = null
  isPrivate.value = false
  revokePreview()
  if (input.value) input.value.value = ''
}

defineExpose({ reset })
onBeforeUnmount(revokePreview)
</script>

<template>
  <section class="upload-panel" aria-labelledby="upload-title">
    <div class="upload-heading">
      <div>
        <span>01</span>
        <h2 id="upload-title">新增图片</h2>
      </div>
      <p>上传一张原图，自动生成 2560px 压缩图与 600px 缩略图。</p>
    </div>

    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': dragging, 'drop-zone--selected': file }"
      @dragenter.prevent="dragging = true"
      @dragover.prevent
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img v-if="preview" :src="preview" alt="待上传图片预览" />
      <button v-else type="button" @click="input?.click()">
        <i class="i-hugeicons:image-upload" aria-hidden="true" />
        <strong>拖入原图</strong>
        <small>或点击选择，最大 20 MB</small>
      </button>
      <input
        ref="input"
        class="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="selectFile(($event.target as HTMLInputElement).files?.[0])"
      />
      <div v-if="file" class="file-overlay">
        <div>
          <strong>{{ file.name }}</strong>
          <span>{{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
        </div>
        <button type="button" aria-label="重新选择图片" @click="input?.click()">
          <i class="i-hugeicons:edit-02" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="upload-actions">
      <label class="privacy-control">
        <input v-model="isPrivate" type="checkbox" />
        <span aria-hidden="true" />
        <span>设为私密</span>
      </label>
      <button
        class="upload-button"
        type="button"
        :disabled="!file || busy || processing"
        @click="submit"
      >
        <span>{{ busy ? '正在写入 R2' : processing ? '正在解析原图' : '上传并处理' }}</span>
        <i class="i-hugeicons:arrow-up-right-01" aria-hidden="true" />
      </button>
    </div>
    <p v-if="localError" class="form-error" role="alert">{{ localError }}</p>
  </section>
</template>

<style scoped>
.upload-panel {
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 1rem;
}

.upload-heading {
  display: grid;
  grid-template-columns: 1fr minmax(14rem, 0.75fr);
  gap: 2rem;
  align-items: end;
  margin-bottom: 1.25rem;
}

.upload-heading div {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
}

.upload-heading span,
.upload-heading p {
  font-size: 0.67rem;
  line-height: 1.5;
  opacity: 0.45;
}

.upload-heading h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.upload-heading p {
  margin: 0;
}

.drop-zone {
  position: relative;
  display: grid;
  min-height: 19rem;
  overflow: hidden;
  border-radius: 0.7rem;
  background: color-mix(in srgb, currentColor 5%, transparent);
  transition:
    background 180ms ease,
    transform 180ms ease;
}

.drop-zone--active {
  background: color-mix(in srgb, currentColor 11%, transparent);
  transform: scale(0.995);
}

.drop-zone > img {
  width: 100%;
  height: 100%;
  max-height: 28rem;
  object-fit: contain;
}

.drop-zone > button {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.65rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.drop-zone > button i {
  margin-bottom: 0.8rem;
  font-size: 1.8rem;
  opacity: 0.55;
}

.drop-zone > button strong {
  font-size: 0.86rem;
  font-weight: 500;
}

.drop-zone > button small {
  font-size: 0.66rem;
  opacity: 0.4;
}

.file-overlay {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: color-mix(in srgb, #11110f 76%, transparent);
  color: #f2f2ee;
  backdrop-filter: blur(12px);
}

.file-overlay div {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.file-overlay strong {
  overflow: hidden;
  font-size: 0.75rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-overlay span {
  font-size: 0.62rem;
  opacity: 0.55;
}

.file-overlay button {
  display: grid;
  flex: none;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.upload-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.privacy-control {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.7rem;
  cursor: pointer;
}

.privacy-control input {
  position: absolute;
  opacity: 0;
}

.privacy-control input + span {
  width: 1.75rem;
  height: 1rem;
  padding: 0.13rem;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 16%, transparent);
  box-sizing: border-box;
}

.privacy-control input + span::after {
  display: block;
  width: 0.74rem;
  height: 0.74rem;
  border-radius: 50%;
  background: currentColor;
  content: '';
  transition: transform 180ms ease;
}

.privacy-control input:checked + span::after {
  transform: translateX(0.75rem);
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  border: 0;
  border-radius: 0.55rem;
  background: #11110f;
  color: #f2f2ee;
  cursor: pointer;
  font: inherit;
  font-size: 0.7rem;
}

.dark .upload-button {
  background: #e9e9e5;
  color: #11110f;
}

.upload-button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.upload-button:active:not(:disabled) {
  transform: translateY(1px);
}

.form-error {
  margin: 0.8rem 0 0;
  color: #a13d32;
  font-size: 0.68rem;
}

@media (max-width: 767.9px) {
  .upload-panel {
    padding: 1rem;
  }
  .upload-heading {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  .drop-zone {
    min-height: 15rem;
  }
}
</style>
