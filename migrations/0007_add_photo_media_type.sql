ALTER TABLE photos
ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image'
CHECK (media_type IN ('image', 'video'));

CREATE INDEX IF NOT EXISTS photos_media_type_created_at_idx
  ON photos (media_type, created_at DESC);
