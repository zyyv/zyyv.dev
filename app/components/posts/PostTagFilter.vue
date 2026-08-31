<script setup lang="ts">
interface Props {
  tags: string[]
  selectedTags: string[]
}

interface Emits {
  toggle: [tag: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = shallowRef('')
const selectedTagSet = computed(() => new Set(props.selectedTags))

function fuzzyMatch(value: string, query: string) {
  const normalizedValue = value.toLocaleLowerCase().replaceAll(/\s+/gu, '')
  const normalizedQuery = query.toLocaleLowerCase().replaceAll(/\s+/gu, '')

  let queryIndex = 0
  for (const character of normalizedValue) {
    if (character === normalizedQuery[queryIndex]) queryIndex += 1
  }

  return queryIndex === normalizedQuery.length
}

function getTagTone(tag: string) {
  const hash = Array.from(tag).reduce((total, character) => total + character.codePointAt(0)!, 0)
  return hash % 7
}

const visibleTags = computed(() =>
  props.tags
    .filter((tag) => fuzzyMatch(tag, searchQuery.value))
    .map((tag) => ({ name: tag, tone: getTagTone(tag) })),
)
</script>

<template>
  <section class="tag-filter" aria-label="Filter posts by tag">
    <div class="tag-filter__controls">
      <label class="tag-filter__search">
        <span class="sr-only">Search tags</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search here..."
          autocomplete="off"
        />
      </label>

      <button
        v-for="tag in visibleTags"
        :key="tag.name"
        type="button"
        class="tag-filter__tag"
        :class="[
          `tag-filter__tag--tone-${tag.tone}`,
          { 'tag-filter__tag--active': selectedTagSet.has(tag.name) },
        ]"
        :aria-pressed="selectedTagSet.has(tag.name)"
        @click="emit('toggle', tag.name)"
      >
        <span class="tag-filter__dot" aria-hidden="true" />
        <span>{{ tag.name }}</span>
      </button>

      <p v-if="visibleTags.length === 0" class="tag-filter__empty">No matching tags</p>
    </div>
  </section>
</template>

<style scoped>
.tag-filter {
  margin: 0 0 clamp(3rem, 6vw, 4.5rem);
}

.tag-filter__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-filter__search {
  width: min(18rem, 100%);
}

.tag-filter__search input,
.tag-filter__tag {
  min-height: 2.75rem;
  border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.tag-filter__search input {
  width: 100%;
  height: 2.75rem;
  padding: 0 0.85rem;
  outline: none;
  font-size: 0.82rem;
}

.tag-filter__search input::placeholder {
  color: currentColor;
  opacity: 0.42;
}

.tag-filter__search input:focus,
.tag-filter__search input:active {
  border-color: color-mix(in srgb, currentColor 18%, transparent);
  outline: none;
}

.tag-filter__tag {
  --tag-color: #8b5cf6;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 0.55rem;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.58;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.tag-filter__tag:hover,
.tag-filter__tag--active {
  border-color: color-mix(in srgb, currentColor 48%, transparent);
  opacity: 1;
}

.tag-filter__tag--active {
  background:
    linear-gradient(currentColor, currentColor) left top / 0.35rem 1px no-repeat,
    linear-gradient(currentColor, currentColor) left top / 1px 0.35rem no-repeat,
    linear-gradient(currentColor, currentColor) right top / 0.35rem 1px no-repeat,
    linear-gradient(currentColor, currentColor) right top / 1px 0.35rem no-repeat,
    linear-gradient(currentColor, currentColor) left bottom / 0.35rem 1px no-repeat,
    linear-gradient(currentColor, currentColor) left bottom / 1px 0.35rem no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 0.35rem 1px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 1px 0.35rem no-repeat,
    linear-gradient(
      color-mix(in srgb, currentColor 6%, transparent),
      color-mix(in srgb, currentColor 6%, transparent)
    );
  background-origin: border-box;
}

.tag-filter__tag:active {
  transform: translateY(1px);
}

.tag-filter__tag:focus-visible {
  border-color: currentColor;
  outline: none;
}

.tag-filter__dot {
  width: 0.4rem;
  height: 0.4rem;
  flex: none;
  border-radius: 50%;
  background: var(--tag-color);
}

.tag-filter__tag--tone-1 {
  --tag-color: #ec6eae;
}

.tag-filter__tag--tone-2 {
  --tag-color: #36c9e3;
}

.tag-filter__tag--tone-3 {
  --tag-color: #ff555f;
}

.tag-filter__tag--tone-4 {
  --tag-color: #ff8128;
}

.tag-filter__tag--tone-5 {
  --tag-color: #45d6c2;
}

.tag-filter__tag--tone-6 {
  --tag-color: #99e83f;
}

.tag-filter__empty {
  align-self: center;
  margin: 0;
  padding: 0 0.75rem;
  font-size: 0.76rem;
  opacity: 0.42;
}

@media (max-width: 639.9px) {
  .tag-filter__search {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tag-filter__tag {
    transition: none;
  }
}
</style>
