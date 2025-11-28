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

function getCompressedPath(filename: string): string {
  const compressedFilename = `${filename}_compressed.jpg`
  return `/photos/compressed/${compressedFilename}`
}

function getThumbnailPath(filename: string): string {
  const thumbFilename = `${filename}_thumb.jpg`
  return `/photos/compressed/${thumbFilename}`
}

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
      imageFiles.map(async (filename) => {
        const filePath = join(sourcePath, filename)
        const getBlurhash = async (sharped: sharp.Sharp, aspectRatio: number) => {
          const { data, info } = await sharped
            .raw()
            .ensureAlpha()
            .resize(32, Math.round(32 / aspectRatio), { fit: 'inside' })
            .toBuffer({ resolveWithObject: true })

          return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
        }
        const sharped = sharp(filePath)
        const [stats, originalMetadata, exifData] = await Promise.all([
          stat(filePath),
          sharped.metadata(),
          exifr.parse(filePath, {
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
          }),
        ])
        const { width, height } = originalMetadata.autoOrient
        const blurhash = await getBlurhash(sharped, width / height)

        const photo: Photo = {
          id: filename.replace(/\.[^/.]+$/, ''), // 移除文件扩展名作为 ID
          filename,
          path: getCompressedPath(filename),
          thumbnail: getThumbnailPath(filename),
          originalPath: `/photos/${filename}`,
          size: stats.size,
          sizeFormatted: formatSize(stats.size),
          width,
          height,
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
        }

        return photo
      }),
    )

    photos.sort((a, b) => {
      const aDate = a.exif?.dateTime ? new Date(a.exif.dateTime).getTime() : new Date(a.modifiedAt).getTime()
      const bDate = b.exif?.dateTime ? new Date(b.exif.dateTime).getTime() : new Date(b.modifiedAt).getTime()
      return bDate - aDate
    })

    return photos
  }
  catch (error) {
    console.error('❌ Error generating photos data:', error)
    throw error
  }
}

async function generateDataFile(photos: Photo[]) {
  if (existsSync(dataPath)) {
    try {
      await unlink(dataPath)
    }
    catch (error) {
      console.warn('⚠️  Could not delete existing data file:', (error as Error).message)
    }
  }

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
    const result = await execa('eslint', [dataFile, '--fix', '--no-ignore'], {
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

function formatSize(size: number): string {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}
