import { githubUsername, hasGitHubToken, useOctokit, usePublicOctokit } from '../utils/github'

export default defineEventHandler(async () => {
  if (hasGitHubToken()) {
    try {
      const { data } = await useOctokit().request('GET /user')
      return data
    } catch (error) {
      console.warn(
        'Failed to fetch authenticated GitHub user, falling back to public profile.',
        error,
      )
    }
  }

  const { data } = await usePublicOctokit().request('GET /users/{username}', {
    username: githubUsername,
  })

  return data
})
