<script lang='ts' setup>
import type { Repo } from '~/types'

defineProps<{
  repo: Repo
}>()
</script>

<template>
  <article
    b="~ black op-10"
    dark-b="white op-10"
    rounded-lg
    p-4
    text-xs
    shadow-xs
    trans
    hover="bg-orange bg-op-3"
    dark-hover="bg-purple bg-op-3"
  >
    <a :href="repo.homepage || repo.html_url" target="_blank" decoration-none flex="~ col gap-3" h-full>
      <h5 fsc gap-1 text-0.9375rem>
        <i i-hugeicons:repository :style="{ color: repo.language ? getLanguageColor(repo.language) : undefined }" />
        <span>{{ repo.name }}</span>
      </h5>
      <p flex-1 font-dm text-op-80 text-stone-700 dark:text-stone-300>
        {{ repo.description }}
      </p>
      <div fbc>
        <div fsc gap-4>
          <a
            v-if="repo.stargazers_count"
            target="_blank"
            decoration-none
            :href="`https://github.com/${repo.full_name}/stargazers`"
          >
            <span fsc gap-1 text-stone-500 dark:text-stone-400>
              <i i-hugeicons:star />
              {{ repo.stargazers_count }}
            </span>
          </a>
          <a
            v-if="repo.forks_count"
            target="_blank"
            decoration-none
            :href="`https://github.com/${repo.full_name}/network/members`"
          >
            <span fsc gap-1 text-stone-500 dark:text-stone-400>
              <i i-hugeicons:git-fork />
              {{ repo.forks_count }}
            </span>
          </a>
        </div>
        <div v-if="repo.languages?.length > 0" fsc gap-2>
          <i v-for="lang in repo.languages.slice(0, 3)" :key="lang" :class="getLangIcon(lang)" />
        </div>
      </div>
    </a>
  </article>
</template>
