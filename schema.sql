-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  photo_url TEXT,
  class TEXT,
  role TEXT DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  author_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  extracted_text TEXT,
  summary TEXT,
  image_path TEXT,
  likes INTEGER DEFAULT 0,
  admin_upvotes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY(author_id) REFERENCES users(id),
  FOREIGN KEY(subject_id) REFERENCES subjects(id)
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
);

-- Leaderboard view
CREATE VIEW IF NOT EXISTS leaderboard AS
SELECT 
  u.id,
  u.display_name,
  u.photo_url,
  u.class,
  COUNT(DISTINCT n.id) as notes_uploaded,
  COALESCE(SUM(n.likes), 0) as total_likes,
  COALESCE(SUM(n.admin_upvotes), 0) as admin_upvotes
FROM users u
LEFT JOIN notes n ON u.id = n.author_id AND n.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id
ORDER BY total_likes DESC, notes_uploaded DESC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
