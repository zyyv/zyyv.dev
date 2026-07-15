CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY NOT NULL,
  filename TEXT NOT NULL,
  origin_key TEXT NOT NULL UNIQUE,
  origin_size INTEGER NOT NULL,
  compressed_key TEXT NOT NULL UNIQUE,
  compressed_size INTEGER NOT NULL,
  thumbnail_key TEXT NOT NULL UNIQUE,
  thumbnail_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  blurhash TEXT NOT NULL,
  is_private INTEGER NOT NULL DEFAULT 0 CHECK (is_private IN (0, 1)),
  exif_json TEXT,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS photos_created_at_idx ON photos (created_at DESC);
CREATE INDEX IF NOT EXISTS photos_private_created_at_idx
  ON photos (is_private, created_at DESC);
