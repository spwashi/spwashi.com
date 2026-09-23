CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  host TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT NOT NULL,
  writer TEXT,
  issued TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS notes_host_issued ON notes (host, issued);
