ALTER TABLE notes ADD COLUMN saved INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS notes_saved_issued ON notes (saved, issued);

-- What survives compaction: one count per day, page, and kind. No reader words.
CREATE TABLE IF NOT EXISTS tallies (
  host TEXT NOT NULL,
  day TEXT NOT NULL,
  page TEXT NOT NULL,
  kind TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (host, day, page, kind)
);
