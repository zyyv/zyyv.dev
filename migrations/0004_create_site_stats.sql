CREATE TABLE site_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_views INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

INSERT INTO site_stats (id, total_views, updated_at)
VALUES (1, 0, unixepoch());

CREATE TABLE site_visits (
  visit_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
