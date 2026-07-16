import type { CloudflareBindings, R2BucketBinding } from '../types/cloudflare'
import { photoUploadKeys, validatePhotoFilename } from './photo-upload'

type ImagesBinding = CloudflareBindings['IMAGES']

interface UploadFile {
  filename?: string
  type?: string
  data: Uint8Array
}

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024
const MAX_IMAGES_INPUT_SIZE = 20 * 1024 * 1024
const MAX_COMPRESSED_SIZE = 25 * 1024 * 1024
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function bytesToStream(bytes: Uint8Array) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

async function transformImage(
  images: ImagesBinding,
  bytes: Uint8Array,
  width: number,
  contentType: string,
) {
  const outputOptions =
    contentType === 'image/png' ? { format: contentType } : { format: contentType, quality: 80 }
  const result = await images
    .input(bytesToStream(bytes))
    .transform({ width, fit: 'scale-down' })
    .output({ ...outputOptions, anim: false })
  const response = result.response()
  if (!response.ok) throw new Error(`Image transform failed: ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

export async function processAndStorePhoto(options: {
  bucket: R2BucketBinding
  images?: ImagesBinding
  file: UploadFile
  compressed?: UploadFile
  thumbnail?: UploadFile
  width?: number
  height?: number
}) {
  const { bucket, images, file } = options
  const filename = validatePhotoFilename(file.filename)
  const contentType = file.type || 'application/octet-stream'

  if (!SUPPORTED_TYPES.has(contentType)) {
    throw createError({ statusCode: 415, statusMessage: '仅支持 JPEG、PNG 和 WebP 图片' })
  }
  if (!file.data.byteLength || file.data.byteLength > MAX_UPLOAD_SIZE) {
    throw createError({ statusCode: 413, statusMessage: '图片不能为空且不能超过 50 MB' })
  }

  const hasPreparedVariants = Boolean(options.compressed && options.thumbnail)
  if (Boolean(options.compressed) !== Boolean(options.thumbnail)) {
    throw createError({ statusCode: 400, statusMessage: '压缩图与缩略图必须同时上传' })
  }

  let width: number
  let height: number
  let compressed: UploadFile
  let thumbnail: UploadFile

  if (hasPreparedVariants) {
    compressed = options.compressed!
    thumbnail = options.thumbnail!
    width = Number(options.width)
    height = Number(options.height)
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw createError({ statusCode: 400, statusMessage: '图片尺寸无效' })
    }
    if (
      !SUPPORTED_TYPES.has(compressed.type || '') ||
      !compressed.data.byteLength ||
      compressed.data.byteLength > MAX_COMPRESSED_SIZE
    ) {
      throw createError({ statusCode: 413, statusMessage: '压缩图无效或超过 25 MB' })
    }
    if (
      !SUPPORTED_TYPES.has(thumbnail.type || '') ||
      !thumbnail.data.byteLength ||
      thumbnail.data.byteLength > MAX_THUMBNAIL_SIZE
    ) {
      throw createError({ statusCode: 413, statusMessage: '缩略图无效或超过 10 MB' })
    }
  } else {
    if (!images) {
      throw createError({
        statusCode: 503,
        statusMessage: '缺少 Cloudflare Images binding，无法在服务端生成图片变体',
      })
    }
    if (file.data.byteLength > MAX_IMAGES_INPUT_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: '超过 20 MB 的图片需要由新版管理页面生成压缩图后上传',
      })
    }
    const info = await images.info(bytesToStream(file.data))
    if (!info.width || !info.height) {
      throw createError({ statusCode: 422, statusMessage: '无法读取图片尺寸' })
    }
    width = info.width
    height = info.height
    const [compressedData, thumbnailData] = await Promise.all([
      transformImage(images, file.data, 2560, contentType),
      transformImage(images, file.data, 600, contentType),
    ])
    compressed = { type: contentType, data: compressedData }
    thumbnail = { type: contentType, data: thumbnailData }
  }

  const { originalKey, compressedKey, thumbnailKey } = photoUploadKeys(
    filename,
    compressed.type || contentType,
    thumbnail.type || contentType,
  )
  const cacheControl = 'public, max-age=31536000, immutable'
  const existing = await Promise.all([
    bucket.head(originalKey),
    bucket.head(compressedKey),
    bucket.head(thumbnailKey),
  ])
  if (existing.some(Boolean)) {
    throw createError({ statusCode: 409, statusMessage: 'R2 中已存在同名图片，请先重命名' })
  }
  try {
    await Promise.all([
      bucket.put(originalKey, file.data, {
        httpMetadata: { contentType, cacheControl: 'private, no-store' },
      }),
      bucket.put(compressedKey, compressed.data, {
        httpMetadata: { contentType: compressed.type || contentType, cacheControl },
      }),
      bucket.put(thumbnailKey, thumbnail.data, {
        httpMetadata: { contentType: thumbnail.type || contentType, cacheControl },
      }),
    ])
  } catch (error) {
    await bucket.delete([originalKey, compressedKey, thumbnailKey]).catch(() => undefined)
    throw error
  }

  return {
    filename,
    width,
    height,
    originalKey,
    originalSize: file.data.byteLength,
    compressedKey,
    compressedSize: compressed.data.byteLength,
    thumbnailKey,
    thumbnailSize: thumbnail.data.byteLength,
  }
}
