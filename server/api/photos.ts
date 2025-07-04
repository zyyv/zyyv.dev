import { photosData } from '../utils/data'

export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 12)) // 限制每页最多50张
    const offset = (page - 1) * limit

    // 使用预生成的数据进行分页
    const total = photosData.length
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // 获取当前页的图片数据
    const photos = photosData.slice(offset, offset + limit)

    return {
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        count: photos.length,
      },
    }
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load photos data',
      data: error,
    })
  }
})
