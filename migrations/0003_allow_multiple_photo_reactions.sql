CREATE TABLE photo_reactions_multiple (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (
    reaction IN (
      'like',
      'love',
      'laugh',
      'smile',
      'adore',
      'wow',
      'starstruck',
      'thinking',
      'sad',
      'moved',
      'party',
      'fire',
      'dislike',
      'balloon'
    )
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (photo_id) REFERENCES photos (id) ON DELETE CASCADE
);

INSERT INTO photo_reactions_multiple (photo_id, visitor_id, reaction, created_at, updated_at)
SELECT photo_id, visitor_id, reaction, created_at, updated_at
FROM photo_reactions;

DROP TABLE photo_reactions;

ALTER TABLE photo_reactions_multiple RENAME TO photo_reactions;

CREATE INDEX photo_reactions_photo_reaction_idx
  ON photo_reactions (photo_id, reaction);
