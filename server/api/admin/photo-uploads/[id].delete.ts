import { requireAdmin } from '../../../utils/admin-auth'
import { useCloudflareBindings } from '../../../utils/cloudflare'
import { deletePhotoUpload, validatePhotoUploadId } from '../../../utils/photo-upload'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { PHOTOS } = useCloudflareBindings(event)
  const id = validatePhotoUploadId(getRouterParam(event, 'id'))
  await deletePhotoUpload(PHOTOS, id)
  setResponseStatus(event, 204)
  return null
})
