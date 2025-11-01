PRAGMA defer_foreign_keys=TRUE;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'admin')),
    points INTEGER NOT NULL DEFAULT 0,
    notes_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    class TEXT CHECK(class IN ('10.1', '10.2', '10.3')),
    suspended INTEGER NOT NULL DEFAULT 0 CHECK(suspended IN (0, 1))
) STRICT;

CREATE TABLE IF NOT EXISTS notes (
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

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    note_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT,
    topic TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

INSERT INTO subjects (name, icon, note_count) VALUES
('Filsafat', 'fa-brain', 0),
('Fisika', 'fa-atom', 0),
('Matematika', 'fa-square-root-variable', 0),
('Bahasa Indonesia', 'fa-language', 0),
('Bahasa Inggris', 'fa-language', 0),
('Sosiologi', 'fa-users', 0),
('Sejarah Indonesia', 'fa-landmark', 0),
('Geografi', 'fa-globe-americas', 0),
('Ekonomi', 'fa-chart-line', 0),
('Sains', 'fa-flask', 0),
('PKN', 'fa-flag', 0),
('PAK', 'fa-church', 0),
('Biologi', 'fa-dna', 0),
('Kimia', 'fa-vial', 0);
