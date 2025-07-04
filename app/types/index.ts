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

export interface Photo {
  id: string
  filename: string
  path: string
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
