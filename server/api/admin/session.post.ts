import { createAdminSession } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  if (!body?.password) throw createError({ statusCode: 400, statusMessage: '请输入密码' })
  await createAdminSession(event, body.password)
  return { authenticated: true }
})
