import type { PhotoPreviewVariant } from '~/types'

export function getPhotoDownloadFilename(filename: string, variant: PhotoPreviewVariant): string {
  if (variant === 'origin') return filename

  const extensionIndex = filename.lastIndexOf('.')
  const hasExtension = extensionIndex > 0 && extensionIndex < filename.length - 1
  const basename = hasExtension ? filename.slice(0, extensionIndex) : filename

  if (variant === 'blurhash') return `${basename}_blurhash.txt`

  const extension = hasExtension ? filename.slice(extensionIndex) : ''
  return `${basename}_${variant}${extension}`
}

export function getPhotoDownloadUrl(
  photoId: string,
  variant: PhotoPreviewVariant,
  blurhash?: string,
): string {
  const encodedPhotoId = encodeURIComponent(photoId)
  if (variant === 'blurhash') {
    return `data:text/plain;charset=utf-8,${encodeURIComponent(blurhash ?? '')}`
  }
  if (variant === 'origin') return `/api/photos/${encodedPhotoId}/download`
  return `/api/photo-assets/${encodedPhotoId}/${variant}`
}
