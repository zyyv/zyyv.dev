export type FileFormat = readonly [filename: string, extension: string | undefined]

export function getFileFormat(filename: string): FileFormat {
  const extensionIndex = filename.lastIndexOf('.')
  const hasExtension = extensionIndex > 0 && extensionIndex < filename.length - 1
  const extension = hasExtension ? filename.slice(extensionIndex + 1).toUpperCase() : undefined
  const normalizedExtension = extension === 'JPG' || extension === 'JPEG' ? 'JPEG' : extension
  const baseFilename = hasExtension ? filename.slice(0, extensionIndex) : filename

  return [baseFilename, normalizedExtension]
}
