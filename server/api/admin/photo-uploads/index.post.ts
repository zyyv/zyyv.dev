import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { id: crypto.randomUUID() }
})
