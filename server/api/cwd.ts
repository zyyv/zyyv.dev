import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

interface FileItem {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileItem[]
}

async function analyzeDirectory(dirPath: string, maxDepth = 3, currentDepth = 0): Promise<FileItem[]> {
  if (currentDepth >= maxDepth) {
    return []
  }

  try {
    const files = await readdir(dirPath, { withFileTypes: true })
    const result: FileItem[] = []

    for (const file of files) {
      // 过滤掉 node_modules 文件夹
      if (file.name === 'node_modules') {
        continue
      }

      const filePath = join(dirPath, file.name)
      const item: FileItem = {
        name: file.name,
        type: file.isDirectory() ? 'directory' : 'file',
        path: filePath,
      }

      if (file.isDirectory()) {
        // 递归分析子目录
        const children = await analyzeDirectory(filePath, maxDepth, currentDepth + 1)
        if (children.length > 0) {
          item.children = children
        }
      }

      result.push(item)
    }

    return result
  }
  catch {
    return []
  }
}

export default defineEventHandler(async (_event) => {
  const cwd = process.cwd()
  const path = resolve(cwd, '../')

  try {
    const files = await analyzeDirectory(path)

    return {
      cwd,
      files,
    }
  }
  catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read directory',
    })
  }
})
