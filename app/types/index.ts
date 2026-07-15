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

export interface Photo {
  id: string
  filename: string
  src: string // 压缩后的图片地址
  thumbnail: string // 缩略图路径
  thumbnailSize: number // 缩略图文件大小（字节）
  thumbnailSizeFormatted: string // 格式化后的缩略图文件大小
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

export interface NewPhoto {
  id: string
  filename: string
  src: string // src 默认是原图的 src

  origin: string // 原图 src
  originSize: number // 原图文件大小（字节）
  originSizeFormatted: string

  compressed: string // 压缩后的图片地址
  compressedSize: number // 压缩后的图片文件大小（字节）
  compressedSizeFormatted: string

  thumbnail: string // 缩略图路径
  thumbnailSize: number // 缩略图文件大小（字节）
  thumbnailSizeFormatted: string // 格式化后的缩略图文件大小

  width: number
  height: number
  blurhash: string
  createdAt: Date | string
  modifiedAt: Date | string

  private?: boolean // 隐私图片，默认不展示
  exif?: PhotoExif
}

export interface PhotoListResponse {
  photos: NewPhoto[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
