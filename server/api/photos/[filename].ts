import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  try {
    const filename = getRouterParam(event, 'filename')

    if (!filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filename is required',
      })
    }

    const photosDir = join(process.cwd(), 'photos')
    const filePath = join(photosDir, filename)

    // 安全检查：确保请求的文件在 photos 目录内
    if (!filePath.startsWith(photosDir)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied',
      })
    }

    // 检查文件是否存在
    try {
      await readFile(filePath)
    }
    catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Photo not found',
      })
    }

    // 设置适当的 Content-Type
    const ext = filename.toLowerCase().split('.').pop()
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
    }

    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000') // 1 year cache

    // 返回文件流
    return sendStream(event, createReadStream(filePath))
  }
  catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve photo',
    })
  }
})
