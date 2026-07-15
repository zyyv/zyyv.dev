import type { CloudflareBindings, R2BucketBinding } from '../types/cloudflare'

type ImagesBinding = CloudflareBindings['IMAGES']

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function sanitizeBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^/.]+$/, '')
  return (
    withoutExtension
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'photo'
  )
}

function extensionForType(contentType: string) {
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/png') return 'png'
  return 'webp'
}

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
  images: ImagesBinding
  file: { filename?: string; type?: string; data: Uint8Array }
  id: string
}) {
  const { bucket, images, file, id } = options
  const filename = file.filename || 'photo.jpg'
  const contentType = file.type || 'application/octet-stream'

  if (!SUPPORTED_TYPES.has(contentType)) {
    throw createError({ statusCode: 415, statusMessage: '仅支持 JPEG、PNG 和 WebP 图片' })
  }
  if (!file.data.byteLength || file.data.byteLength > MAX_UPLOAD_SIZE) {
    throw createError({ statusCode: 413, statusMessage: '图片不能为空且不能超过 20 MB' })
  }

  const info = await images.info(bytesToStream(file.data))
  if (!info.width || !info.height) {
    throw createError({ statusCode: 422, statusMessage: '无法读取图片尺寸' })
  }

  const baseName = sanitizeBaseName(filename)
  const extension = extensionForType(contentType)
  const originalKey = `original/${id}/${baseName}.${extension}`
  const compressedKey = `compressed/${id}/${baseName}.compressed.${extension}`
  const thumbnailKey = `thumbnail/${id}/${baseName}.thumbnail.${extension}`
  const [compressed, thumbnail] = await Promise.all([
    transformImage(images, file.data, 2560, contentType),
    transformImage(images, file.data, 600, contentType),
  ])

  const httpMetadata = { contentType, cacheControl: 'public, max-age=31536000, immutable' }
  try {
    await Promise.all([
      bucket.put(originalKey, file.data, {
        httpMetadata: { contentType, cacheControl: 'private, no-store' },
      }),
      bucket.put(compressedKey, compressed, { httpMetadata }),
      bucket.put(thumbnailKey, thumbnail, { httpMetadata }),
    ])
  } catch (error) {
    await bucket.delete([originalKey, compressedKey, thumbnailKey]).catch(() => undefined)
    throw error
  }

  return {
    filename,
    width: info.width,
    height: info.height,
    originalKey,
    originalSize: file.data.byteLength,
    compressedKey,
    compressedSize: compressed.byteLength,
    thumbnailKey,
    thumbnailSize: thumbnail.byteLength,
  }
}
