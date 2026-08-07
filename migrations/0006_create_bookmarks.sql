CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('bookmark', 'folder')),
  parent_id TEXT,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  icon_url TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  is_private INTEGER NOT NULL DEFAULT 0 CHECK (is_private IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  CHECK (
    (kind = 'folder' AND url IS NULL) OR
    (kind = 'bookmark' AND url IS NOT NULL)
  ),
  FOREIGN KEY (parent_id) REFERENCES bookmarks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS bookmarks_parent_sort_idx
  ON bookmarks (parent_id, sort_order, title);
CREATE INDEX IF NOT EXISTS bookmarks_public_parent_sort_idx
  ON bookmarks (is_private, parent_id, sort_order, title);
