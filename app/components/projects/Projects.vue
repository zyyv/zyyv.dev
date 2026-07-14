<script lang="ts" setup>
import type { Repo } from '~/types'

const data = ref<Record<string, Repo[]> | null>(null)
const status = ref<'pending' | 'success' | 'error'>('pending')
const errorMessage = ref('Failed to load repositories.')

async function fetchRepos(url: string, timeout = 15000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('Failed to load repositories.')

    return (await response.json()) as Record<string, Repo[]>
  } finally {
    window.clearTimeout(timer)
  }
}

onMounted(async () => {
  try {
    data.value = await fetchRepos('/api/repos')
    status.value = Object.values(data.value).some((repos) => repos.length > 0) ? 'success' : 'error'
  } catch (error) {
    console.error(error)
    errorMessage.value =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'Loading repositories timed out.'
        : 'Failed to load repositories.'
    status.value = 'error'
  }
})
</script>

<template>
  <section class="projects" aria-label="Project list" aria-live="polite">
    <ProjectsSkeleton v-if="status === 'pending'" />

    <template v-else-if="status === 'success'">
      <section v-for="(repos, key) in data" :key="key" class="projects__group">
        <header class="projects__group-heading">
          <h2>{{ key }}</h2>
          <span>{{ String(repos.length).padStart(2, '0') }}</span>
        </header>
        <div class="projects__grid">
          <ProjectsRepoCard
            v-for="(repo, index) in repos"
            :key="repo.id"
            :repo="repo"
            :index="index"
          />
        </div>
      </section>
    </template>

    <div v-else class="projects__error" role="status">
      <i i-hugeicons:cloud-server aria-hidden="true" />
      <div>
        <h2>Repositories unavailable</h2>
        <p>{{ errorMessage }} You can still find the latest work on GitHub.</p>
        <a href="https://github.com/zyyv" target="_blank" rel="noreferrer">Open GitHub</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.projects {
  padding: clamp(2.8rem, 6vw, 5rem) 0 clamp(6rem, 12vw, 9rem);
}

.projects__group + .projects__group {
  margin-top: clamp(4.5rem, 9vw, 7.5rem);
}

.projects__group-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.15rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.projects__group-heading h2 {
  margin: 0;
  font-size: clamp(1rem, 1.8vw, 1.25rem);
  font-weight: 520;
  letter-spacing: -0.035em;
}

.projects__group-heading span {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.62rem;
  opacity: 0.4;
}

.projects__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: 0.85rem;
}

.projects__error {
  display: flex;
  max-width: 34rem;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.35rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.8rem;
}

.projects__error > i {
  width: 1.4rem;
  height: 1.4rem;
  flex: 0 0 auto;
  opacity: 0.42;
}

.projects__error h2 {
  margin: 0 0 0.45rem;
  font-size: 0.9rem;
  font-weight: 550;
}

.projects__error p {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  line-height: 1.55;
  opacity: 0.56;
}

.projects__error a {
  color: inherit;
  font-size: 0.72rem;
  text-underline-offset: 0.2rem;
}
</style>
