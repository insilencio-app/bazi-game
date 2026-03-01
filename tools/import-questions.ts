import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { validateImportQuestions, type ImportQuestion } from '../src/content/importValidation';

type CliOptions = {
  inputPath: string;
  dryRun: boolean;
  upsert: boolean;
};

const dbPath = path.join(process.cwd(), 'database', 'bazi.sqlite');

const normalizeIdPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const generateQuestionId = (question: ImportQuestion, index: number): string => {
  const promptPart = normalizeIdPart(question.prompt);
  return `import-l${question.lessonId}-${question.type}-${promptPart || 'q'}-${index + 1}`;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const inputPathArg = args.find((arg) => !arg.startsWith('--'));

  if (!inputPathArg) {
    console.error('Usage: npm run content:import -- <path-to-json-file> [--dry-run] [--upsert]');
    process.exit(1);
  }

  return {
    inputPath: path.resolve(process.cwd(), inputPathArg),
    dryRun: args.includes('--dry-run'),
    upsert: args.includes('--upsert'),
  };
};

const loadJsonFile = (filePath: string): unknown => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
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
  const raw = loadJsonFile(options.inputPath);
  const validation = validateImportQuestions(raw);

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

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  try {
    ensureDbReady(db);

    const lessonRows = db.prepare('SELECT id FROM lessons').all() as Array<{ id: number }>;
    const lessonSet = new Set(lessonRows.map((lesson) => lesson.id));

    const normalizedWithIds = validation.normalizedQuestions.map((question, index) => ({
      ...question,
      id: (question.id?.trim() || generateQuestionId(question, index)).trim(),
    }));

    if (normalizedWithIds.length === 0) {
      console.log('No questions to import.');
      return;
    }

    const duplicateGeneratedId = new Set<string>();
    normalizedWithIds.forEach((question) => {
      if (duplicateGeneratedId.has(question.id)) {
        throw new Error(`Duplicate resolved question id: ${question.id}`);
      }
      duplicateGeneratedId.add(question.id);
    });

    normalizedWithIds.forEach((question) => {
      if (!lessonSet.has(question.lessonId)) {
        throw new Error(`Unknown lessonId ${question.lessonId} for question id ${question.id}`);
      }
    });

    const existingRows = db
      .prepare(
        `
        SELECT id FROM questions WHERE id IN (${normalizedWithIds.map(() => '?').join(',')})
        `
      )
      .all(...normalizedWithIds.map((question) => question.id)) as Array<{ id: string }>;

    const existingIds = new Set(existingRows.map((row) => row.id));
    const insertCount = normalizedWithIds.filter((question) => !existingIds.has(question.id)).length;
    const updateCount = normalizedWithIds.length - insertCount;

    if (updateCount > 0 && !options.upsert) {
      const conflictIds = normalizedWithIds
        .filter((question) => existingIds.has(question.id))
        .map((question) => question.id)
        .join(', ');
      throw new Error(`Existing question ids found (use --upsert): ${conflictIds}`);
    }

    if (options.dryRun) {
      console.log(
        `Dry run successful. total=${normalizedWithIds.length}, toInsert=${insertCount}, toUpdate=${updateCount}, upsert=${options.upsert}`
      );
      return;
    }

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

    const tx = db.transaction(() => {
      normalizedWithIds.forEach((question) => {
        upsertQuestion.run(
          question.id,
          question.lessonId,
          question.type,
          question.prompt,
          question.explanation ?? '',
          question.hint ?? null,
          question.difficulty ?? 2
        );

        deleteOptions.run(question.id);
        deleteTf.run(question.id);
        deleteMatch.run(question.id);
        deleteTags.run(question.id);

        if (question.type === 'mcq' && question.mcq) {
          question.mcq.options.forEach((option, optionIndex) => {
            insertOption.run(question.id, optionIndex, option.trim(), optionIndex === question.mcq!.correctIndex ? 1 : 0);
          });
        }

        if (question.type === 'truefalse' && question.truefalse) {
          insertTf.run(question.id, question.truefalse.correct ? 1 : 0);
        }

        if (question.type === 'match' && question.match) {
          question.match.pairs.forEach((pair, pairIndex) => {
            insertMatch.run(question.id, pairIndex, pair.left.trim(), pair.right.trim());
          });
        }

        (question.tags ?? []).forEach((tag) => {
          insertTag.run(question.id, tag);
        });
      });
    });

    tx();

    console.log(
      `Import successful. total=${normalizedWithIds.length}, inserted=${insertCount}, updated=${updateCount}, upsert=${options.upsert}`
    );
  } finally {
    db.close();
  }
};

run();
