export type PhotosViewMode = 'waterfall' | 'ripplable'

export function usePhotosViewMode() {
  const mode = useState<PhotosViewMode>('photos-view-mode', () => 'waterfall')

  function togglePhotosView() {
    mode.value = mode.value === 'waterfall' ? 'ripplable' : 'waterfall'
  }

  return {
    mode: readonly(mode),
    togglePhotosView,
  }
}
