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
    <span class="bookmark-item__index" aria-hidden="true" />
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
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) minmax(7rem, 0.26fr);
  min-width: 0;
  align-items: center;
  counter-increment: bookmark;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}
.bookmark-item:hover {
  background: color-mix(in srgb, currentColor 5%, transparent);
}
.bookmark-item__index {
  display: grid;
  height: 100%;
  place-items: center;
  font:
    0.5rem ui-monospace,
    monospace;
  opacity: 0.32;
}
.bookmark-item__index::before {
  content: counter(bookmark, decimal-leading-zero);
}
.bookmark-item__link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.45rem;
  padding: 0.6rem 0.5rem;
  color: inherit;
  text-decoration: none;
}
.bookmark-item__icon {
  display: grid;
  width: 1.35rem;
  height: 1.35rem;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
}
.bookmark-item__icon img {
  width: 0.9rem;
  height: 0.9rem;
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
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}
.bookmark-item__copy span {
  margin-top: 0.22rem;
  font:
    0.55rem ui-monospace,
    monospace;
  opacity: 0.46;
}
.bookmark-item__arrow {
  font-size: 0.78rem;
  opacity: 0;
  transform: translate(-0.2rem, 0.2rem);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.bookmark-item:hover .bookmark-item__arrow,
.bookmark-item:focus-within .bookmark-item__arrow {
  opacity: 0.55;
  transform: translate(0, 0);
}
.bookmark-item__tags {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
  align-self: stretch;
  padding: 0 0.5rem;
}
.bookmark-item__tags span {
  overflow: hidden;
  max-width: 6rem;
  padding: 0;
  font:
    0.5rem ui-monospace,
    monospace;
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
  padding: 0;
  background: transparent;
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
  display: block;
  border: 0;
  background: transparent;
}
.bookmark-item--compact:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.bookmark-item--compact .bookmark-item__link {
  min-height: 2.75rem;
  padding: 0.45rem 0.55rem;
}
.bookmark-item--compact .bookmark-item__index {
  display: none;
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
@media (max-width: 760px) {
  .bookmark-item {
    grid-template-columns: 2.2rem minmax(0, 1fr);
  }
  .bookmark-item__link {
    min-height: 3.75rem;
    padding-inline: 0.65rem;
  }
  .bookmark-item__tags {
    display: none;
  }
  .bookmark-item__actions {
    right: 0.25rem;
    bottom: 0.25rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bookmark-item {
    transition: none;
  }
}
</style>
