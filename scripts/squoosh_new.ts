import { readdir, stat, writeFile } from 'node:fs/promises'
import { cpus } from 'node:os'
import { basename, extname, join } from 'node:path'
import SquooshPool from 'squoosh-next'

const imagePool = new SquooshPool.ImagePool(cpus().length)

const sourcePath = join(process.cwd(), 'public/photos')
const outputPath = join(process.cwd(), 'public/photos/compressed')

// 支持的图片格式
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']

// 压缩配置
const compressOptions = {
  // JPEG 压缩选项
  mozjpeg: {
    quality: 80,
    progressive: true,
  },
  // WebP 压缩选项
  webp: {
    quality: 80,
    method: 6,
  },
  // PNG 压缩选项
  oxipng: {
    level: 3,
    interlace: false,
  },
}

async function compressImages() {
  try {
    console.log('🖼️  Starting image compression...')

    const files = await readdir(sourcePath)

    // 过滤图片文件
    const imageFiles = files.filter(file =>
      imageExtensions.some(ext => file.toLowerCase().endsWith(ext)),
    )

    if (imageFiles.length === 0) {
      console.log('❌ No images found to compress')
      return
    }

    console.log(`📁 Found ${imageFiles.length} images to compress`)

    // 确保输出目录存在
    await ensureDir(outputPath)

    // 并行压缩所有图片
    const results = await Promise.allSettled(
      imageFiles.map(filename => compressImage(filename)),
    )

    // 统计结果
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`✅ Compression complete: ${successful} successful, ${failed} failed`)

    if (failed > 0) {
      console.log('❌ Failed files:')
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.log(`  - ${imageFiles[index]}: ${result.reason}`)
        }
      })
    }
  }
  catch (error) {
    console.error('💥 Compression failed:', error)
  }
  finally {
    await imagePool.close()
  }
}

async function compressImage(filename: string) {
  const inputPath = join(sourcePath, filename)
  const ext = extname(filename).toLowerCase()
  const name = basename(filename, ext)

  try {
    // 获取原始文件信息
    const originalStats = await stat(inputPath)
    const originalSize = originalStats.size

    console.log(`🔄 Compressing ${filename}...`)

    // 读取图片文件
    const { readFile } = await import('node:fs/promises')
    const imageBuffer = await readFile(inputPath)

    // 创建图片实例
    const image = imagePool.ingestImage(imageBuffer)

    // 根据原始格式选择压缩方式
    let compressedOutputPath: string
    let encodeOptions: any

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        compressedOutputPath = join(outputPath, `${name}_compressed.jpg`)
        encodeOptions = { mozjpeg: compressOptions.mozjpeg }
        break
      case '.png':
        compressedOutputPath = join(outputPath, `${name}_compressed.png`)
        encodeOptions = { oxipng: compressOptions.oxipng }
        break
      case '.webp':
        compressedOutputPath = join(outputPath, `${name}_compressed.webp`)
        encodeOptions = { webp: compressOptions.webp }
        break
      default:
        // 默认转换为 WebP
        compressedOutputPath = join(outputPath, `${name}_compressed.webp`)
        encodeOptions = { webp: compressOptions.webp }
    }

    // 执行压缩
    const encodedImage = await image.encode(encodeOptions)

    // 获取压缩后的数据
    const encodedKey = Object.keys(encodedImage)[0]
    const compressedData = encodedImage[encodedKey!]!.binary

    // 写入压缩后的文件
    await writeFile(compressedOutputPath, compressedData)

    // 计算压缩率
    const compressedSize = compressedData.length
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2)

    console.log(`✅ ${filename} -> ${basename(compressedOutputPath)}`)
    console.log(`   Original: ${formatSize(originalSize)} | Compressed: ${formatSize(compressedSize)} | Saved: ${compressionRatio}%`)

    return {
      filename,
      originalSize,
      compressedSize,
      compressionRatio: Number.parseFloat(compressionRatio),
    }
  }
  catch (error) {
    console.error(`❌ Failed to compress ${filename}:`, error)
    throw error
  }
}

async function ensureDir(dirPath: string) {
  try {
    await stat(dirPath)
  }
  catch {
    // 目录不存在，创建它
    const { mkdir } = await import('node:fs/promises')
    await mkdir(dirPath, { recursive: true })
  }
}

function formatSize(size: number): string {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

// 如果直接运行此脚本，则开始压缩
if (import.meta.url === `file://${process.argv[1]}`) {
  compressImages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { compressImage, compressImages }
