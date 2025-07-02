import { join } from 'node:path'

export default defineEventHandler(async () => {
  const path = process.cwd()

  return {
    path,
    publicPath: join(path, 'public'),
  }
})
