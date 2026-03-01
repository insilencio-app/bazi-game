CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY,
  title_cn TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  lesson_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'truefalse', 'match')),
  prompt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  hint TEXT,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  status TEXT NOT NULL CHECK (status IN ('active', 'draft', 'retired')),
  FOREIGN KEY (lesson_id) REFERENCES lessons (id)
);

CREATE TABLE IF NOT EXISTS question_options (
  question_id TEXT NOT NULL,
  option_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  PRIMARY KEY (question_id, option_index),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE TABLE IF NOT EXISTS question_true_false (
  question_id TEXT PRIMARY KEY,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE TABLE IF NOT EXISTS question_match_pairs (
  question_id TEXT NOT NULL,
  pair_index INTEGER NOT NULL,
  left_text TEXT NOT NULL,
  right_text TEXT NOT NULL,
  PRIMARY KEY (question_id, pair_index),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE TABLE IF NOT EXISTS question_tags (
  question_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (question_id, tag),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  seed TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  response_ms INTEGER,
  answered_at TEXT NOT NULL,
  PRIMARY KEY (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES quiz_sessions (id),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE TABLE IF NOT EXISTS question_exposure (
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  seen_count INTEGER NOT NULL DEFAULT 0,
  last_seen_cursor INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE INDEX IF NOT EXISTS idx_questions_lesson_type ON questions (lesson_id, type);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions (status);
CREATE INDEX IF NOT EXISTS idx_question_exposure_cursor ON question_exposure (user_id, last_seen_cursor);
