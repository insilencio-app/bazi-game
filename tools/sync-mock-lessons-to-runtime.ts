import path from 'node:path';
import Database from 'better-sqlite3';
import { mockLessons } from '../src/data/mockData';
import { validateImportQuestions } from '../src/content/importValidation';
import {
  buildImportQuestionsFromMockLessons,
  resolveLessonIds,
} from './export-mock-lessons-to-import';

type CliOptions = {
  lessonIds: number[];
  dryRun: boolean;
};

const dbPath = path.join(process.cwd(), 'database', 'bazi.sqlite');

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const lessonIdsArgIndex = args.findIndex((arg) => arg === '--lessonIds');
  const lessonIdsArg = lessonIdsArgIndex >= 0 ? args[lessonIdsArgIndex + 1] : undefined;

  return {
    lessonIds: resolveLessonIds(lessonIdsArg),
    dryRun: args.includes('--dry-run'),
  };
};

const ensureDbReady = (db: Database.Database) => {
  const hasQuestionsTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'")
    .get() as { name: string } | undefined;

  if (!hasQuestionsTable) {
    throw new Error('Database schema not found. Run API once to initialize migrations.');
  }
};

const run = () => {
  const options = parseArgs();
  const payload = buildImportQuestionsFromMockLessons(options.lessonIds);
  const validation = validateImportQuestions(payload);

  if (validation.warnings.length > 0) {
    console.warn(`Warnings: ${validation.warnings.length}`);
    validation.warnings.forEach((warning) => {
      console.warn(`  [#${warning.index + 1}] ${warning.code} - ${warning.message}`);
    });
  }

  if (validation.errors.length > 0) {
    console.error(`Errors: ${validation.errors.length}`);
    validation.errors.forEach((error) => {
      console.error(`  [#${error.index + 1}] ${error.code} - ${error.message}`);
    });
    process.exit(1);
  }

  if (validation.normalizedQuestions.length === 0) {
    console.log('No questions to sync.');
    return;
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  try {
    ensureDbReady(db);

    const placeholders = options.lessonIds.map(() => '?').join(',');
    const existingRows = db
      .prepare(`SELECT id FROM questions WHERE id IN (${validation.normalizedQuestions.map(() => '?').join(',')})`)
      .all(...validation.normalizedQuestions.map((question) => question.id ?? '')) as Array<{ id: string }>;
    const existingIdSet = new Set(existingRows.map((row) => row.id));

    const lessonMap = new Map(mockLessons.map((lesson) => [lesson.id, lesson.title_cn]));
    const insertLesson = db.prepare(
      `
      INSERT INTO lessons (id, title_cn)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET title_cn = excluded.title_cn
      `
    );

    const retireQuestions = db.prepare(
      `
      UPDATE questions
      SET status = 'retired'
      WHERE status = 'active' AND lesson_id IN (${placeholders})
      `
    );

    const upsertQuestion = db.prepare(
      `
      INSERT INTO questions (id, lesson_id, type, prompt, explanation, hint, difficulty, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      ON CONFLICT(id) DO UPDATE SET
        lesson_id = excluded.lesson_id,
        type = excluded.type,
        prompt = excluded.prompt,
        explanation = excluded.explanation,
        hint = excluded.hint,
        difficulty = excluded.difficulty,
        status = 'active'
      `
    );

    const deleteOptions = db.prepare('DELETE FROM question_options WHERE question_id = ?');
    const deleteTf = db.prepare('DELETE FROM question_true_false WHERE question_id = ?');
    const deleteMatch = db.prepare('DELETE FROM question_match_pairs WHERE question_id = ?');
    const deleteTags = db.prepare('DELETE FROM question_tags WHERE question_id = ?');

    const insertOption = db.prepare(
      'INSERT INTO question_options (question_id, option_index, text, is_correct) VALUES (?, ?, ?, ?)'
    );
    const insertTf = db.prepare('INSERT INTO question_true_false (question_id, correct) VALUES (?, ?)');
    const insertMatch = db.prepare(
      'INSERT INTO question_match_pairs (question_id, pair_index, left_text, right_text) VALUES (?, ?, ?, ?)'
    );
    const insertTag = db.prepare('INSERT INTO question_tags (question_id, tag) VALUES (?, ?)');

    if (options.dryRun) {
      const insertCount = validation.normalizedQuestions.filter((question) => !existingIdSet.has(question.id ?? '')).length;
      const updateCount = validation.normalizedQuestions.length - insertCount;
      console.log(
        `Dry run successful. lessons=${options.lessonIds.join(',')}, total=${validation.normalizedQuestions.length}, toInsert=${insertCount}, toUpdate=${updateCount}`
      );
      return;
    }

    const transaction = db.transaction(() => {
      options.lessonIds.forEach((lessonId) => {
        insertLesson.run(lessonId, lessonMap.get(lessonId) ?? `第${lessonId}課`);
      });

      retireQuestions.run(...options.lessonIds);

      validation.normalizedQuestions.forEach((question) => {
        const questionId = question.id?.trim();
        if (!questionId) {
          throw new Error(`Question id missing during sync (lessonId=${question.lessonId})`);
        }

        upsertQuestion.run(
          questionId,
          question.lessonId,
          question.type,
          question.prompt,
          question.explanation ?? '',
          question.hint ?? null,
          question.difficulty ?? 2
        );

        deleteOptions.run(questionId);
        deleteTf.run(questionId);
        deleteMatch.run(questionId);
        deleteTags.run(questionId);

        if (question.type === 'mcq' && question.mcq) {
          question.mcq.options.forEach((option, optionIndex) => {
            insertOption.run(questionId, optionIndex, option, optionIndex === question.mcq!.correctIndex ? 1 : 0);
          });
        }

        if (question.type === 'truefalse' && question.truefalse) {
          insertTf.run(questionId, question.truefalse.correct ? 1 : 0);
        }

        if (question.type === 'match' && question.match) {
          question.match.pairs.forEach((pair, pairIndex) => {
            insertMatch.run(questionId, pairIndex, pair.left, pair.right);
          });
        }

        (question.tags ?? []).forEach((tag) => {
          insertTag.run(questionId, tag);
        });
      });
    });

    transaction();

    const insertCount = validation.normalizedQuestions.filter((question) => !existingIdSet.has(question.id ?? '')).length;
    const updateCount = validation.normalizedQuestions.length - insertCount;

    console.log(
      `Sync successful. lessons=${options.lessonIds.join(',')}, total=${validation.normalizedQuestions.length}, inserted=${insertCount}, updated=${updateCount}`
    );
  } finally {
    db.close();
  }
};

run();