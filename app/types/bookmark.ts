export type BookmarkKind = 'bookmark' | 'folder'

export interface Bookmark {
  id: string
  kind: BookmarkKind
  parentId: string | null
  title: string
  url: string | null
  description: string | null
  iconUrl: string | null
  tags: readonly string[]
  private: boolean
  sortOrder: number
  createdAt: string
  modifiedAt: string
}

export interface BookmarkInput {
  kind: BookmarkKind
  parentId: string | null
  title: string
  url: string | null
  description: string | null
  iconUrl: string | null
  tags: string[]
  private: boolean
  sortOrder?: number
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[]
}
