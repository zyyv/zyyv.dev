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

    <ul
      class="m-0 grid grid-cols-1 gap-y-[clamp(2.5rem,5vw,4rem)] p-0 rule-1 rule-solid rule-current/10 rule-break-intersection rule-visibility-between mb-[clamp(2.75rem,6vw,4.5rem)]"
    >
      <li
        v-for="(post, index) in sortedPosts"
        :key="post.id"
        class="grid grid-cols-[1.4rem_minmax(0,1fr)] gap-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.25rem,1vw,0.75rem)] transition-opacity duration-240 ease md:grid-cols-[2rem_minmax(0,1fr)] motion-reduce:transition-none"
        :class="{ 'op-28': isDimmed(post) }"
      >
        <span
          class="pt-[0.38rem] text-[0.62rem] op-38 [font-variant-numeric:tabular-nums]"
          aria-hidden="true"
        >
          {{ String(index + 1).padStart(2, '0') }}
        </span>

        <div>
          <NuxtLink
            :to="post.path"
            class="group flex items-start justify-between gap-4 color-inherit no-underline"
          >
            <h2
              class="m-0 max-w-23ch text-[clamp(1.35rem,3vw,2rem)] font-500 leading-[1.08] tracking-[-0.04em] [text-wrap:balance]"
            >
              {{ post.title }}
            </h2>
            <i
              class="i-hugeicons:arrow-up-right-02 mt-[0.22rem] flex-none translate-x-[-0.35rem] translate-y-[0.35rem] text-base op-0 transition-[opacity,transform] duration-280 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:(translate-x-0 translate-y-0 op-72) motion-reduce:transition-none"
              aria-hidden="true"
            />
          </NuxtLink>
          <p class="mb-0 mt-3.5 max-w-55ch text-[0.84rem] leading-[1.65] op-55 [text-wrap:pretty]">
            {{ post.description }}
          </p>

          <div class="mt-6 grid items-end gap-x-8 gap-y-4 sm:flex sm:justify-between">
            <div class="flex flex-wrap gap-[0.45rem]" aria-label="Filter by tag">
              <button
                v-for="tag in post.tags"
                :key="tag"
                type="button"
                class="cursor-pointer border rounded-full bg-transparent px-[0.48rem] py-[0.22rem] color-inherit text-0.62rem leading-normal op-56 border-color-[color-mix(in_srgb,currentColor_16%,transparent)] font-inherit transition-[background-color,border-color,opacity] duration-200 hover:(op-100 [border-color:color-mix(in_srgb,currentColor_5%,transparent)] [background-color:color-mix(in_srgb,currentColor_2%,transparent)]) motion-reduce:transition-none"
                :class="{
                  'op-100 [border-color:color-mix(in_srgb,currentColor_4%,transparent)] [background-color:color-mix(in_srgb,currentColor_4%,transparent)]':
                    tags.has(tag),
                }"
                :aria-pressed="tags.has(tag)"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>

            <p
              class="order-[-1] m-0 flex flex-none gap-[0.45rem] text-[0.64rem] op-42 [font-variant-numeric:tabular-nums] sm:order-none"
            >
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
