import { Octokit } from 'octokit'

let _octokit: Octokit
let _publicOctokit: Octokit

function getEnv(key: string) {
  return import.meta.env[key] || process.env[key]
}

export const githubUsername = getEnv('GITHUB_USERNAME') || 'zyyv'

export function getGitHubToken() {
  return getEnv('Chris_GITHUB_TOKEN')
}

export function hasGitHubToken() {
  return Boolean(getGitHubToken())
}

export function useOctokit() {
  if (!_octokit) {
    _octokit = new Octokit({
      auth: getGitHubToken() || undefined,
    })
  }
  return _octokit
}

export function usePublicOctokit() {
  if (!_publicOctokit)
    _publicOctokit = new Octokit()

  return _publicOctokit
}
