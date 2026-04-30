import type { APIRoute } from 'astro'
import { githubUsername, hasGitHubToken, useOctokit, usePublicOctokit } from '../../../server/utils/github'

export const GET: APIRoute = async () => {
  if (hasGitHubToken()) {
    try {
      const { data } = await useOctokit().request('GET /user')
      return Response.json(data)
    }
    catch (error) {
      console.warn('Failed to fetch authenticated GitHub user, falling back to public profile.', error)
    }
  }

  const { data } = await usePublicOctokit().request('GET /users/{username}', {
    username: githubUsername,
  })

  return Response.json(data)
}
