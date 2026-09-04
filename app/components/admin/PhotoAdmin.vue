<script setup lang="ts">
import type { Photo } from '~/types'
import PhotoEditor from './PhotoEditor.vue'
import PhotoLibrary from './PhotoLibrary.vue'
import PhotoUploadForm from './PhotoUploadForm.vue'

const selectedPhoto = ref<Photo | null>(null)
const deleteTarget = ref<Photo | null>(null)
const uploadForm = useTemplateRef<InstanceType<typeof PhotoUploadForm>>('uploadForm')
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
  loadPhotos,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
} = useAdminPhotos()

async function handleUpload(payload: Parameters<typeof uploadPhoto>[0]) {
  try {
    await uploadPhoto(payload)
    uploadForm.value?.reset()
  } catch {
    // The composable exposes the contextual error below the workspace header.
  }
}

async function handleSave(update: Pick<Photo, 'filename' | 'private' | 'exif'>) {
  if (!selectedPhoto.value) return
  try {
    await updatePhoto(selectedPhoto.value.id, update)
    selectedPhoto.value = null
  } catch {
    // Keep the editor open so the user can retry.
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deletePhoto(deleteTarget.value.id)
    deleteTarget.value = null
  } catch {
    // Keep the confirmation visible so the error is not lost.
  }
}

watch([search, visibility], () => {
  const timeout = window.setTimeout(() => loadPhotos(1).catch(() => undefined), 250)
  onWatcherCleanup(() => window.clearTimeout(timeout))
})

onMounted(() => loadPhotos(1))
</script>

<template>
  <div class="admin-workspace">
    <header class="workspace-header">
      <div>
        <span>MEDIA OPERATIONS</span>
        <h1>Archive control.</h1>
      </div>
      <div class="workspace-status">
        <span><i aria-hidden="true" /> D1 + R2 已连接</span>
        <NuxtLink to="/admin">私密首页</NuxtLink>
      </div>
    </header>

    <p v-if="error" class="workspace-error" role="alert">
      <i class="i-hugeicons:alert-02" aria-hidden="true" /> {{ error }}
    </p>

    <PhotoUploadForm ref="uploadForm" :busy="mutating" @submit="handleUpload" />
    <PhotoLibrary
      v-model:search="search"
      v-model:visibility="visibility"
      :photos="photos"
      :loading="loading"
      :total="total"
      :page="page"
      :total-pages="totalPages"
      @edit="selectedPhoto = $event"
      @delete="deleteTarget = $event"
      @page="loadPhotos"
    />
  </div>

  <PhotoEditor
    v-if="selectedPhoto"
    :photo="selectedPhoto"
    :busy="mutating"
    @close="selectedPhoto = null"
    @save="handleSave"
  />

  <div
    v-if="deleteTarget"
    class="confirm-backdrop"
    role="presentation"
    @click.self="deleteTarget = null"
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
        <button type="button" @click="deleteTarget = null">取消</button>
        <button type="button" :disabled="mutating" @click="confirmDelete">
          {{ mutating ? '删除中' : '确认删除' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-workspace {
  width: min(calc(100% - 3rem), 76rem);
  margin: 0 auto;
  padding: 7rem 0 5rem;
}
.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 2rem;
  padding-bottom: 3.5rem;
}
.workspace-header > div:first-child > span {
  display: block;
  margin-bottom: 1.25rem;
  font-size: 0.62rem;
  letter-spacing: 0.13em;
  opacity: 0.42;
}
.workspace-header h1 {
  margin: 0;
  font-size: clamp(3rem, 7vw, 6.5rem);
  font-weight: 500;
  line-height: 0.88;
  letter-spacing: -0.075em;
}
.workspace-status {
  display: flex;
  align-items: center;
  gap: 1rem;
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
    padding: 5.5rem 0 4rem;
  }
  .workspace-header {
    align-items: flex-start;
    flex-direction: column;
    padding-bottom: 2.5rem;
  }
  .workspace-header h1 {
    font-size: clamp(3.5rem, 17vw, 5rem);
  }
}
</style>
