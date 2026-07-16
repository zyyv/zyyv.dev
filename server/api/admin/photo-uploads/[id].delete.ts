import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import {
  deletePhotoUpload,
  validatePhotoFilename,
  validatePhotoUploadId,
} from '../../../utils/photo-upload'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { PHOTOS } = useCloudflareBindings(event)
  validatePhotoUploadId(getRouterParam(event, 'id'))
  const query = getQuery(event)
  const filename = validatePhotoFilename(query.filename as string | undefined)
  await deletePhotoUpload(
    PHOTOS,
    filename,
    query.compressedContentType as string | undefined,
    query.thumbnailContentType as string | undefined,
  )
  setResponseStatus(event, 204)
  return null
})
