import type { Bookmark, BookmarkInput, BookmarkKind } from '~/types'
import type { D1DatabaseBinding } from '../types/cloudflare'

export interface BookmarkRow {
  id: string
  kind: BookmarkKind
  parent_id: string | null
  title: string
  url: string | null
  description: string | null
  icon_url: string | null
  tags_json: string
  is_private: number
  sort_order: number
  created_at: string
  modified_at: string
}

function parseTags(value: string) {
  try {
    const tags = JSON.parse(value)
    return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : []
  } catch {
    return []
  }
}

export function rowToBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    kind: row.kind,
    parentId: row.parent_id,
    title: row.title,
    url: row.url,
    description: row.description,
    iconUrl: row.icon_url,
    tags: parseTags(row.tags_json),
    private: Boolean(row.is_private),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    modifiedAt: row.modified_at,
  }
}

function optionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (!text) return null
  if (text.length > maxLength) {
    throw createError({ statusCode: 400, statusMessage: `字段长度不能超过 ${maxLength} 个字符` })
  }
  return text
}

function httpUrl(value: unknown, label: string, required = false) {
  const text = optionalText(value, 2048)
  if (!text) {
    if (required) throw createError({ statusCode: 400, statusMessage: `${label}不能为空` })
    return null
  }

  try {
    const parsed = new URL(text)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('protocol')
    return parsed.toString()
  } catch {
    throw createError({ statusCode: 400, statusMessage: `${label}必须是有效的 http 或 https 地址` })
  }
}

export function normalizeBookmarkInput(value: Partial<BookmarkInput>): BookmarkInput {
  const kind = value.kind === 'folder' ? 'folder' : 'bookmark'
  const title = optionalText(value.title, 120)
  if (!title) throw createError({ statusCode: 400, statusMessage: '名称不能为空' })

  const rawTags = Array.isArray(value.tags) ? value.tags : []
  const tags = [...new Set(rawTags.map((tag) => String(tag).trim()).filter(Boolean))]
  if (tags.length > 12 || tags.some((tag) => tag.length > 32)) {
    throw createError({ statusCode: 400, statusMessage: '标签最多 12 个，每个不超过 32 个字符' })
  }

  const sortOrder = Number(value.sortOrder)
  return {
    kind,
    parentId: optionalText(value.parentId, 64),
    title,
    url: kind === 'bookmark' ? httpUrl(value.url, '书签地址', true) : null,
    description: optionalText(value.description, 400),
    iconUrl: httpUrl(value.iconUrl, '图标地址'),
    tags,
    private: Boolean(value.private),
    sortOrder: Number.isInteger(sortOrder) ? Math.max(0, sortOrder) : undefined,
  }
}

export async function getBookmarkRow(database: D1DatabaseBinding, id: string) {
  return database.prepare('SELECT * FROM bookmarks WHERE id = ?').bind(id).first<BookmarkRow>()
}

export async function requireFolder(
  database: D1DatabaseBinding,
  parentId: string | null,
  itemId?: string,
) {
  if (!parentId) return
  if (parentId === itemId) {
    throw createError({ statusCode: 400, statusMessage: '文件夹不能放入自身' })
  }
  const parent = await getBookmarkRow(database, parentId)
  if (!parent || parent.kind !== 'folder') {
    throw createError({ statusCode: 400, statusMessage: '目标文件夹不存在' })
  }

  if (itemId) {
    const cycle = await database
      .prepare(
        `WITH RECURSIVE descendants(id) AS (
          SELECT id FROM bookmarks WHERE parent_id = ?
          UNION ALL
          SELECT bookmarks.id FROM bookmarks JOIN descendants ON bookmarks.parent_id = descendants.id
        ) SELECT id FROM descendants WHERE id = ? LIMIT 1`,
      )
      .bind(itemId, parentId)
      .first<{ id: string }>()
    if (cycle) throw createError({ statusCode: 400, statusMessage: '不能把文件夹移入其子文件夹' })
  }
}

export async function nextSortOrder(database: D1DatabaseBinding, parentId: string | null) {
  const row = parentId
    ? await database
        .prepare(
          'SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM bookmarks WHERE parent_id = ?',
        )
        .bind(parentId)
        .first<{ value: number }>()
    : await database
        .prepare(
          'SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM bookmarks WHERE parent_id IS NULL',
        )
        .first<{ value: number }>()
  return row?.value ?? 0
}

export async function listBookmarks(database: D1DatabaseBinding, includePrivate: boolean) {
  const result = includePrivate
    ? await database
        .prepare('SELECT * FROM bookmarks ORDER BY parent_id, sort_order, title COLLATE NOCASE')
        .all<BookmarkRow>()
    : await database
        .prepare(
          `WITH RECURSIVE visible AS (
            SELECT * FROM bookmarks WHERE parent_id IS NULL AND is_private = 0
            UNION ALL
            SELECT child.* FROM bookmarks child
            JOIN visible parent ON child.parent_id = parent.id
            WHERE child.is_private = 0
          ) SELECT * FROM visible ORDER BY parent_id, sort_order, title COLLATE NOCASE`,
        )
        .all<BookmarkRow>()
  return (result.results || []).map(rowToBookmark)
}
