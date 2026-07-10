<script setup lang="ts">
import type { Repo } from '~/types'
import { getLangIcon } from '~/utils/icon'

const repoGroups = shallowRef<Record<string, Repo[]>>({})
const status = shallowRef<'pending' | 'success' | 'error'>('pending')
const errorMessage = shallowRef('Failed to load repositories.')
let requestController: AbortController | undefined

const featuredRepos = computed(() => {
  const seen = new Set<number>()

  return Object.values(repoGroups.value)
    .flat()
    .filter((repo) => {
      if (seen.has(repo.id)) return false
      seen.add(repo.id)
      return true
    })
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3)
})

async function loadRepos() {
  requestController?.abort()
  requestController = new AbortController()
  status.value = 'pending'

  try {
    const response = await fetch('/api/repos', { signal: requestController.signal })
    if (!response.ok) throw new Error('Failed to load repositories.')

    repoGroups.value = (await response.json()) as Record<string, Repo[]>
    status.value = featuredRepos.value.length ? 'success' : 'error'
    if (!featuredRepos.value.length) errorMessage.value = 'No projects available.'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    console.error(error)
    errorMessage.value = 'Failed to load repositories.'
    status.value = 'error'
  }
}

onMounted(loadRepos)

onBeforeUnmount(() => {
  requestController?.abort()
})
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="projects-grid" aria-label="Loading projects">
      <div v-for="item in 3" :key="item" class="project-skeleton animate-pulse" />
    </div>

    <div v-else-if="status === 'success'" class="projects-grid">
      <article v-for="repo in featuredRepos" :key="repo.id" class="project-card group">
        <a
          :href="repo.homepage || repo.html_url"
          target="_blank"
          rel="noreferrer"
          class="flex size-full min-h-0 flex-col color-inherit no-underline focus-visible:(outline-2 outline-current outline-offset--4)"
        >
          <div class="mb-auto flex items-start justify-between gap-6">
            <div class="min-w-0">
              <i
                class="i-hugeicons:repository mb-[clamp(1.5rem,4vw,3.5rem)] text-[clamp(1.5rem,3vw,2.25rem)] op-38 transition-[opacity,transform] duration-300 group-hover:(-rotate-4 op-72) motion-reduce:transition-none"
                aria-hidden="true"
              />
              <h3
                class="m-0 break-words text-[clamp(1.25rem,2.4vw,2rem)] leading-[1.05] font-600 tracking-[-0.04em]"
              >
                {{ repo.name }}
              </h3>
            </div>
            <i
              class="i-hugeicons:arrow-up-right-02 flex-none op-30 transition-[opacity,transform] duration-300 group-hover:(translate-x-0.5 -translate-y-0.5 op-80) motion-reduce:transition-none"
              aria-hidden="true"
            />
          </div>

          <p class="mb-0 mt-5 max-w-46ch text-sm leading-6 op-58">
            {{ repo.description }}
          </p>

          <div class="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.75rem] op-52">
            <span v-if="repo.language" class="inline-flex items-center gap-1.5">
              <i :class="getLangIcon(repo.language)" aria-hidden="true" />
              {{ repo.language }}
            </span>
            <span v-if="repo.stargazers_count" class="inline-flex items-center gap-1.5">
              <i class="i-hugeicons:star" aria-hidden="true" />
              {{ repo.stargazers_count.toLocaleString() }}
            </span>
            <span v-if="repo.forks_count" class="inline-flex items-center gap-1.5">
              <i class="i-hugeicons:git-fork" aria-hidden="true" />
              {{ repo.forks_count.toLocaleString() }}
            </span>
          </div>
        </a>
      </article>
    </div>

    <div
      v-else
      class="grid min-h-72 place-items-center rounded-[0.9rem] [background-color:color-mix(in_srgb,currentColor_4%,transparent)]"
    >
      <div class="text-center">
        <i class="i-hugeicons:cloud-not-found mb-3 text-3xl op-42" aria-hidden="true" />
        <p class="m-0 text-sm op-56">{{ errorMessage }}</p>
        <button
          type="button"
          class="mt-5 cursor-pointer border rounded-[0.8rem] bg-transparent px-4 py-2 color-inherit text-xs transition-[background-color,transform] hover:[background-color:color-mix(in_srgb,currentColor_8%,transparent)] active:scale-98 focus-visible:(outline-2 outline-current outline-offset-3) motion-reduce:transition-none [border-color:color-mix(in_srgb,currentColor_20%,transparent)]"
          @click="loadRepos"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  grid-template-rows: repeat(2, minmax(12rem, 1fr));
  gap: 0.75rem;
  min-height: 34rem;
}

.project-card,
.project-skeleton {
  min-width: 0;
  border-radius: 0.9rem;
}

.project-card {
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border: 1px solid color-mix(in srgb, currentColor 11%, transparent);
  background-color: color-mix(in srgb, currentColor 3.5%, transparent);
  transition:
    background-color 300ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 300ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover {
  border-color: color-mix(in srgb, currentColor 24%, transparent);
  background-color: color-mix(in srgb, currentColor 7%, transparent);
  transform: translateY(-0.2rem);
}

.project-card:first-child,
.project-skeleton:first-child {
  grid-row: span 2;
}

.project-skeleton {
  background: linear-gradient(
    105deg,
    color-mix(in srgb, currentColor 4%, transparent) 30%,
    color-mix(in srgb, currentColor 9%, transparent) 48%,
    color-mix(in srgb, currentColor 4%, transparent) 66%
  );
  background-size: 220% 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .project-skeleton {
    animation: project-shimmer 1.8s linear infinite;
  }
}

@keyframes project-shimmer {
  to {
    background-position-x: -220%;
  }
}

@media (max-width: 767.9px) {
  .projects-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    min-height: 0;
  }

  .project-card:first-child,
  .project-skeleton:first-child {
    grid-row: auto;
  }

  .project-card,
  .project-skeleton {
    min-height: 15rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    transition: none;
  }
}
</style>
