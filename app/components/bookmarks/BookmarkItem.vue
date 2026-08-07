<script setup lang="ts">
import type { BookmarkNode } from '~/utils/bookmarks'
import { bookmarkHost } from '~/utils/bookmarks'

const props = withDefaults(
  defineProps<{
    item: BookmarkNode
    isAdmin?: boolean
    compact?: boolean
  }>(),
  { isAdmin: false, compact: false },
)

const emit = defineEmits<{
  edit: [item: BookmarkNode]
  delete: [item: BookmarkNode]
}>()

const host = computed(() => bookmarkHost(props.item.url))
</script>

<template>
  <article class="bookmark-item" :class="{ 'bookmark-item--compact': compact }">
    <a
      class="bookmark-item__link"
      :href="item.url || undefined"
      target="_blank"
      rel="noreferrer"
      :aria-label="`${item.title}，在新标签页打开`"
    >
      <span class="bookmark-item__icon">
        <img v-if="item.iconUrl" :src="item.iconUrl" alt="" loading="lazy" />
        <i v-else class="i-hugeicons:link-02" aria-hidden="true" />
      </span>
      <span class="bookmark-item__copy">
        <strong>{{ item.title }}</strong>
        <span>{{ item.description || host }}</span>
      </span>
      <i class="bookmark-item__arrow i-hugeicons:arrow-up-right-01" aria-hidden="true" />
    </a>

    <div v-if="item.tags.length && !compact" class="bookmark-item__tags" aria-label="标签">
      <span v-for="tag in item.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
    </div>

    <span v-if="isAdmin && item.private" class="bookmark-item__private" title="仅维护者可见">
      <i class="i-hugeicons:square-lock-02" aria-hidden="true" />
      <span>私密</span>
    </span>

    <div v-if="isAdmin" class="bookmark-item__actions">
      <button type="button" :aria-label="`编辑 ${item.title}`" @click="emit('edit', item)">
        <i class="i-hugeicons:edit-02" aria-hidden="true" />
      </button>
      <button type="button" :aria-label="`删除 ${item.title}`" @click="emit('delete', item)">
        <i class="i-hugeicons:delete-02" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.bookmark-item {
  position: relative;
  min-width: 0;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 0.8rem;
  background: color-mix(in srgb, currentColor 2.5%, transparent);
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    background-color 180ms ease;
}
.bookmark-item:hover {
  border-color: color-mix(in srgb, currentColor 28%, transparent);
  background: color-mix(in srgb, currentColor 5%, transparent);
  transform: translateY(-2px);
}
.bookmark-item__link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  min-height: 5rem;
  padding: 1rem;
  color: inherit;
  text-decoration: none;
}
.bookmark-item__icon {
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border-radius: 0.55rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
}
.bookmark-item__icon img {
  width: 1.2rem;
  height: 1.2rem;
  object-fit: contain;
}
.bookmark-item__icon i {
  font-size: 1rem;
  opacity: 0.5;
}
.bookmark-item__copy {
  min-width: 0;
}
.bookmark-item__copy strong,
.bookmark-item__copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bookmark-item__copy strong {
  font-size: 0.78rem;
  font-weight: 550;
  letter-spacing: -0.015em;
}
.bookmark-item__copy span {
  margin-top: 0.28rem;
  font-size: 0.64rem;
  opacity: 0.46;
}
.bookmark-item__arrow {
  font-size: 0.9rem;
  opacity: 0.3;
}
.bookmark-item__tags {
  display: flex;
  gap: 0.35rem;
  padding: 0 1rem 0.85rem 3.9rem;
}
.bookmark-item__tags span {
  overflow: hidden;
  max-width: 8rem;
  padding: 0.18rem 0.4rem;
  border-radius: 0.32rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  font-size: 0.55rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.6;
}
.bookmark-item__private {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.38rem;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 0.35rem;
  background: color-mix(in srgb, currentColor 7%, transparent);
  font-size: 0.53rem;
  opacity: 0.62;
}
.bookmark-item__actions {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  display: flex;
  gap: 0.2rem;
  opacity: 0;
  transition: opacity 160ms ease;
}
.bookmark-item:hover .bookmark-item__actions,
.bookmark-item:focus-within .bookmark-item__actions {
  opacity: 1;
}
.bookmark-item__actions button {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 0.45rem;
  place-items: center;
  background: #e9e9e5;
  color: #11110f;
  cursor: pointer;
}
.dark .bookmark-item__actions button {
  background: #181816;
  color: #e9e9e5;
}
.bookmark-item--compact {
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
}
.bookmark-item--compact:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
  transform: none;
}
.bookmark-item--compact .bookmark-item__link {
  min-height: 2.75rem;
  padding: 0.45rem 0.55rem;
}
.bookmark-item--compact .bookmark-item__icon {
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 0.4rem;
}
.bookmark-item--compact .bookmark-item__private {
  top: 0.5rem;
  right: 2.25rem;
  padding: 0.18rem;
}
.bookmark-item--compact .bookmark-item__private span {
  display: none;
}
@media (hover: none) {
  .bookmark-item__actions {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bookmark-item {
    transition: none;
  }
}
</style>
