PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    encrypted_yw_id TEXT NOT NULL UNIQUE,
    display_name TEXT,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'admin')),
    points INTEGER NOT NULL DEFAULT 0,
    notes_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, class TEXT CHECK(class IN ('10.1', '10.2', '10.3')), suspended INTEGER NOT NULL DEFAULT 0 CHECK(suspended IN (0, 1))) STRICT;
INSERT INTO "users" VALUES(1,'b_gbnCkNqgYViWYaI1nlqbA3B3uh_gPSq9SveKxpEDSI_uhgogBm1aaLxhpwuwHjlvVZdw',NULL,NULL,'student',0,0,'2025-10-29 15:53:33','2025-10-30 08:54:24','10.3',0);
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_key TEXT,  
    subject TEXT,
    tags TEXT,  
    views INTEGER NOT NULL DEFAULT 0,
    rating_avg REAL NOT NULL DEFAULT 0.0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 1 CHECK(is_public IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;
CREATE TABLE note_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    changed_by INTEGER NOT NULL,
    change_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(note_id, version_number)
) STRICT;
CREATE TABLE ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(note_id, user_id)
) STRICT;
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;
CREATE TABLE ai_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    summary TEXT NOT NULL,
    key_takeaways TEXT,  
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE(note_id)
) STRICT;
CREATE TABLE subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  note_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;
INSERT INTO "subjects" VALUES(1,'Filsafat','fa-brain',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(2,'Fisika','fa-atom',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(3,'Matematika','fa-square-root-variable',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(4,'Bahasa Indonesia','fa-language',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(5,'Bahasa Inggris','fa-language',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(6,'Sosiologi','fa-users',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(7,'Sejarah Indonesia','fa-landmark',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(8,'Geografi','fa-globe-americas',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(9,'Ekonomi','fa-chart-line',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(10,'Sains','fa-flask',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(11,'PKN','fa-flag',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(12,'PAK','fa-church',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(13,'Biologi','fa-dna',0,'2025-10-29 15:47:01');
INSERT INTO "subjects" VALUES(14,'Kimia','fa-vial',0,'2025-10-29 15:47:01');
CREATE TABLE note_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(note_id, user_id)
) STRICT;
CREATE TABLE chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject TEXT,
  topic TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;
INSERT INTO "chat_sessions" VALUES(1,1,'Math','calculus','2025-10-29 15:53:33','2025-10-29 15:53:33');
INSERT INTO "chat_sessions" VALUES(2,1,'Math','calculus','2025-10-29 15:53:33','2025-10-29 15:53:33');
INSERT INTO "chat_sessions" VALUES(3,1,'math','calculus','2025-10-29 16:04:30','2025-10-29 16:04:30');
INSERT INTO "chat_sessions" VALUES(4,1,'Matematika','kalkulus','2025-10-29 16:16:47','2025-10-29 16:16:47');
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) STRICT;
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('subjects',14);
INSERT INTO "sqlite_sequence" VALUES('users',1);
INSERT INTO "sqlite_sequence" VALUES('chat_sessions',4);
CREATE INDEX idx_notes_author ON notes(author_id);
CREATE INDEX idx_notes_created ON notes(created_at DESC);
CREATE INDEX idx_notes_rating ON notes(rating_avg DESC);
CREATE INDEX idx_versions_note ON note_versions(note_id, version_number DESC);
CREATE INDEX idx_ratings_note ON ratings(note_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_comments_note ON comments(note_id);
CREATE INDEX idx_users_points ON users(points DESC);
