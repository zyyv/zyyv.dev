import type { Endpoints } from '@octokit/types'
import type { PhotoReactionType } from '#shared/constants/photo-reactions'

export type { PhotoReactionType } from '#shared/constants/photo-reactions'

export * from './article'

export interface PostPreview {
  id: string
  title: string
  description: string
  path: string
  date: string
  tags: string[]
  lang: string
  readingMinutes: number
}

export type BaseRepo = Endpoints['GET /users/{username}/repos']['response']['data'][number]
export type RepoLanguages = Endpoints['GET /repos/{owner}/{repo}/languages']['response']['data']
export interface Repo {
  id: number
  name: string
  full_name: string
  html_url: string
  homepage: string | null
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  languages: string[]
}
export type User = Endpoints['GET /user']['response']['data']

export interface PhotoExif {
  make?: string
  model?: string
  exposureTime?: number
  fNumber?: number
  iso?: number
  focalLength?: number
  lens?: string
  dateTime?: string
  gps?: {
    latitude?: number
    longitude?: number
  }
}

export interface Photo {
  id: string
  filename: string

  origin: string
  originSize: number
  originSizeFormatted: string

  compressed: string
  compressedSize: number
  compressedSizeFormatted: string

  thumbnail: string
  thumbnailSize: number
  thumbnailSizeFormatted: string

  width: number
  height: number
  blurhash: string
  createdAt: Date | string
  modifiedAt: Date | string

  private: boolean
  exif?: PhotoExif
  reactions: PhotoReactionCounts
}

export type PhotoReactionCounts = Record<PhotoReactionType, number>

export interface PhotoReactionResponse {
  counts: PhotoReactionCounts
}

export interface PhotoListResponse {
  photos: Photo[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext?: boolean
    hasPrev?: boolean
    count?: number
  }
}
