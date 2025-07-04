import type { Photo } from '~/types'
import { existsSync } from 'node:fs'
import { readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { encode } from 'blurhash'
import exifr from 'exifr'
import sharp from 'sharp'

const sourcePath = join(process.cwd(), 'public/photos')
const dataFile = 'server/utils/data.ts'
const dataPath = join(process.cwd(), dataFile)

generatePhotosData()
  .then(generateDataFile)
  .then(lintFix)
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })

async function generatePhotosData() {
  try {
    const files = await readdir(sourcePath)

    // 过滤出图片文件
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const imageFiles = files.filter(file =>
      imageExtensions.some(ext => file.toLowerCase().endsWith(ext)),
    )

    console.log(`Found ${imageFiles.length} image files`)

    // 获取每个图片的详细信息
    const photos = await Promise.all(
      imageFiles.map(async (filename, index) => {
        console.log(`Processing ${index + 1}/${imageFiles.length}: ${filename}`)

        const filePath = join(sourcePath, filename)
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

        // 获取 EXIF 数据
        let exifData: any = null
        try {
          exifData = await exifr.parse(filePath, {
            pick: [
              'Make',
              'Model',
              'ExposureTime',
              'FNumber',
              'ISO',
              'FocalLength',
              'LensModel',
              'DateTime',
              'DateTimeOriginal',
              'GPSLatitude',
              'GPSLongitude',
            ],
          })
        }
        catch (exifError) {
          console.warn(`  ⚠️  Could not parse EXIF data for ${filename}:`, (exifError as Error).message)
        }

        const photo: Photo = {
          id: filename.replace(/\.[^/.]+$/, ''), // 移除文件扩展名作为 ID
          filename,
          path: `/photos/${filename}`,
          size: stats.size,
          width: originalMetadata.width || 0,
          height: originalMetadata.height || 0,
          blurhash,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        }

        // 添加 EXIF 数据（如果存在）
        if (exifData) {
          photo.exif = {
            make: exifData.Make,
            model: exifData.Model,
            exposureTime: exifData.ExposureTime,
            fNumber: exifData.FNumber,
            iso: exifData.ISO,
            focalLength: exifData.FocalLength,
            lens: exifData.LensModel,
            dateTime: exifData.DateTimeOriginal || exifData.DateTime,
          }

          // 添加 GPS 数据（如果存在）
          if (exifData.GPSLatitude && exifData.GPSLongitude) {
            photo.exif.gps = {
              latitude: exifData.GPSLatitude,
              longitude: exifData.GPSLongitude,
            }
          }

          // 打印 EXIF 信息
          console.log(`  📸 EXIF: ${photo.exif.make} ${photo.exif.model} | f/${photo.exif.fNumber} | ${photo.exif.exposureTime}s | ISO ${photo.exif.iso}`)
        }

        return photo
      }),
    )

    // 按修改时间降序排序
    photos.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())

    return photos
  }
  catch (error) {
    console.error('❌ Error generating photos data:', error)
    throw error
  }
}

async function generateDataFile(photos: Photo[]) {
  // 如果旧文件存在，先删除它
  if (existsSync(dataPath)) {
    try {
      await unlink(dataPath)
      console.log('🗑️  Deleted existing data file')
    }
    catch (error) {
      console.warn('⚠️  Could not delete existing data file:', (error as Error).message)
    }
  }

  // 生成数据文件
  const dataContent = `// 此文件由 scripts/photo.ts 自动生成，请勿手动修改
import type { Photo } from '~/types'

export const photosData: Photo[] = ${JSON.stringify(photos, null, 2)}

export default photosData
`

  await writeFile(dataPath, dataContent, 'utf-8')

  console.log(`🎉 Successfully generated data for ${photos.length} photos`)
}

async function lintFix() {
  const { execa } = await import('execa')

  try {
    const result = await execa('eslint', [dataFile, '--fix'], {
      stdio: 'pipe',
      cwd: process.cwd(),
    })

    if (result.stdout)
      console.log('ESLint output:', result.stdout)
    if (result.stderr)
      console.log('ESLint stderr:', result.stderr)

    console.log('✅ ESLint check completed')
  }
  catch (eslintError) {
    // ESLint 可能会在修复文件时返回非零退出码，这是正常的
    if (eslintError && typeof eslintError === 'object' && 'stdout' in eslintError) {
      const error = eslintError as { stdout?: string, stderr?: string }
      console.log('ESLint executed with warnings/fixes:', error.stdout || error.stderr)
    }
    else {
      console.log('ESLint executed with some output')
    }
    console.log('✅ ESLint check completed')
  }

  process.exit(0)
}
