CREATE TABLE IF NOT EXISTS quiz_session_questions (
  session_id TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  PRIMARY KEY (session_id, question_order),
  UNIQUE (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES quiz_sessions (id),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_session_questions_session ON quiz_session_questions (session_id);
