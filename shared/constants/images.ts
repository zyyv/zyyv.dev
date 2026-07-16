export const IMAGE_CDN_ORIGIN = 'https://img.zyyv.dev'

export function imageCdnUrl(objectKey: string) {
  const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/')
  return `${IMAGE_CDN_ORIGIN}/${encodedKey}`
}
