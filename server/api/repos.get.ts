import type { BaseRepo, Repo } from '~/types'
import { githubUsername, hasGitHubToken, useOctokit, usePublicOctokit } from '../utils/github'

const CACHE_TTL = 10 * 60 * 1000
const githubOrganizations = ['unocss', 'unocss-community'] as const
let reposCache:
  | {
      expiresAt: number
      payload: Record<string, Repo[]>
    }
  | undefined

type RepoWithTopics = Repo & {
  topics?: string[]
}

function rankRepos(repos: RepoWithTopics[]) {
  return repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6)
}

function filterRepos(repos: RepoWithTopics[], key: string) {
  return rankRepos(repos.filter((repo) => repo.topics?.includes(key)))
}

function filterUnoCSSRepos(repos: RepoWithTopics[]) {
  return rankRepos(
    repos.filter(
      (repo) =>
        repo.full_name !== 'unocss/.github' &&
        (repo.full_name.startsWith('unocss/') || repo.topics?.includes('unocss')) &&
        !repo.topics?.includes('unocss-community'),
    ),
  )
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

async function fetchUserRepos(client: ReturnType<typeof useOctokit>): Promise<BaseRepo[]> {
  return (await client.paginate('GET /users/{username}/repos', {
    username: githubUsername,
    per_page: 100,
    sort: 'updated',
    type: 'owner',
  })) as BaseRepo[]
}

async function fetchOrganizationRepos(
  client: ReturnType<typeof useOctokit>,
  organization: (typeof githubOrganizations)[number],
): Promise<BaseRepo[]> {
  return (await client.paginate('GET /orgs/{org}/repos', {
    org: organization,
    per_page: 100,
    sort: 'updated',
    type: 'public',
  })) as BaseRepo[]
}

async function fetchScopedRepos(client: ReturnType<typeof useOctokit>): Promise<BaseRepo[]> {
  const [userRepos, ...organizationRepos] = await Promise.all([
    fetchUserRepos(client),
    ...githubOrganizations.map((organization) => fetchOrganizationRepos(client, organization)),
  ])

  return [
    ...new Map(
      [...userRepos, ...organizationRepos.flat()].map((repository) => [repository.id, repository]),
    ).values(),
  ]
}

async function fetchReposFromGitHub() {
  let data: BaseRepo[] | undefined

  if (hasGitHubToken()) {
    try {
      data = await fetchScopedRepos(useOctokit())
    } catch (error) {
      console.warn(
        'Failed to fetch authenticated GitHub repos, falling back to public repos.',
        error,
      )
    }
  }

  if (!data) {
    data = await fetchScopedRepos(usePublicOctokit())
  }

  const publicRepos: RepoWithTopics[] = data
    .filter((repo) => !repo.fork && !repo.archived && !repo.private && repo.description)
    .map(toRepo)

  const repoGroups: Record<string, RepoWithTopics[]> = {
    UI: filterRepos(publicRepos, 'ui'),
    UnoCSS: filterUnoCSSRepos(publicRepos),
    'UnoCSS Community': filterRepos(publicRepos, 'unocss-community'),
    // 'Vite Ecosystem': filterRepos(publicRepos, 'vite'),
    Plugins: filterRepos(publicRepos, 'plugin'),
    Utils: filterRepos(publicRepos, 'util'),
    // Config: filterRepos(publicRepos, 'config'),
    Component: filterRepos(publicRepos, 'component'),
    // Templates: filterRepos(publicRepos, 'template'),
    Games: filterRepos(publicRepos, 'game'),
    Me: filterRepos(publicRepos, 'me'),
  }

  return Object.fromEntries(
    Object.entries(repoGroups)
      .filter(([_, repos]) => repos.length > 0)
      .map(([group, repos]) => [group, repos.map(({ topics: _topics, ...repo }) => repo)]),
  )
}

export default defineEventHandler(async () => {
  if (reposCache && reposCache.expiresAt > Date.now()) return reposCache.payload

  try {
    const payload = await withTimeout(fetchReposFromGitHub(), 15000)

    reposCache = {
      expiresAt: Date.now() + CACHE_TTL,
      payload,
    }

    return payload
  } catch (error) {
    console.warn('Failed to fetch GitHub repos.', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to load repositories.',
    })
  }
})
