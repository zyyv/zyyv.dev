import type { BaseRepo, Repo } from '~/types'
import { useOctokit } from '../utils/github'

async function getRepoLanguages(repo: BaseRepo) {
  const { data } = await useOctokit().request('GET /repos/{owner}/{repo}/languages', {
    owner: repo.owner.login,
    repo: repo.name,
  })
  return Object.keys(data)
}

export default defineEventHandler(async () => {
  const { data } = await useOctokit().request('GET /user/repos', { per_page: 100 }) as unknown as { data: BaseRepo[] }

  const publicRepos = await Promise.all(
    data
      .filter(repo => !repo.fork && !repo.archived && !repo.private && repo.permissions?.admin && repo.description)
      .map(async repo => ({
        ...repo,
        languages: await getRepoLanguages(repo),
      })),
  )
  const publicAndNotForkRepos = publicRepos.filter(repo => !repo.fork)

  const repoGroups: Record<string, Repo[]> = {
    'UI': filterRepos(publicRepos, 'ui'),
    'UnoCSS': filterRepos(publicRepos, 'unocss').filter(repo => !repo.topics?.includes('unocss-community')),
    'UnoCSS Community': filterRepos(publicRepos, 'unocss-community'),
    'Vite Ecosystem': filterRepos(publicAndNotForkRepos, 'vite'),
    'Plugins': filterRepos(publicAndNotForkRepos, 'plugin'),
    'Utils': filterRepos(publicAndNotForkRepos, 'util'),
    'Config': filterRepos(publicAndNotForkRepos, 'config'),
    'Component': filterRepos(publicAndNotForkRepos, 'component'),
    'Templates': filterRepos(publicAndNotForkRepos, 'template'),
    'Games': filterRepos(publicAndNotForkRepos, 'game'),
    'Me': filterRepos(publicAndNotForkRepos, 'me'),
  }

  return Object.fromEntries(Object.entries(repoGroups).filter(([_, repos]) => repos.length > 0))
})

function filterRepos(repos: Repo[], key: string) {
  return repos.filter(repo => repo.topics && repo.topics.includes(key)).sort((a, b) => {
    return a.stargazers_count > b.stargazers_count ? -1 : 1
  })
}
