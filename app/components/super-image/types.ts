import type { Codec, ArthashBitmapOptions, ArthashSvgOptions } from '~/utils/arthash'
import type { CSSProperties } from 'vue'

export const SUPER_IMAGE_MODES = ['arthash', 'thumbnail', 'compressed', 'origin'] as const

export type SuperImageMode = (typeof SUPER_IMAGE_MODES)[number]

export interface SuperImageResources {
  arthash?: string | null
  thumbnail?: string | null
  compressed?: string | null
  origin?: string | null
}

export type SuperImageArthashOptions = Omit<ArthashSvgOptions, 'codec'> &
  Pick<ArthashBitmapOptions, 'aa' | 'pixelSmooth'>

export interface SuperImageProps {
  resources?: SuperImageResources
  assetStyle?: CSSProperties
  backdrop?: boolean
  arthashCodec?: Codec
  arthashOptions?: SuperImageArthashOptions
  loading?: 'lazy' | 'eager'
  alt?: string
  aspectRatio?: number | string
  width?: number | string
  height?: number | string
  srcset?: string
  sizes?: string
  decoding?: 'async' | 'sync' | 'auto'
  draggable?: boolean | 'true' | 'false'
  fetchpriority?: 'high' | 'low' | 'auto'
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  progressive?: boolean
}
