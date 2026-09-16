<script setup lang="ts">
import { play } from 'cuelume'
import { computed, onBeforeUnmount, reactive, shallowRef, watch } from 'vue'
import type { ArthashConfig } from '#shared/constants/arthash'
import { DEFAULT_ARTHASH_CONFIG } from '#shared/constants/arthash'
import type { Photo, PhotoExif } from '~/types'
import type { PhotoUpdatePayload, PhotoUploadPayload } from '~/composables/admin/useAdminPhotos'
import {
  getMediaType,
  prepareMediaUpload,
  regenerateMediaArthash,
  type PreparedMediaUpload,
} from '~/utils/photoMetadata'
import ArthashSettingsPanel from './ArthashSettingsPanel.vue'

const props = defineProps<{
  busy: boolean
  error?: string | null
  photo?: Photo | null
}>()
const emit = defineEmits<{
  close: []
  submit: [payload: PhotoUploadPayload]
  update: [payload: PhotoUpdatePayload]
}>()

const input = useTemplateRef<HTMLInputElement>('input')
const file = shallowRef<File | null>(null)
const preview = shallowRef<string | null>(null)
const analysis = shallowRef<PreparedMediaUpload | null>(null)
const arthash = shallowRef('')
const filename = shallowRef('')
const isPrivate = shallowRef(false)
const activePanel = shallowRef<'details' | 'exif' | 'arthash'>('details')
const processing = shallowRef(false)
const generating = shallowRef(false)
const dragging = shallowRef(false)
const localError = shallowRef<string | null>(null)
const settings = shallowRef<ArthashConfig>({ ...DEFAULT_ARTHASH_CONFIG })
const isEditing = computed(() => Boolean(props.photo))
const exif = reactive<PhotoExif>({})
let parseRun = 0
let arthashRun = 0
let arthashTimer: ReturnType<typeof setTimeout> | undefined
let regenerateAfterProcessing = false

const selectedMediaType = computed(
  () => (file.value ? getMediaType(file.value) : null) ?? props.photo?.mediaType ?? null,
)
const previewIsVideo = computed(
  () => !isEditing.value && selectedMediaType.value === 'video' && Boolean(file.value),
)
const currentWidth = computed(() => analysis.value?.width || props.photo?.width || 0)
const currentHeight = computed(() => analysis.value?.height || props.photo?.height || 0)
const currentOriginalSize = computed(() =>
  file.value
    ? `${(file.value.size / 1024 / 1024).toFixed(2)} MB`
    : (props.photo?.originSizeFormatted ?? '—'),
)
const canSubmit = computed(() =>
  Boolean(
    file.value && (isEditing.value || analysis.value) && arthash.value && filename.value.trim(),
  ),
)
const dialogTitle = computed(() => (isEditing.value ? '编辑媒体' : '新增媒体'))
const submitLabel = computed(() => (isEditing.value ? '更新媒体' : '确认并提交'))

function clearExif() {
  for (const key of Object.keys(exif) as Array<keyof PhotoExif>) delete exif[key]
}

function revokePreview() {
  if (!preview.value) return
  URL.revokeObjectURL(preview.value)
  preview.value = null
}

function resetForm(nextPhoto: Photo | null | undefined) {
  parseRun += 1
  arthashRun += 1
  if (arthashTimer) {
    clearTimeout(arthashTimer)
    arthashTimer = undefined
  }
  analysis.value = null
  file.value = null
  clearExif()
  if (nextPhoto?.exif) {
    Object.assign(exif, {
      ...nextPhoto.exif,
      gps: nextPhoto.exif.gps ? { ...nextPhoto.exif.gps } : undefined,
    })
  }
  revokePreview()
  activePanel.value = 'details'
  processing.value = false
  generating.value = false
  regenerateAfterProcessing = false
  dragging.value = false
  localError.value = null
  settings.value = nextPhoto
    ? nextPhoto.arthashConfig
      ? { ...nextPhoto.arthashConfig }
      : { ...DEFAULT_ARTHASH_CONFIG, shape: 'triangle', n: 12 }
    : { ...DEFAULT_ARTHASH_CONFIG }
  filename.value = nextPhoto?.filename ?? ''
  isPrivate.value = nextPhoto?.private ?? false
  arthash.value = nextPhoto?.arthash ?? ''
  preview.value = nextPhoto?.compressed ?? null

  if (nextPhoto) void loadEditorSource(nextPhoto)
}

async function loadEditorSource(photo: Photo) {
  const run = parseRun
  processing.value = true
  try {
    const response = await fetch(`/api/photo-assets/${encodeURIComponent(photo.id)}/origin`)
    if (!response.ok) throw new Error('无法读取原始媒体')
    const blob = await response.blob()
    if (run !== parseRun || props.photo?.id !== photo.id) return
    const contentType = blob.type || (photo.mediaType === 'video' ? 'video/mp4' : 'image/jpeg')
    file.value = new File([blob], photo.filename, { type: contentType })
  } catch (error) {
    if (run === parseRun && props.photo?.id === photo.id) {
      localError.value = error instanceof Error ? error.message : '无法读取原始媒体'
      play('error', { volume: 0.7 })
    }
  } finally {
    if (run === parseRun && props.photo?.id === photo.id) {
      processing.value = false
      if (regenerateAfterProcessing) {
        regenerateAfterProcessing = false
        scheduleArthashRegeneration()
      }
    }
  }
}

watch(
  () => props.photo?.id,
  (photoId) => resetForm(photoId ? props.photo : null),
  {
    immediate: true,
  },
)

function selectFile(nextFile?: File) {
  if (!nextFile) return
  if (isEditing.value) return
  localError.value = null
  const mediaType = getMediaType(nextFile)
  if (!mediaType) {
    localError.value = '仅支持 JPEG、PNG、WebP 图片，以及 MP4、WebM 视频。'
    return
  }
  if (nextFile.size > 50 * 1024 * 1024) {
    localError.value = `${mediaType === 'video' ? '视频' : '原图'}不能超过 50 MB。`
    return
  }

  parseRun += 1
  arthashRun += 1
  regenerateAfterProcessing = false
  analysis.value = null
  arthash.value = ''
  clearExif()
  revokePreview()
  file.value = nextFile
  filename.value = nextFile.name
  preview.value = URL.createObjectURL(nextFile)
  activePanel.value = 'details'
  void parseFile(nextFile)
}

async function parseFile(fileToParse: File) {
  const run = parseRun
  processing.value = true
  localError.value = null
  try {
    const result = await prepareMediaUpload(fileToParse, settings.value)
    if (run !== parseRun) return
    analysis.value = result
    arthash.value = result.arthash
    if (result.exif) Object.assign(exif, result.exif)
    activePanel.value = 'exif'
    play('success', { volume: 0.7 })
  } catch (error) {
    if (run === parseRun) {
      localError.value = error instanceof Error ? error.message : '图片解析失败'
      play('error', { volume: 0.7 })
    }
  } finally {
    if (run === parseRun) {
      processing.value = false
      if (regenerateAfterProcessing) {
        regenerateAfterProcessing = false
        scheduleArthashRegeneration()
      }
    }
  }
}

function scheduleArthashRegeneration() {
  if (arthashTimer) clearTimeout(arthashTimer)
  arthashTimer = setTimeout(() => void regenerateArthash(), 220)
}

watch(
  () => [
    settings.value.shape,
    settings.value.n,
    settings.value.color,
    settings.value.seed,
    settings.value.searchEnabled,
    settings.value.searchStrategy,
    settings.value.nRandom,
    settings.value.nTopk,
    settings.value.hillClimbSteps,
    settings.value.hillClimbMaxAge,
    settings.value.nAttempts,
  ],
  () => {
    if (!file.value) return
    if (processing.value || generating.value || (!isEditing.value && !analysis.value)) {
      regenerateAfterProcessing = true
      return
    }
    regenerateAfterProcessing = false
    scheduleArthashRegeneration()
  },
)

async function regenerateArthash() {
  const fileToParse = file.value
  if (!fileToParse) return
  const run = ++arthashRun
  generating.value = true
  try {
    const nextHash = await regenerateMediaArthash(fileToParse, settings.value)
    if (run === arthashRun) arthash.value = nextHash
  } catch (error) {
    if (run === arthashRun) {
      localError.value = error instanceof Error ? error.message : 'Arthash 重新生成失败'
    }
  } finally {
    if (run === arthashRun) {
      generating.value = false
      if (regenerateAfterProcessing) {
        regenerateAfterProcessing = false
        scheduleArthashRegeneration()
      }
    }
  }
}

function onDrop(event: DragEvent) {
  dragging.value = false
  if (isEditing.value) return
  play('pulse', { volume: 0.65 })
  selectFile(event.dataTransfer?.files[0])
}

function submit() {
  const currentFile = file.value
  const currentAnalysis = analysis.value
  if (!arthash.value || !filename.value.trim()) return

  const currentExif = Object.keys(exif).length
    ? { ...exif, gps: exif.gps ? { ...exif.gps } : undefined }
    : undefined

  if (isEditing.value && props.photo) {
    emit('update', {
      filename: filename.value.trim(),
      arthash: arthash.value,
      arthashConfig: { ...settings.value },
      exif: currentExif ?? {},
      private: isPrivate.value,
    })
    return
  }

  if (!currentFile || !currentAnalysis) return

  emit('submit', {
    file: currentFile,
    filename: filename.value.trim(),
    ...currentAnalysis,
    arthash: arthash.value,
    arthashConfig: { ...settings.value },
    exif: currentExif,
    private: isPrivate.value,
  })
}

function close() {
  emit('close')
}

function dismissBackdrop() {
  play('droplet')
  emit('close')
}

onBeforeUnmount(() => {
  if (arthashTimer) clearTimeout(arthashTimer)
  revokePreview()
})
</script>

<template>
  <div
    class="upload-backdrop"
    role="presentation"
    tabindex="-1"
    @click.self="dismissBackdrop"
    @keydown.esc="dismissBackdrop"
  >
    <section class="upload-dialog" role="dialog" aria-modal="true" aria-labelledby="upload-title">
      <header class="dialog-header">
        <div>
          <h2 id="upload-title">{{ dialogTitle }}</h2>
          <p>
            {{
              isEditing
                ? '修改文件信息与 Arthash 设置，提交后才会更新 D1。'
                : '先解析并确认信息，提交后才会写入 R2 与 D1。'
            }}
          </p>
        </div>
        <button
          type="button"
          class="dialog-close"
          :aria-label="isEditing ? '关闭编辑媒体' : '关闭新增媒体'"
          data-cuelume-toggle="droplet"
          @click="close"
        >
          <i class="i-hugeicons:cancel-01" aria-hidden="true" />
        </button>
      </header>

      <div class="dialog-layout">
        <div class="media-column">
          <div
            class="drop-zone"
            :class="{
              'drop-zone--active': dragging,
              'drop-zone--selected': file,
              'drop-zone--ready': currentWidth && currentHeight,
            }"
            :style="
              currentWidth && currentHeight
                ? { aspectRatio: `${currentWidth} / ${currentHeight}` }
                : undefined
            "
            @dragenter.prevent="dragging = true"
            @dragover.prevent
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
          >
            <video
              v-if="preview && previewIsVideo"
              :src="preview"
              muted
              loop
              playsinline
              controls
              aria-label="待上传视频预览"
            />
            <img v-else-if="preview" :src="preview" alt="待上传图片预览" />
            <button v-else type="button" data-cuelume-toggle="pulse" @click="input?.click()">
              <i class="i-hugeicons:image-upload" aria-hidden="true" />
              <strong>拖入图片或视频</strong>
              <small>JPEG / PNG / WebP / MP4 / WebM · 最大 50 MB</small>
            </button>
            <input
              v-if="!isEditing"
              ref="input"
              class="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              data-cuelume-toggle="pulse"
              @change="selectFile(($event.target as HTMLInputElement).files?.[0])"
            />
            <div v-if="file && !isEditing" class="file-bar">
              <div>
                <strong>{{ file.name }}</strong>
                <span>{{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
              </div>
              <button
                type="button"
                aria-label="重新选择媒体"
                data-cuelume-toggle="pulse"
                @click="input?.click()"
              >
                <i class="i-hugeicons:edit-02" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div class="analysis-summary">
            <div>
              <span>解析状态</span>
              <strong :class="{ 'is-ready': analysis || isEditing }">
                {{
                  processing
                    ? isEditing
                      ? '读取原图中'
                      : '解析中'
                    : isEditing
                      ? '已载入'
                      : analysis
                        ? '已完成'
                        : '等待选择'
                }}
              </strong>
            </div>
            <div>
              <span>尺寸</span>
              <strong>{{ currentWidth ? `${currentWidth} × ${currentHeight}` : '—' }}</strong>
            </div>
            <div>
              <span>资源类型</span>
              <strong>{{ selectedMediaType === 'video' ? '视频封面' : '图片资源' }}</strong>
            </div>
          </div>

          <p v-if="localError || props.error" class="form-error" role="alert">
            <i class="i-hugeicons:alert-02" aria-hidden="true" />
            {{ localError || props.error }}
          </p>
        </div>

        <div class="form-column">
          <nav class="panel-tabs" role="tablist" :aria-label="`${dialogTitle}信息面板`">
            <button
              type="button"
              role="tab"
              :aria-selected="activePanel === 'details'"
              :class="{ 'is-active': activePanel === 'details' }"
              data-cuelume-toggle="toggle"
              @click="activePanel = 'details'"
            >
              基本信息
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activePanel === 'exif'"
              :class="{ 'is-active': activePanel === 'exif' }"
              data-cuelume-toggle="toggle"
              @click="activePanel = 'exif'"
            >
              解析信息
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activePanel === 'arthash'"
              :class="{ 'is-active': activePanel === 'arthash' }"
              data-cuelume-toggle="toggle"
              @click="activePanel = 'arthash'"
            >
              Arthash
            </button>
          </nav>

          <form class="panel-content" @submit.prevent="submit">
            <section v-if="activePanel === 'details'" class="info-panel" role="tabpanel">
              <div class="panel-title">
                <h3>文件与可见性</h3>
              </div>
              <label class="field">
                <span>文件名</span>
                <input v-model="filename" required maxlength="255" placeholder="输入最终文件名" />
                <small>文件名会用于生成 R2 资源路径，提交前仍可修改。</small>
              </label>
              <label class="switch-field">
                <span>
                  <strong>设为私密</strong>
                  <small>私密媒体不会出现在公开照片页。</small>
                </span>
                <input v-model="isPrivate" type="checkbox" data-cuelume-toggle="toggle" />
              </label>
              <div class="resource-status">
                <div>
                  <span>原始文件</span
                  ><strong>{{ file?.type || (isEditing ? '沿用现有资源' : '—') }}</strong>
                </div>
                <div>
                  <span>压缩预览</span
                  ><strong>{{
                    isEditing ? '沿用现有资源' : analysis?.compressed.type || '等待解析'
                  }}</strong>
                </div>
                <div>
                  <span>缩略图</span
                  ><strong>{{
                    isEditing ? '沿用现有资源' : analysis?.thumbnail.type || '等待解析'
                  }}</strong>
                </div>
              </div>
            </section>

            <section v-else-if="activePanel === 'exif'" class="info-panel" role="tabpanel">
              <div class="panel-title">
                <h3>解析信息</h3>
              </div>
              <div class="readout-grid">
                <div>
                  <span>宽度</span><strong>{{ currentWidth || '—' }} px</strong>
                </div>
                <div>
                  <span>高度</span><strong>{{ currentHeight || '—' }} px</strong>
                </div>
                <div>
                  <span>原文件</span><strong>{{ currentOriginalSize }}</strong>
                </div>
                <div>
                  <span>EXIF</span
                  ><strong>{{ Object.keys(exif).length ? '已读取' : '无数据' }}</strong>
                </div>
              </div>
              <div v-if="selectedMediaType === 'image'" class="exif-fields">
                <label class="field"
                  ><span>相机品牌</span><input v-model="exif.make" placeholder="未读取"
                /></label>
                <label class="field"
                  ><span>相机型号</span><input v-model="exif.model" placeholder="未读取"
                /></label>
                <label class="field"
                  ><span>镜头</span><input v-model="exif.lens" placeholder="未读取"
                /></label>
                <label class="field"
                  ><span>ISO</span
                  ><input v-model.number="exif.iso" type="number" placeholder="未读取"
                /></label>
                <label class="field"
                  ><span>光圈</span
                  ><input
                    v-model.number="exif.fNumber"
                    type="number"
                    step="0.1"
                    placeholder="未读取"
                /></label>
                <label class="field"
                  ><span>焦距</span
                  ><input
                    v-model.number="exif.focalLength"
                    type="number"
                    step="0.1"
                    placeholder="未读取"
                /></label>
                <label class="field field--wide"
                  ><span>拍摄时间</span><input v-model="exif.dateTime" placeholder="未读取"
                /></label>
              </div>
              <p v-else class="panel-note">
                视频会生成一张封面图用于列表预览，不包含 EXIF 相机信息。
              </p>
            </section>

            <section v-else class="info-panel" role="tabpanel">
              <ArthashSettingsPanel
                v-model:settings="settings"
                :hash="arthash"
                :generating="generating"
                :aspect-ratio="
                  currentWidth && currentHeight ? currentWidth / currentHeight : undefined
                "
              />
            </section>

            <footer class="dialog-actions">
              <button
                type="button"
                class="secondary-button"
                data-cuelume-toggle="droplet"
                @click="close"
              >
                取消
              </button>
              <button
                type="submit"
                class="primary-button"
                :disabled="!canSubmit || busy || processing || generating"
                data-cuelume-toggle="pulse"
              >
                <span>{{
                  busy
                    ? isEditing
                      ? '正在保存修改'
                      : '正在上传到 R2'
                    : processing
                      ? isEditing
                        ? '正在读取原图'
                        : '正在解析媒体'
                      : generating
                        ? '正在更新 Arthash'
                        : submitLabel
                }}</span>
                <i class="i-hugeicons:arrow-up-right-01" aria-hidden="true" />
              </button>
            </footer>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.upload-backdrop {
  position: fixed;
  z-index: 80;
  inset: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 1rem;
  background: rgb(17 17 15 / 54%);
  backdrop-filter: blur(8px);
}
.upload-dialog {
  width: min(100%, 70rem);
  max-height: calc(100dvh - 2rem);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 0.9rem;
  background: #e9e9e5;
  color: #11110f;
  box-shadow: 0 2rem 6rem rgb(17 17 15 / 28%);
  animation: upload-dialog-in 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dark .upload-dialog {
  background: #181816;
  color: #e9e9e5;
}
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 550;
  letter-spacing: -0.05em;
}
.dialog-header p {
  margin: 0.45rem 0 0;
  font-size: 0.63rem;
  opacity: 0.46;
}
.dialog-close {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.dialog-layout {
  display: grid;
  grid-template-columns: minmax(19rem, 0.78fr) minmax(27rem, 1.22fr);
  height: min(42rem, calc(100dvh - 8rem));
  min-height: min(30rem, calc(100dvh - 8rem));
  overflow: hidden;
}
.media-column {
  display: grid;
  align-content: start;
  min-height: 0;
  overflow-y: auto;
  gap: 0.8rem;
  padding: 1.25rem;
  border-right: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
.drop-zone {
  position: relative;
  display: grid;
  overflow: hidden;
  border: 1px dashed color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 0.65rem;
  background: color-mix(in srgb, currentColor 5%, transparent);
  transition: background 180ms ease;
}
.drop-zone:not(.drop-zone--ready) {
  min-height: 21rem;
}
.drop-zone--active {
  background: color-mix(in srgb, currentColor 11%, transparent);
}
.drop-zone > img,
.drop-zone > video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.drop-zone:not(.drop-zone--ready) > img,
.drop-zone:not(.drop-zone--ready) > video {
  min-height: 21rem;
}
.drop-zone > button {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.55rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.drop-zone > button i {
  margin-bottom: 0.55rem;
  font-size: 1.9rem;
  opacity: 0.48;
}
.drop-zone > button strong {
  font-size: 0.78rem;
  font-weight: 500;
}
.drop-zone > button small {
  font-size: 0.57rem;
  opacity: 0.42;
}
.file-bar {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: color-mix(in srgb, #11110f 78%, transparent);
  color: #f2f2ee;
  backdrop-filter: blur(12px);
}
.file-bar > div {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}
.file-bar strong {
  overflow: hidden;
  font-size: 0.64rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-bar span {
  font-size: 0.55rem;
  opacity: 0.56;
}
.file-bar button {
  display: grid;
  flex: none;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 1px solid rgb(242 242 238 / 28%);
  border-radius: 0.42rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.analysis-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.8rem 0;
  border-block: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
.analysis-summary div,
.readout-grid div,
.resource-status div {
  display: grid;
  gap: 0.28rem;
  min-width: 0;
}
.analysis-summary span,
.readout-grid span,
.resource-status span {
  font-size: 0.53rem;
  opacity: 0.42;
}
.analysis-summary strong,
.readout-grid strong,
.resource-status strong {
  overflow: hidden;
  font-size: 0.58rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.analysis-summary strong.is-ready {
  color: #46775a;
}
.dark .analysis-summary strong.is-ready {
  color: #8ac19a;
}
.form-error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  color: #a13d32;
  font-size: 0.61rem;
  line-height: 1.45;
}
.form-column {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.panel-tabs {
  position: sticky;
  z-index: 2;
  display: flex;
  gap: 0.15rem;
  top: 0;
  padding: 0.75rem 1.25rem 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 11%, transparent);
  background: #e9e9e5;
}
.dark .panel-tabs {
  background: #181816;
}
.panel-tabs button {
  position: relative;
  padding: 0.6rem 0.65rem 0.72rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.62rem;
  opacity: 0.48;
}
.panel-tabs button.is-active {
  opacity: 1;
}
.panel-tabs button.is-active::after {
  position: absolute;
  right: 0.65rem;
  bottom: -1px;
  left: 0.65rem;
  height: 2px;
  background: currentColor;
  content: '';
}
.panel-content {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 0;
  overflow: hidden;
}
.info-panel {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.35rem 1.25rem;
}
.panel-title {
  margin-bottom: 1.35rem;
}
.panel-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 550;
  letter-spacing: -0.03em;
}
.field {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.field > span {
  font-size: 0.6rem;
  opacity: 0.57;
}
.field > small {
  font-size: 0.55rem;
  line-height: 1.45;
  opacity: 0.4;
}
.field input {
  width: 100%;
  min-height: 2.25rem;
  padding: 0 0.65rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.45rem;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.64rem;
  box-sizing: border-box;
}
.field input:focus {
  border-color: color-mix(in srgb, currentColor 55%, transparent);
}
.switch-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-block: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
.switch-field > span {
  display: grid;
  gap: 0.27rem;
}
.switch-field strong {
  font-size: 0.64rem;
  font-weight: 500;
}
.switch-field small {
  font-size: 0.55rem;
  opacity: 0.42;
}
.switch-field input {
  width: 1rem;
  height: 1rem;
  margin: 0;
  accent-color: currentColor;
}
.resource-status,
.readout-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1.35rem;
}
.readout-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0 0 1.4rem;
  padding-bottom: 1.15rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
.exif-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.15rem 0.8rem;
}
.exif-fields .field {
  margin-bottom: 0.85rem;
}
.field--wide {
  grid-column: 1 / -1;
}
.panel-note {
  margin: 1rem 0;
  padding: 0.8rem;
  border-radius: 0.45rem;
  background: color-mix(in srgb, currentColor 5%, transparent);
  font-size: 0.6rem;
  line-height: 1.55;
  opacity: 0.56;
}
.dialog-actions {
  position: sticky;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  bottom: 0;
  flex: none;
  min-height: 4.1rem;
  gap: 0.55rem;
  padding: 0.65rem 1.25rem 0.75rem;
  border-top: 1px solid color-mix(in srgb, currentColor 11%, transparent);
  background: #e9e9e5;
  box-sizing: border-box;
}
.dark .dialog-actions {
  background: #181816;
}
.secondary-button,
.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.55rem;
  padding: 0 0.9rem;
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  border-radius: 0.46rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.63rem;
}
.primary-button {
  min-width: 10rem;
  border-color: #11110f;
  background: #11110f;
  color: #f2f2ee;
}
.dark .primary-button {
  border-color: #e9e9e5;
  background: #e9e9e5;
  color: #11110f;
}
.secondary-button:disabled,
.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.36;
}
.primary-button:active:not(:disabled),
.secondary-button:active:not(:disabled) {
  transform: translateY(1px);
}
@keyframes upload-dialog-in {
  from {
    opacity: 0;
    transform: translateY(0.65rem) scale(0.99);
  }
}
@media (max-width: 799.9px) {
  .upload-backdrop {
    place-items: start center;
    padding: 0;
  }
  .upload-dialog {
    width: 100%;
    min-height: 100dvh;
    max-height: none;
    overflow: visible;
    border: 0;
    border-radius: 0;
  }
  .dialog-layout {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
    max-height: none;
    overflow: visible;
  }
  .media-column {
    border-right: 0;
  }
  .drop-zone:not(.drop-zone--ready),
  .drop-zone:not(.drop-zone--ready) > img,
  .drop-zone:not(.drop-zone--ready) > video {
    min-height: 16rem;
  }
  .form-column {
    display: block;
    overflow: visible;
  }
  .panel-content {
    display: block;
  }
  .info-panel {
    overflow: visible;
  }
}
@media (max-width: 479.9px) {
  .dialog-header,
  .media-column,
  .info-panel,
  .dialog-actions {
    padding-inline: 1rem;
  }
  .dialog-header h2 {
    font-size: 1.3rem;
  }
  .analysis-summary,
  .resource-status,
  .readout-grid,
  .exif-fields {
    grid-template-columns: 1fr 1fr;
  }
  .secondary-button,
  .primary-button {
    flex: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .upload-dialog,
  .drop-zone {
    animation: none;
    transition: none;
  }
}
</style>
