import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  const path = process.cwd()

  try {
    // 读取当前工作目录下的文件和文件夹
    const files = await readdir(path)

    // 获取每个文件的详细信息
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = join(path, file)
        const stats = await stat(filePath)

        return {
          name: file,
          path: filePath,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        }
      }),
    )

    // 按类型和名称排序（文件夹在前，然后按名称排序）
    const sortedFiles = fileStats.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) {
        return -1
      }
      if (!a.isDirectory && b.isDirectory) {
        return 1
      }
      return a.name.localeCompare(b.name)
    })

    return {
      path,
      publicPath: join(path, 'public'),
      files: sortedFiles,
      totalFiles: files.length,
      directories: sortedFiles.filter(f => f.isDirectory).length,
      regularFiles: sortedFiles.filter(f => f.isFile).length,
    }
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read directory',
      data: error,
    })
  }
})
