import type { Endpoints } from '@octokit/types'

export * from './article'

export interface PostPreview {
  id: string
  title: string
  description: string
  path: string
  date: string
  tags: string[]
  lang: string
  rawbody?: string
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

export interface Photo {
  id: string
  filename: string
  path: string // 压缩后的图片路径
  thumbnail?: string // 缩略图路径
  originalPath?: string // 原图路径
  size: number
  sizeFormatted: string
  width: number
  height: number
  blurhash: string
  createdAt: Date | string
  modifiedAt: Date | string
  exif?: {
    make?: string // 相机制造商
    model?: string // 相机型号
    exposureTime?: number // 快门速度 (秒)
    fNumber?: number // 光圈值 (f/x)
    iso?: number // ISO 感光度
    focalLength?: number // 焦距 (mm)
    lens?: string // 镜头信息
    dateTime?: string // 拍摄时间
    gps?: {
      latitude?: number
      longitude?: number
    }
  }
}
