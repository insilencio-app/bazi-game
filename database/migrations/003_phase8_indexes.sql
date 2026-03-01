CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question_id ON quiz_attempts (question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_answered ON quiz_attempts (session_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_created ON quiz_sessions (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_question_exposure_question_id ON question_exposure (question_id);
CREATE INDEX IF NOT EXISTS idx_questions_status_lesson ON questions (status, lesson_id);
