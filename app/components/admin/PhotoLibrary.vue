<script setup lang="ts">
import type { Photo } from '~/types'

defineProps<{
  photos: readonly Photo[]
  loading: boolean
  total: number
  page: number
  totalPages: number
}>()

const search = defineModel<string>('search', { required: true })
const visibility = defineModel<'all' | 'public' | 'private'>('visibility', { required: true })
const emit = defineEmits<{
  edit: [photo: Photo]
  delete: [photo: Photo]
  page: [page: number]
}>()

function photoDate(photo: Photo) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(photo.createdAt))
}
</script>

<template>
  <section class="library" aria-labelledby="library-title">
    <div class="library-heading">
      <div>
        <span>02</span>
        <h2 id="library-title">图片库</h2>
        <strong>{{ total }}</strong>
      </div>
      <div class="library-tools">
        <label class="search-control">
          <i class="i-hugeicons:search-01" aria-hidden="true" />
          <span class="sr-only">搜索文件名</span>
          <input v-model="search" type="search" placeholder="搜索文件名" />
        </label>
        <select v-model="visibility" aria-label="筛选可见性">
          <option value="all">全部</option>
          <option value="public">公开</option>
          <option value="private">私密</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="photo-grid" aria-label="正在加载图片">
      <div v-for="index in 8" :key="index" class="photo-skeleton" />
    </div>
    <div v-else-if="!photos.length" class="empty-state">
      <i class="i-hugeicons:image-not-found-01" aria-hidden="true" />
      <strong>没有匹配的图片</strong>
      <span>调整搜索条件，或在上方上传第一张图片。</span>
    </div>
    <div v-else class="photo-grid">
      <article v-for="photo in photos" :key="photo.id" class="photo-card">
        <button class="photo-preview" type="button" @click="emit('edit', photo)">
          <img :src="photo.thumbnail" :alt="photo.filename" loading="lazy" />
          <span v-if="photo.private" class="private-badge">
            <i class="i-hugeicons:square-lock-02" aria-hidden="true" /> 私密
          </span>
        </button>
        <div class="photo-meta">
          <button type="button" @click="emit('edit', photo)">
            <strong>{{ photo.filename }}</strong>
            <span>{{ photo.width }} × {{ photo.height }} · {{ photoDate(photo) }}</span>
          </button>
          <button
            class="delete-button"
            type="button"
            :aria-label="`删除 ${photo.filename}`"
            @click="emit('delete', photo)"
          >
            <i class="i-hugeicons:delete-02" aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>

    <nav v-if="totalPages > 1" class="pagination" aria-label="图片分页">
      <button type="button" :disabled="page <= 1" @click="emit('page', page - 1)">
        <i class="i-hugeicons:arrow-left-01" aria-hidden="true" /> 上一页
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button type="button" :disabled="page >= totalPages" @click="emit('page', page + 1)">
        下一页 <i class="i-hugeicons:arrow-right-01" aria-hidden="true" />
      </button>
    </nav>
  </section>
</template>

<style scoped>
.library {
  padding-top: 4rem;
}
.library-heading {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: center;
  margin-bottom: 1.25rem;
}
.library-heading > div:first-child {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}
.library-heading span {
  font-size: 0.67rem;
  opacity: 0.45;
}
.library-heading h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}
.library-heading strong {
  font-size: 0.67rem;
  font-weight: 400;
  opacity: 0.38;
}
.library-tools {
  display: flex;
  gap: 0.5rem;
}
.search-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: min(16rem, 32vw);
  padding: 0.55rem 0.7rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.55rem;
}
.search-control i {
  flex: none;
  opacity: 0.45;
}
.search-control input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.68rem;
}
.search-control input::placeholder {
  color: currentColor;
  opacity: 0.4;
}
.library-tools select {
  padding: 0 1.8rem 0 0.7rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.68rem;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
.photo-card {
  min-width: 0;
}
.photo-preview {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 0.7rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  cursor: pointer;
}
.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}
.photo-preview:hover img {
  transform: scale(1.025);
}
.private-badge {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.45rem;
  border-radius: 0.4rem;
  background: color-mix(in srgb, #11110f 74%, transparent);
  color: #f2f2ee;
  font-size: 0.58rem;
  opacity: 1 !important;
  backdrop-filter: blur(10px);
}
.photo-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.7rem 0.15rem 0;
}
.photo-meta > button:first-child {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.photo-meta strong {
  overflow: hidden;
  font-size: 0.7rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.photo-meta span {
  font-size: 0.58rem;
  opacity: 0.4;
}
.delete-button {
  flex: none;
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0.45rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.38;
}
.delete-button:hover {
  background: color-mix(in srgb, #a13d32 12%, transparent);
  color: #a13d32;
  opacity: 1;
}
.photo-skeleton {
  aspect-ratio: 4 / 3;
  border-radius: 0.7rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  animation: pulse 1.4s ease-in-out infinite alternate;
}
.empty-state {
  display: grid;
  min-height: 18rem;
  place-items: center;
  align-content: center;
  gap: 0.55rem;
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  text-align: center;
}
.empty-state i {
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  opacity: 0.3;
}
.empty-state strong {
  font-size: 0.78rem;
  font-weight: 500;
}
.empty-state span {
  font-size: 0.65rem;
  opacity: 0.42;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 0;
}
.pagination button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.65rem;
}
.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
.pagination > span {
  font-size: 0.62rem;
  opacity: 0.45;
}
@keyframes pulse {
  to {
    opacity: 0.42;
  }
}

@media (max-width: 1023.9px) {
  .photo-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 767.9px) {
  .library {
    padding-top: 3rem;
  }
  .library-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;
  }
  .search-control {
    width: 100%;
    box-sizing: border-box;
  }
  .library-tools {
    display: grid;
    grid-template-columns: 1fr auto;
  }
  .photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
}
@media (max-width: 419.9px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .photo-preview img,
  .photo-skeleton {
    transition: none;
    animation: none;
  }
}
</style>
