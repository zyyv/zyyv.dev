-- Renaming preserves the old BlurHash bytes; refresh them from R2 after applying this migration.
ALTER TABLE photos RENAME COLUMN blurhash TO arthash;
