<script setup lang="ts">
import { play } from 'cuelume'
import type { Photo } from '~/types'
import PhotoLibrary from './PhotoLibrary.vue'
import PhotoUploadForm from './PhotoUploadForm.vue'

const editorPhoto = shallowRef<Photo | null>(null)
const deleteTarget = shallowRef<Photo | null>(null)
const showUpload = shallowRef(false)
const {
  photos,
  loading,
  mutating,
  error,
  page,
  total,
  totalPages,
  search,
  visibility,
  mediaType,
  loadPhotos,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
} = useAdminPhotos()

async function handleUpload(payload: Parameters<typeof uploadPhoto>[0]) {
  try {
    await uploadPhoto(payload)
    play('success')
    closeEditor()
  } catch {
    play('error')
    // The composable exposes the contextual error below the workspace header.
  }
}

async function handleUpdate(update: Parameters<typeof updatePhoto>[1]) {
  if (!editorPhoto.value) return
  try {
    await updatePhoto(editorPhoto.value.id, update)
    play('success')
    closeEditor()
  } catch {
    play('error')
    // Keep the editor open so the user can retry.
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deletePhoto(deleteTarget.value.id)
    play('success')
    deleteTarget.value = null
  } catch {
    play('error')
    // Keep the confirmation visible so the error is not lost.
  }
}

function resetFilters() {
  search.value = ''
  visibility.value = 'all'
  mediaType.value = 'all'
}

function dismissDelete() {
  play('droplet')
  deleteTarget.value = null
}

function closeEditor() {
  showUpload.value = false
  editorPhoto.value = null
}

function openCreate() {
  closeEditor()
  showUpload.value = true
}

watch([search, visibility, mediaType], () => {
  const timeout = window.setTimeout(() => loadPhotos(1).catch(() => undefined), 250)
  onWatcherCleanup(() => window.clearTimeout(timeout))
})

onMounted(() => loadPhotos(1))
</script>

<template>
  <div class="admin-workspace">
    <header class="workspace-header">
      <div class="workspace-brand">
        <span class="brand-mark">ZY / YV</span>
        <span class="brand-label">CONTENT OPERATIONS</span>
      </div>
      <nav class="workspace-nav" aria-label="后台模块">
        <NuxtLink to="/admin/photos" class="is-active" data-cuelume-hover="tick">图片库</NuxtLink>
        <NuxtLink to="/admin/bookmarks" data-cuelume-hover="tick">书签管理</NuxtLink>
      </nav>
      <div class="workspace-status">
        <span><i aria-hidden="true" /> D1 + R2 已连接</span>
        <NuxtLink to="/admin" data-cuelume-hover="tick">后台首页</NuxtLink>
      </div>
    </header>

    <div class="page-heading">
      <div>
        <span>MEDIA OPERATIONS</span>
        <h1>媒体资源</h1>
        <p>管理图片与视频，解析元数据，并在写入前确认 Arthash 预览。</p>
      </div>
      <button type="button" class="create-button" data-cuelume-toggle="pulse" @click="openCreate">
        <i class="i-hugeicons:add-01" aria-hidden="true" /> 新增媒体
      </button>
    </div>

    <p v-if="error" class="workspace-error" role="alert">
      <i class="i-hugeicons:alert-02" aria-hidden="true" /> {{ error }}
    </p>

    <PhotoLibrary
      v-model:search="search"
      v-model:visibility="visibility"
      v-model:media-type="mediaType"
      :photos="photos"
      :loading="loading"
      :total="total"
      :page="page"
      :total-pages="totalPages"
      @edit="editorPhoto = $event"
      @delete="deleteTarget = $event"
      @page="loadPhotos"
      @reset="resetFilters"
    />
  </div>

  <PhotoUploadForm
    v-if="showUpload || editorPhoto"
    :busy="mutating"
    :error="error"
    :photo="editorPhoto"
    @close="closeEditor"
    @submit="handleUpload"
    @update="handleUpdate"
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
      aria-labelledby="delete-title"
    >
      <span>不可撤销</span>
      <h2 id="delete-title">删除 {{ deleteTarget.filename }}？</h2>
      <p>这会同时删除 D1 记录和 R2 中的原始媒体与两档预览资源。</p>
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
  align-items: baseline;
  gap: 0.65rem;
  flex: none;
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
  font-size: 0.62rem;
  opacity: 0.48;
}
.workspace-status span i {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: #568c68;
}
.workspace-status a {
  padding: 0.45rem 0.6rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.45rem;
  background: transparent;
  color: inherit;
  font: inherit;
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
.create-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.55rem;
  padding: 0 0.9rem;
  border: 0;
  border-radius: 0.48rem;
  background: #11110f;
  color: #f2f2ee;
  cursor: pointer;
  font: inherit;
  font-size: 0.63rem;
}
.dark .create-button {
  background: #e9e9e5;
  color: #11110f;
}
.create-button:active {
  transform: translateY(1px);
}
.workspace-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid color-mix(in srgb, #a13d32 30%, transparent);
  border-radius: 0.6rem;
  color: #a13d32;
  font-size: 0.68rem;
}
.confirm-backdrop {
  position: fixed;
  z-index: 70;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(17 17 15 / 48%);
  backdrop-filter: blur(6px);
}
.confirm-dialog {
  width: min(100%, 27rem);
  padding: 1.5rem;
  border-radius: 0.8rem;
  background: #e9e9e5;
  color: #11110f;
  box-sizing: border-box;
  box-shadow: 0 1.5rem 5rem rgb(17 17 15 / 24%);
}
.dark .confirm-dialog {
  background: #181816;
  color: #e9e9e5;
}
.confirm-dialog > span {
  font-size: 0.6rem;
  color: #a13d32;
}
.confirm-dialog h2 {
  margin: 0.7rem 0;
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: -0.035em;
}
.confirm-dialog p {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.6;
  opacity: 0.5;
}
.confirm-dialog div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 1.5rem;
}
.confirm-dialog button {
  padding: 0.7rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
}
.confirm-dialog button:last-child {
  border-color: #a13d32;
  background: #a13d32;
  color: white;
}
.confirm-dialog button:disabled {
  cursor: not-allowed;
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
    padding-bottom: 0;
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
    gap: 1.25rem;
    padding: 2.4rem 0 1.8rem;
  }
  .page-heading p {
    max-width: 21rem;
  }
  .create-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
