import type { APIRoute } from 'astro'
import type { BaseRepo, Repo } from '../../../app/types'
import { githubUsername, hasGitHubToken, useOctokit, usePublicOctokit } from '../../../server/utils/github'

const CACHE_TTL = 10 * 60 * 1000
let reposCache: {
  expiresAt: number
  payload: Record<string, Repo[]>
} | undefined

type RepoWithTopics = Repo & {
  topics?: string[]
}

function filterRepos(repos: RepoWithTopics[], key: string) {
  return repos.filter(repo => repo.topics?.includes(key)).sort((a, b) => {
    return a.stargazers_count > b.stargazers_count ? -1 : 1
  })
}

function toRepo(repo: BaseRepo): RepoWithTopics {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    homepage: repo.homepage ?? null,
    description: repo.description,
    language: repo.language ?? null,
    stargazers_count: repo.stargazers_count ?? 0,
    forks_count: repo.forks_count ?? 0,
    languages: repo.language ? [repo.language] : [],
    topics: repo.topics,
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`GitHub repos request timed out after ${ms}ms`)), ms)
    }),
  ])
}

async function fetchReposFromGitHub() {
  let data: BaseRepo[] | undefined

  if (hasGitHubToken()) {
    try {
      const response = await useOctokit().request('GET /user/repos', { per_page: 100 }) as unknown as { data: BaseRepo[] }
      data = response.data
    }
    catch (error) {
      console.warn('Failed to fetch authenticated GitHub repos, falling back to public repos.', error)
    }
  }

  if (!data) {
    const response = await usePublicOctokit().request('GET /users/{username}/repos', {
      username: githubUsername,
      per_page: 100,
      sort: 'updated',
    }) as unknown as { data: BaseRepo[] }
    data = response.data
  }

  const publicRepos: RepoWithTopics[] = data
    .filter(repo => !repo.fork && !repo.archived && !repo.private && repo.description)
    .map(toRepo)

  const repoGroups: Record<string, RepoWithTopics[]> = {
    'UI': filterRepos(publicRepos, 'ui'),
    'UnoCSS': filterRepos(publicRepos, 'unocss').filter(repo => !repo.topics?.includes('unocss-community')),
    'UnoCSS Community': filterRepos(publicRepos, 'unocss-community'),
    'Vite Ecosystem': filterRepos(publicRepos, 'vite'),
    'Plugins': filterRepos(publicRepos, 'plugin'),
    'Utils': filterRepos(publicRepos, 'util'),
    'Config': filterRepos(publicRepos, 'config'),
    'Component': filterRepos(publicRepos, 'component'),
    'Templates': filterRepos(publicRepos, 'template'),
    'Games': filterRepos(publicRepos, 'game'),
    'Me': filterRepos(publicRepos, 'me'),
  }

  return Object.fromEntries(
    Object.entries(repoGroups)
      .filter(([_, repos]) => repos.length > 0)
      .map(([group, repos]) => [group, repos.map(({ topics: _topics, ...repo }) => repo)]),
  )
}

export const GET: APIRoute = async () => {
  if (reposCache && reposCache.expiresAt > Date.now())
    return Response.json(reposCache.payload)

  try {
    const payload = await withTimeout(fetchReposFromGitHub(), 15000)

    reposCache = {
      expiresAt: Date.now() + CACHE_TTL,
      payload,
    }

    return Response.json(payload)
  }
  catch (error) {
    console.warn('Failed to fetch GitHub repos.', error)
    return Response.json(
      { message: 'Failed to load repositories.' },
      { status: 502 },
    )
  }
}
