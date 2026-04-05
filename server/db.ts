import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { normalizeLessonsToDataset } from '../src/db/migration/normalizeLessons';
import type { QuestionExposureRow } from '../src/db/schema';

const rootDir = process.cwd();
const migrationDir = path.join(rootDir, 'database', 'migrations');
const dbPath = path.join(rootDir, 'database', 'bazi.sqlite');

type DbQuestionRow = {
  id: string;
  lesson_id: number;
  type: 'mcq' | 'truefalse' | 'match';
  difficulty: number;
  status: 'active' | 'draft' | 'retired';
};

export type SessionQuestionPayload = {
  id: string;
  lessonId: number;
  type: 'mcq' | 'truefalse' | 'match';
  prompt: string;
  explanation: string;
  hint: string | null;
  options?: string[];
  pairs?: { left: string; right: string }[];
  answer?: number | boolean;
};

export type AnalyticsSummary = {
  sessions: number;
  attempts: number;
  correct: number;
  accuracyPercent: number;
  averageResponseMs: number | null;
};

export type AnalyticsLessonRow = {
  lessonId: number;
  lessonTitle: string;
  attempts: number;
  correct: number;
  accuracyPercent: number;
  averageResponseMs: number | null;
};

export type AnalyticsQuestionRow = {
  questionId: string;
  lessonId: number;
  lessonTitle: string;
  questionType: 'mcq' | 'truefalse' | 'match';
  prompt: string;
  attempts: number;
  correct: number;
  accuracyPercent: number;
  averageResponseMs: number | null;
  totalExposure: number;
};

export type AnalyticsAlertRow = {
  category:
    | 'weak-question'
    | 'overused-question'
    | 'classical-modern-confusion'
    | 'ten-god-structure-misread';
  questionId: string;
  lessonId: number;
  lessonTitle: string;
  questionType: 'mcq' | 'truefalse' | 'match';
  accuracyPercent: number;
  attempts: number;
  totalExposure: number;
};

const ensureDatabaseDirectory = () => {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
};

const applyMigrations = (db: Database.Database) => {
  const migrationFiles = fs
    .readdirSync(migrationDir)
    .filter((name) => name.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  migrationFiles.forEach((fileName) => {
    const sqlPath = path.join(migrationDir, fileName);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    db.exec(sql);
  });
};

const seedQuestionsIfEmpty = (db: Database.Database) => {
  const questionCount = db.prepare('SELECT COUNT(1) as count FROM questions').get() as { count: number };
  if (questionCount.count > 0) return;

  const dataset = normalizeLessonsToDataset();

  const insertLesson = db.prepare('INSERT INTO lessons (id, title_cn) VALUES (?, ?)');
  const insertQuestion = db.prepare(
    'INSERT INTO questions (id, lesson_id, type, prompt, explanation, hint, difficulty, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertOption = db.prepare(
    'INSERT INTO question_options (question_id, option_index, text, is_correct) VALUES (?, ?, ?, ?)'
  );
  const insertTrueFalse = db.prepare('INSERT INTO question_true_false (question_id, correct) VALUES (?, ?)');
  const insertMatch = db.prepare(
    'INSERT INTO question_match_pairs (question_id, pair_index, left_text, right_text) VALUES (?, ?, ?, ?)'
  );
  const insertTag = db.prepare('INSERT INTO question_tags (question_id, tag) VALUES (?, ?)');

  const transaction = db.transaction(() => {
    dataset.lessons.forEach((lesson) => {
      insertLesson.run(lesson.id, lesson.titleCn);
    });

    dataset.questions.forEach((question) => {
      insertQuestion.run(
        question.id,
        question.lessonId,
        question.type,
        question.prompt,
        question.explanation,
        question.hint,
        question.difficulty,
        question.status
      );
    });

    dataset.options.forEach((option) => {
      insertOption.run(option.questionId, option.optionIndex, option.text, option.isCorrect ? 1 : 0);
    });

    dataset.trueFalseAnswers.forEach((row) => {
      insertTrueFalse.run(row.questionId, row.correct ? 1 : 0);
    });

    dataset.matchPairs.forEach((pair) => {
      insertMatch.run(pair.questionId, pair.pairIndex, pair.leftText, pair.rightText);
    });

    dataset.tags.forEach((tag) => {
      insertTag.run(tag.questionId, tag.tag);
    });
  });

  transaction();
};

export const createDatabase = () => {
  ensureDatabaseDirectory();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  applyMigrations(db);
  seedQuestionsIfEmpty(db);

  return db;
};

export const loadActiveQuestions = (db: Database.Database): DbQuestionRow[] => {
  return db
    .prepare('SELECT id, lesson_id, type, difficulty, status FROM questions WHERE status = ?')
    .all('active') as DbQuestionRow[];
};

export const loadExposureRows = (db: Database.Database, userId: string): QuestionExposureRow[] => {
  const rows = db
    .prepare('SELECT question_id, seen_count, last_seen_cursor FROM question_exposure WHERE user_id = ?')
    .all(userId) as Array<{ question_id: string; seen_count: number; last_seen_cursor: number }>;

  return rows.map((row) => ({
    questionId: row.question_id,
    seenCount: row.seen_count,
    lastSeenCursor: row.last_seen_cursor,
  }));
};

export const upsertExposureRows = (
  db: Database.Database,
  userId: string,
  rows: QuestionExposureRow[]
) => {
  const upsert = db.prepare(
    `
    INSERT INTO question_exposure (user_id, question_id, seen_count, last_seen_cursor)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, question_id)
    DO UPDATE SET
      seen_count = excluded.seen_count,
      last_seen_cursor = excluded.last_seen_cursor
    `
  );

  const transaction = db.transaction(() => {
    rows.forEach((row) => {
      upsert.run(userId, row.questionId, row.seenCount, row.lastSeenCursor);
    });
  });

  transaction();
};

export const insertSession = (
  db: Database.Database,
  args: { sessionId: string; userId: string; seed: string; policyVersion: string; createdAt: string }
) => {
  db.prepare(
    'INSERT INTO quiz_sessions (id, user_id, seed, policy_version, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(args.sessionId, args.userId, args.seed, args.policyVersion, args.createdAt);
};

export const insertSessionQuestions = (
  db: Database.Database,
  sessionId: string,
  questionIds: string[]
) => {
  const insert = db.prepare(
    'INSERT INTO quiz_session_questions (session_id, question_order, question_id) VALUES (?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    questionIds.forEach((questionId, index) => {
      insert.run(sessionId, index, questionId);
    });
  });

  transaction();
};

export const loadSessionQuestionIds = (db: Database.Database, sessionId: string): string[] => {
  const rows = db
    .prepare('SELECT question_id FROM quiz_session_questions WHERE session_id = ? ORDER BY question_order ASC')
    .all(sessionId) as Array<{ question_id: string }>;

  return rows.map((row) => row.question_id);
};

export const buildSessionQuestionPayload = (
  db: Database.Database,
  questionIds: string[],
  includeAnswers: boolean
): SessionQuestionPayload[] => {
  if (questionIds.length === 0) return [];

  const loadQuestion = db.prepare(
    'SELECT id, lesson_id, type, prompt, explanation, hint FROM questions WHERE id = ?'
  );
  const loadOptions = db.prepare(
    'SELECT option_index, text, is_correct FROM question_options WHERE question_id = ? ORDER BY option_index ASC'
  );
  const loadTrueFalse = db.prepare('SELECT correct FROM question_true_false WHERE question_id = ?');
  const loadPairs = db.prepare(
    'SELECT pair_index, left_text, right_text FROM question_match_pairs WHERE question_id = ? ORDER BY pair_index ASC'
  );

  return questionIds
    .map((questionId) => {
      const question = loadQuestion.get(questionId) as
        | {
            id: string;
            lesson_id: number;
            type: 'mcq' | 'truefalse' | 'match';
            prompt: string;
            explanation: string;
            hint: string | null;
          }
        | undefined;

      if (!question) return null;

      if (question.type === 'mcq') {
        const optionRows = loadOptions.all(questionId) as Array<{
          option_index: number;
          text: string;
          is_correct: number;
        }>;

        const payload: SessionQuestionPayload = {
          id: question.id,
          lessonId: question.lesson_id,
          type: 'mcq',
          prompt: question.prompt,
          explanation: question.explanation,
          hint: question.hint,
          options: optionRows.map((row) => row.text),
        };

        if (includeAnswers) {
          payload.answer = optionRows.find((row) => row.is_correct === 1)?.option_index ?? 0;
        }

        return payload;
      }

      if (question.type === 'truefalse') {
        const row = loadTrueFalse.get(questionId) as { correct: number } | undefined;
        const payload: SessionQuestionPayload = {
          id: question.id,
          lessonId: question.lesson_id,
          type: 'truefalse',
          prompt: question.prompt,
          explanation: question.explanation,
          hint: question.hint,
        };

        if (includeAnswers) {
          payload.answer = Boolean(row?.correct);
        }

        return payload;
      }

      const pairRows = loadPairs.all(questionId) as Array<{ pair_index: number; left_text: string; right_text: string }>;

      return {
        id: question.id,
        lessonId: question.lesson_id,
        type: 'match',
        prompt: question.prompt,
        explanation: question.explanation,
        hint: question.hint,
        pairs: pairRows.map((row) => ({ left: row.left_text, right: row.right_text })),
      } satisfies SessionQuestionPayload;
    })
    .filter((item): item is SessionQuestionPayload => item !== null);
};

export const insertAttempts = (
  db: Database.Database,
  args: {
    sessionId: string;
    attempts: Array<{ questionId: string; isCorrect: boolean; responseMs: number | null }>;
    answeredAt: string;
  }
) => {
  const insert = db.prepare(
    `
    INSERT INTO quiz_attempts (session_id, question_id, is_correct, response_ms, answered_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(session_id, question_id)
    DO UPDATE SET
      is_correct = excluded.is_correct,
      response_ms = excluded.response_ms,
      answered_at = excluded.answered_at
    `
  );

  const transaction = db.transaction(() => {
    args.attempts.forEach((attempt) => {
      insert.run(
        args.sessionId,
        attempt.questionId,
        attempt.isCorrect ? 1 : 0,
        attempt.responseMs,
        args.answeredAt
      );
    });
  });

  transaction();
};

export const loadAnalyticsSummary = (db: Database.Database, userId?: string): AnalyticsSummary => {
  const row = db
    .prepare(
      `
      SELECT
        COUNT(DISTINCT qa.session_id) as sessions,
        COUNT(1) as attempts,
        COALESCE(SUM(qa.is_correct), 0) as correct,
        AVG(qa.response_ms) as avg_response_ms
      FROM quiz_attempts qa
      INNER JOIN quiz_sessions qs ON qs.id = qa.session_id
      WHERE (? IS NULL OR qs.user_id = ?)
      `
    )
    .get(userId ?? null, userId ?? null) as {
    sessions: number;
    attempts: number;
    correct: number;
    avg_response_ms: number | null;
  };

  const attempts = Number(row?.attempts ?? 0);
  const correct = Number(row?.correct ?? 0);

  return {
    sessions: Number(row?.sessions ?? 0),
    attempts,
    correct,
    accuracyPercent: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    averageResponseMs:
      typeof row?.avg_response_ms === 'number' && Number.isFinite(row.avg_response_ms)
        ? Math.round(row.avg_response_ms)
        : null,
  };
};

export const loadLessonAnalytics = (db: Database.Database, userId?: string): AnalyticsLessonRow[] => {
  const rows = db
    .prepare(
      `
      SELECT
        q.lesson_id as lesson_id,
        l.title_cn as lesson_title,
        COUNT(1) as attempts,
        COALESCE(SUM(qa.is_correct), 0) as correct,
        AVG(qa.response_ms) as avg_response_ms
      FROM quiz_attempts qa
      INNER JOIN questions q ON q.id = qa.question_id
      INNER JOIN lessons l ON l.id = q.lesson_id
      INNER JOIN quiz_sessions qs ON qs.id = qa.session_id
      WHERE (? IS NULL OR qs.user_id = ?)
      GROUP BY q.lesson_id, l.title_cn
      ORDER BY q.lesson_id ASC
      `
    )
    .all(userId ?? null, userId ?? null) as Array<{
    lesson_id: number;
    lesson_title: string;
    attempts: number;
    correct: number;
    avg_response_ms: number | null;
  }>;

  return rows.map((row) => {
    const attempts = Number(row.attempts ?? 0);
    const correct = Number(row.correct ?? 0);

    return {
      lessonId: row.lesson_id,
      lessonTitle: row.lesson_title,
      attempts,
      correct,
      accuracyPercent: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      averageResponseMs:
        typeof row.avg_response_ms === 'number' && Number.isFinite(row.avg_response_ms)
          ? Math.round(row.avg_response_ms)
          : null,
    };
  });
};

export const loadQuestionAnalytics = (db: Database.Database, userId?: string): AnalyticsQuestionRow[] => {
  const rows = db
    .prepare(
      `
      SELECT
        q.id as question_id,
        q.lesson_id as lesson_id,
        l.title_cn as lesson_title,
        q.type as question_type,
        q.prompt as prompt,
        COUNT(qa.question_id) as attempts,
        COALESCE(SUM(qa.is_correct), 0) as correct,
        AVG(qa.response_ms) as avg_response_ms,
        COALESCE(exposure.total_exposure, 0) as total_exposure
      FROM questions q
      INNER JOIN lessons l ON l.id = q.lesson_id
      LEFT JOIN quiz_attempts qa ON qa.question_id = q.id
      LEFT JOIN quiz_sessions qs ON qs.id = qa.session_id
      LEFT JOIN (
        SELECT question_id, SUM(seen_count) as total_exposure
        FROM question_exposure
        GROUP BY question_id
      ) exposure ON exposure.question_id = q.id
      WHERE q.status = 'active' AND (? IS NULL OR qs.user_id = ?)
      GROUP BY q.id, q.lesson_id, l.title_cn, q.type, q.prompt, exposure.total_exposure
      ORDER BY q.lesson_id ASC, q.id ASC
      `
    )
    .all(userId ?? null, userId ?? null) as Array<{
    question_id: string;
    lesson_id: number;
    lesson_title: string;
    question_type: 'mcq' | 'truefalse' | 'match';
    prompt: string;
    attempts: number;
    correct: number;
    avg_response_ms: number | null;
    total_exposure: number;
  }>;

  return rows.map((row) => {
    const attempts = Number(row.attempts ?? 0);
    const correct = Number(row.correct ?? 0);

    return {
      questionId: row.question_id,
      lessonId: row.lesson_id,
      lessonTitle: row.lesson_title,
      questionType: row.question_type,
      prompt: row.prompt,
      attempts,
      correct,
      accuracyPercent: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      averageResponseMs:
        typeof row.avg_response_ms === 'number' && Number.isFinite(row.avg_response_ms)
          ? Math.round(row.avg_response_ms)
          : null,
      totalExposure: Number(row.total_exposure ?? 0),
    };
  });
};

export const loadAnalyticsAlerts = (
  db: Database.Database,
  args?: {
    userId?: string;
    weakAccuracyThreshold?: number;
    weakAttemptsThreshold?: number;
    overusedExposureThreshold?: number;
  }
): AnalyticsAlertRow[] => {
  const weakAccuracyThreshold = args?.weakAccuracyThreshold ?? 60;
  const weakAttemptsThreshold = args?.weakAttemptsThreshold ?? 8;
  const overusedExposureThreshold = args?.overusedExposureThreshold ?? 40;

  const classicalModernKeywordPattern = /古典用神|喜用神|喜用五行|月令|天透地藏|本氣|成格|破格|格局/;
  const tenGodStructureKeywordPattern =
    /十神|結構|組合|旺衰|透根|透干|有透有根|有透無根|無透有根|無透無根|官印相生|食神制殺|傷官見官|財星壞印|日主/;
  const categorySortOrder: Record<AnalyticsAlertRow['category'], number> = {
    'classical-modern-confusion': 0,
    'ten-god-structure-misread': 1,
    'weak-question': 2,
    'overused-question': 3,
  };

  const isClassicalModernConfusionQuestion = (question: AnalyticsQuestionRow) => {
    return question.lessonId === 9 && classicalModernKeywordPattern.test(question.prompt);
  };

  const isTenGodStructureMisreadQuestion = (question: AnalyticsQuestionRow) => {
    return question.lessonId === 5 && tenGodStructureKeywordPattern.test(question.prompt);
  };

  const questions = loadQuestionAnalytics(db, args?.userId);
  const alerts: AnalyticsAlertRow[] = [];

  questions.forEach((question) => {
    if (question.attempts >= weakAttemptsThreshold && question.accuracyPercent <= weakAccuracyThreshold) {
      if (isClassicalModernConfusionQuestion(question)) {
        alerts.push({
          category: 'classical-modern-confusion',
          questionId: question.questionId,
          lessonId: question.lessonId,
          lessonTitle: question.lessonTitle,
          questionType: question.questionType,
          accuracyPercent: question.accuracyPercent,
          attempts: question.attempts,
          totalExposure: question.totalExposure,
        });
      }

      if (isTenGodStructureMisreadQuestion(question)) {
        alerts.push({
          category: 'ten-god-structure-misread',
          questionId: question.questionId,
          lessonId: question.lessonId,
          lessonTitle: question.lessonTitle,
          questionType: question.questionType,
          accuracyPercent: question.accuracyPercent,
          attempts: question.attempts,
          totalExposure: question.totalExposure,
        });
      }

      alerts.push({
        category: 'weak-question',
        questionId: question.questionId,
        lessonId: question.lessonId,
        lessonTitle: question.lessonTitle,
        questionType: question.questionType,
        accuracyPercent: question.accuracyPercent,
        attempts: question.attempts,
        totalExposure: question.totalExposure,
      });
    }

    if (question.totalExposure >= overusedExposureThreshold) {
      alerts.push({
        category: 'overused-question',
        questionId: question.questionId,
        lessonId: question.lessonId,
        lessonTitle: question.lessonTitle,
        questionType: question.questionType,
        accuracyPercent: question.accuracyPercent,
        attempts: question.attempts,
        totalExposure: question.totalExposure,
      });
    }
  });

  return alerts.sort((left, right) => {
    if (left.category !== right.category) {
      return categorySortOrder[left.category] - categorySortOrder[right.category];
    }

    if (left.category === 'overused-question') {
      return right.totalExposure - left.totalExposure;
    }

    if (left.category === 'classical-modern-confusion' || left.category === 'ten-god-structure-misread') {
      if (left.accuracyPercent !== right.accuracyPercent) {
        return left.accuracyPercent - right.accuracyPercent;
      }
      return right.attempts - left.attempts;
    }

    if (left.category === 'weak-question') {
      return left.accuracyPercent - right.accuracyPercent;
    }

    return 0;
  });
};
