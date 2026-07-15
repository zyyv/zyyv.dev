import { isAdmin } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => ({ authenticated: await isAdmin(event) }))
