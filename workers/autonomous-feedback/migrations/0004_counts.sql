-- What a note was about, which common note it joined, and whether it came in the writer's own words.
ALTER TABLE notes ADD COLUMN subject TEXT;
ALTER TABLE notes ADD COLUMN thread TEXT;
ALTER TABLE notes ADD COLUMN worded INTEGER NOT NULL DEFAULT 1;

-- Counts by week, subject (or page), common note, and kind. Still no reader words.
DROP TABLE IF EXISTS tallies;
CREATE TABLE tallies (
  host TEXT NOT NULL,
  week TEXT NOT NULL,
  about TEXT NOT NULL,
  thread TEXT NOT NULL,
  kind TEXT NOT NULL,
  cards INTEGER NOT NULL,
  worded INTEGER NOT NULL,
  PRIMARY KEY (host, week, about, thread, kind)
);
