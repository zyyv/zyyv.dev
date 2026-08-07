import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

interface ImportedBookmark {
  id: string
  kind: 'bookmark' | 'folder'
  parentId: string | null
  title: string
  url: string | null
  description: string | null
  iconUrl: string | null
  sortOrder: number
  createdAt: string
  modifiedAt: string
  personalToolbar: boolean
}

function argument(name: string) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value
    .replace(/<[^>]+>/gu, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/giu, (entity, code: string) => {
      if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
      if (code.startsWith('#')) return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
      return named[code.toLowerCase()] ?? entity
    })
    .trim()
}

function attributes(value: string) {
  const result: Record<string, string> = {}
  for (const match of value.matchAll(/([\w-]+)="([^"]*)"/gu)) {
    result[match[1]!.toLowerCase()] = decodeHtml(match[2]!)
  }
  return result
}

function timestamp(value: string | undefined, fallback: string) {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds <= 0) return fallback
  return new Date(seconds * 1000).toISOString()
}

function stableId(kind: string, path: string, url = '') {
  const hash = createHash('sha256').update(`${kind}\0${path}\0${url}`).digest('hex').slice(0, 32)
  return `chrome-${hash}`
}

function sqlValue(value: string | number | null) {
  if (value === null) return 'NULL'
  if (typeof value === 'number') return String(value)
  return `'${value.replaceAll("'", "''")}'`
}

function parseBookmarks(html: string) {
  const tokenPattern =
    /<DT><H3\b([^>]*)>([\s\S]*?)<\/H3>|<DT><A\b([^>]*)>([\s\S]*?)<\/A>|<DD>([^\r\n]*)|<DL><p>|<\/DL><p>/giu
  const items: ImportedBookmark[] = []
  const folderStack: Array<string | null> = []
  const folderPaths = new Map<string, string>()
  const sortOrders = new Map<string, number>()
  const fallbackDate = new Date().toISOString()
  let pendingFolder: string | null | undefined
  let lastBookmark: ImportedBookmark | undefined
  let skippedUrls = 0

  const currentParent = () => folderStack.at(-1) ?? null
  const currentPath = () => {
    const parent = currentParent()
    return parent ? folderPaths.get(parent) || '' : ''
  }
  const nextSortOrder = (parentId: string | null) => {
    const key = parentId ?? 'root'
    const next = sortOrders.get(key) ?? 0
    sortOrders.set(key, next + 1)
    return next
  }

  for (const match of html.matchAll(tokenPattern)) {
    const token = match[0]
    if (/^<DL>/iu.test(token)) {
      folderStack.push(pendingFolder === undefined ? currentParent() : pendingFolder)
      pendingFolder = undefined
      continue
    }
    if (/^<\/DL>/iu.test(token)) {
      folderStack.pop()
      lastBookmark = undefined
      continue
    }

    if (match[1] !== undefined) {
      const metadata = attributes(match[1])
      const title = decodeHtml(match[2] || '') || '未命名文件夹'
      const parentId = currentParent()
      const path = [currentPath(), title].filter(Boolean).join('/')
      const id = stableId('folder', path)
      const createdAt = timestamp(metadata.add_date, fallbackDate)
      items.push({
        id,
        kind: 'folder',
        parentId,
        title,
        url: null,
        description: null,
        iconUrl: null,
        sortOrder: nextSortOrder(parentId),
        createdAt,
        modifiedAt: timestamp(metadata.last_modified, createdAt),
        personalToolbar: metadata.personal_toolbar_folder === 'true',
      })
      folderPaths.set(id, path)
      pendingFolder = id
      lastBookmark = undefined
      continue
    }

    if (match[3] !== undefined) {
      const metadata = attributes(match[3])
      let parsedUrl: URL
      try {
        parsedUrl = new URL(metadata.href || '')
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') throw new Error()
      } catch {
        skippedUrls += 1
        lastBookmark = undefined
        continue
      }

      const parentId = currentParent()
      const title = decodeHtml(match[4] || '') || parsedUrl.hostname.replace(/^www\./u, '')
      const path = [currentPath(), title].filter(Boolean).join('/')
      const createdAt = timestamp(metadata.add_date, fallbackDate)
      const iconUrl = metadata.icon?.startsWith('http') ? metadata.icon : null
      lastBookmark = {
        id: stableId('bookmark', path, parsedUrl.toString()),
        kind: 'bookmark',
        parentId,
        title,
        url: parsedUrl.toString(),
        description: null,
        iconUrl,
        sortOrder: nextSortOrder(parentId),
        createdAt,
        modifiedAt: createdAt,
        personalToolbar: false,
      }
      items.push(lastBookmark)
      continue
    }

    if (match[5] !== undefined && lastBookmark) {
      lastBookmark.description = decodeHtml(match[5]) || null
    }
  }

  const toolbarIds = new Set(
    items.filter((item) => item.kind === 'folder' && item.personalToolbar).map((item) => item.id),
  )
  const flattened = items
    .filter((item) => !toolbarIds.has(item.id))
    .map((item) => ({
      ...item,
      parentId: item.parentId && toolbarIds.has(item.parentId) ? null : item.parentId,
    }))

  return { items: flattened, skippedUrls }
}

const input = argument('--input')
const output = argument('--output')
const isPrivate = process.argv.includes('--private')
if (!input || !output) {
  throw new Error(
    'Usage: esno scripts/import-bookmarks.ts --input <bookmarks.html> --output <import.sql> [--private]',
  )
}

const { items, skippedUrls } = parseBookmarks(readFileSync(input, 'utf8'))
const statements = items.map((item) => {
  const values = [
    item.id,
    item.kind,
    item.parentId,
    item.title,
    item.url,
    item.description,
    item.iconUrl,
    '[]',
    Number(isPrivate),
    item.sortOrder,
    item.createdAt,
    item.modifiedAt,
  ].map(sqlValue)
  return `INSERT INTO bookmarks (
  id, kind, parent_id, title, url, description, icon_url, tags_json,
  is_private, sort_order, created_at, modified_at
) VALUES (${values.join(', ')})
ON CONFLICT(id) DO UPDATE SET
  kind = excluded.kind,
  parent_id = excluded.parent_id,
  title = excluded.title,
  url = excluded.url,
  description = excluded.description,
  icon_url = excluded.icon_url,
  sort_order = excluded.sort_order,
  modified_at = excluded.modified_at;`
})

writeFileSync(output, `${statements.join('\n')}\n`)

const folders = items.filter((item) => item.kind === 'folder').length
const bookmarks = items.length - folders
console.log(JSON.stringify({ bookmarks, folders, skippedUrls, output }, null, 2))
