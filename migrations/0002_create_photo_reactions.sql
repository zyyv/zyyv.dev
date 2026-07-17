CREATE TABLE IF NOT EXISTS photo_reactions (
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
      'dislike'
    )
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (photo_id, visitor_id),
  FOREIGN KEY (photo_id) REFERENCES photos (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS photo_reactions_photo_reaction_idx
  ON photo_reactions (photo_id, reaction);
