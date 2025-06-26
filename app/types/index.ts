import type { Endpoints } from '@octokit/types'

export * from './article'
export * from './gc'

export type BaseRepo = Endpoints['GET /repos/{owner}/{repo}']['response']['data']
export type RepoLanguages = Endpoints['GET /repos/{owner}/{repo}/languages']['response']['data']
export type Repo = BaseRepo & {
  languages: string[]
}
export type User = Endpoints['GET /user']['response']['data']

export interface ICursorStyle {
  dot: Record<string, number | string>
  cursor: Record<string, number | string>
  circle: Record<string, number | string>
}
