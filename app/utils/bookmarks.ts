import type { Bookmark } from '~/types'

export interface BookmarkNode extends Bookmark {
  children: BookmarkNode[]
}

export function bookmarkHost(url: string | null) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./u, '')
  } catch {
    return url
  }
}

export function buildBookmarkTree(bookmarks: readonly Bookmark[]) {
  const nodes = new Map<string, BookmarkNode>()
  for (const bookmark of bookmarks) nodes.set(bookmark.id, { ...bookmark, children: [] })

  const roots: BookmarkNode[] = []
  for (const bookmark of bookmarks) {
    const node = nodes.get(bookmark.id)!
    const parent = bookmark.parentId ? nodes.get(bookmark.parentId) : undefined
    if (parent?.kind === 'folder') parent.children.push(node)
    else roots.push(node)
  }

  const sort = (items: BookmarkNode[]) => {
    items.sort(
      (left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
    )
    for (const item of items) sort(item.children)
  }
  sort(roots)
  return roots
}

export function filterBookmarkTree(nodes: readonly BookmarkNode[], query: string, tag: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  function visit(node: BookmarkNode): BookmarkNode | null {
    const children = node.children.map(visit).filter((item): item is BookmarkNode => Boolean(item))
    const matchesTag = !tag || node.tags.includes(tag)
    const haystack = [node.title, node.url, node.description, ...node.tags]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
    if ((matchesTag && matchesQuery) || children.length) return { ...node, children }
    return null
  }

  return nodes.map(visit).filter((item): item is BookmarkNode => Boolean(item))
}
