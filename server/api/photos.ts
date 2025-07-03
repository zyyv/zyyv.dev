import type { Photo } from '~/types'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { encode } from 'blurhash'
import sharp from 'sharp'

export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 12)) // 限制每页最多50张
    const offset = (page - 1) * limit

    // 根据环境确定 photos 目录路径
    const isDev = process.env.NODE_ENV === 'development'
    const photosDir = isDev
      ? join(process.cwd(), 'public/photos')
      : join(process.cwd(), '.output/public/photos')

    const files = await readdir(photosDir)

    // 过滤出图片文件
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const imageFiles = files.filter(file =>
      imageExtensions.some(ext => file.toLowerCase().endsWith(ext)),
    )

    // 计算分页信息
    const total = imageFiles.length
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // 获取当前页的图片文件
    const paginatedFiles = imageFiles.slice(offset, offset + limit)

    // 获取每个图片的详细信息
    const photos = await Promise.all(
      paginatedFiles.map(async (filename) => {
        const filePath = join(photosDir, filename)
        const stats = await stat(filePath)

        // 获取图片尺寸和像素数据
        const { data, info } = await sharp(filePath)
          .raw()
          .ensureAlpha()
          .resize(32, 32, { fit: 'inside' })
          .toBuffer({ resolveWithObject: true })

        // 生成 blurhash
        const blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4)

        // 获取原始图片尺寸
        const originalMetadata = await sharp(filePath).metadata()

        return {
          filename,
          path: `/photos/${filename}`,
          size: stats.size,
          width: originalMetadata.width,
          height: originalMetadata.height,
          blurhash,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        } as Photo
      }),
    )

    return {
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        count: photos.length,
      },
    }
  }
  catch (error) {
    console.error('Failed to read photos directory:', error)
    console.error('Attempted path:', process.env.NODE_ENV === 'development'
      ? join(process.cwd(), 'public/photos')
      : join(process.cwd(), '.output/public/photos'))

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read photos directory',
      data: error,
    })
  }
})
