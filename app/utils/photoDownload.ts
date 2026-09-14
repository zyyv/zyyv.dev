import type { PhotoPreviewVariant } from '~/types'

export function getPhotoDownloadFilename(filename: string, variant: PhotoPreviewVariant): string {
  if (variant === 'origin') return filename

  const extensionIndex = filename.lastIndexOf('.')
  const hasExtension = extensionIndex > 0 && extensionIndex < filename.length - 1
  const basename = hasExtension ? filename.slice(0, extensionIndex) : filename

  if (variant === 'arthash') return `${basename}_arthash.txt`

  const extension = hasExtension ? filename.slice(extensionIndex) : ''
  return `${basename}_${variant}${extension}`
}

export function getPhotoDownloadUrl(
  photoId: string,
  variant: PhotoPreviewVariant,
  arthash?: string,
): string {
  const encodedPhotoId = encodeURIComponent(photoId)
  if (variant === 'arthash') {
    return `data:text/plain;charset=utf-8,${encodeURIComponent(arthash ?? '')}`
  }
  if (variant === 'origin') return `/api/photos/${encodedPhotoId}/download`
  return `/api/photo-assets/${encodedPhotoId}/${variant}`
}
