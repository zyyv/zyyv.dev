<script lang="ts" setup>
import type { PostPreview } from '~/types'

const props = defineProps<{
  posts: PostPreview[]
}>()

const tags = ref(new Set<string>())

onMounted(() => {
  const query = new URLSearchParams(window.location.search)
  tags.value = new Set(query.get('tags')?.split(',').filter(Boolean) ?? [])
})

function syncUrl() {
  const query = tags.value.size ? `?tags=${Array.from(tags.value).join(',')}` : ''
  history.replaceState(null, '', `/posts${query}`)
}

function toggleTag(tag: string) {
  const next = new Set(tags.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  tags.value = next
  syncUrl()
}

function isDimmed(post: PostPreview) {
  return tags.value.size > 0 && post.tags.every((tag) => !tags.value.has(tag))
}

const sortedPosts = computed(() => {
  if (tags.value.size === 0) return props.posts

  return [...props.posts].sort((a, b) => Number(isDimmed(a)) - Number(isDimmed(b)))
})
</script>

<template>
  <section class="posts-index" aria-labelledby="posts-title">
    <PageHeader
      title="Posts"
      eyebrow="Notes / archive"
      description="Notes on front-end tooling, open source, and the details discovered along the way."
    />

    <ul class="posts-index__list">
      <li
        v-for="(post, index) in sortedPosts"
        :key="post.id"
        class="post-row"
        :class="{ 'post-row--dimmed': isDimmed(post) }"
      >
        <span class="post-row__number" aria-hidden="true">
          {{ String(index + 1).padStart(2, '0') }}
        </span>

        <div class="post-row__content">
          <NuxtLink :to="post.path" class="post-row__link">
            <h2>{{ post.title }}</h2>
            <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
          </NuxtLink>
          <p>{{ post.description }}</p>

          <div class="post-row__footer">
            <div class="post-row__tags" aria-label="Filter by tag">
              <button
                v-for="tag in post.tags"
                :key="tag"
                type="button"
                :class="{ 'is-active': tags.has(tag) }"
                :aria-pressed="tags.has(tag)"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>

            <p class="post-row__meta">
              <time :datetime="new Date(post.date).toISOString()">
                {{ useDateFormat(post.date, 'MMM DD, YYYY', { locales: 'en-US' }) }}
              </time>
              <span aria-hidden="true">·</span>
              <span>{{ post.readingMinutes }} min read</span>
            </p>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.posts-index__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-row {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: clamp(0.75rem, 2vw, 1.5rem);
  padding: clamp(2rem, 4vw, 3rem) 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  transition: opacity 240ms ease;
}

.post-row--dimmed {
  opacity: 0.28;
}

.post-row__number {
  padding-top: 0.38rem;
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.38;
}

.post-row__link {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  color: inherit;
  text-decoration: none;
}

.post-row__link h2 {
  max-width: 23ch;
  margin: 0;
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.post-row__link i {
  flex: 0 0 auto;
  margin-top: 0.22rem;
  font-size: 1rem;
  opacity: 0;
  transform: translate(-0.35rem, 0.35rem);
  transition:
    opacity 220ms ease,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.post-row__link:hover i,
.post-row__link:focus-visible i {
  opacity: 0.72;
  transform: translate(0, 0);
}

.post-row__link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.4rem;
}

.post-row__content > p {
  max-width: 55ch;
  margin: 0.9rem 0 0;
  font-size: 0.84rem;
  line-height: 1.65;
  opacity: 0.55;
  text-wrap: pretty;
}

.post-row__footer {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem 2rem;
  margin-top: 1.6rem;
}

.post-row__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.post-row__tags button {
  padding: 0.22rem 0.48rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.2rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.62rem;
  line-height: 1.2;
  cursor: pointer;
  opacity: 0.56;
  transition:
    background-color 200ms ease,
    border-color 200ms ease,
    opacity 200ms ease;
}

.post-row__tags button:hover,
.post-row__tags button:focus-visible,
.post-row__tags button.is-active {
  border-color: color-mix(in srgb, currentColor 40%, transparent);
  background: color-mix(in srgb, currentColor 7%, transparent);
  opacity: 1;
}

.post-row__tags button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.2rem;
}

.post-row__meta {
  display: flex;
  flex: 0 0 auto;
  gap: 0.45rem;
  margin: 0;
  font-size: 0.64rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.42;
}

@media (max-width: 639.9px) {
  .post-row {
    grid-template-columns: 1.4rem minmax(0, 1fr);
  }

  .post-row__footer {
    display: grid;
  }

  .post-row__meta {
    order: -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-row,
  .post-row__link i,
  .post-row__tags button {
    transition: none;
  }
}
</style>
