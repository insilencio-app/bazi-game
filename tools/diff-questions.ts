import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { validateImportQuestions, type ImportQuestion } from '../src/content/importValidation';

type DiffTargetQuestion = ImportQuestion & { id: string };

type QuestionSnapshot = {
  id: string;
  lessonId: number;
  type: 'mcq' | 'truefalse' | 'match';
  prompt: string;
  explanation?: string;
  hint?: string;
  difficulty: number;
  tags: string[];
  mcq?: { options: string[]; correctIndex: number };
  truefalse?: { correct: boolean };
  match?: { pairs: Array<{ left: string; right: string }> };
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

const parseInputPath = (): string => {
  const arg = process.argv.slice(2).find((item) => !item.startsWith('--'));
  if (!arg) {
    console.error('Usage: npm run content:diff -- <path-to-json-file>');
    process.exit(1);
  }

  return path.resolve(process.cwd(), arg);
};

const loadJson = (filePath: string): unknown => {
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

const loadQuestionSnapshot = (db: Database.Database, questionId: string): QuestionSnapshot | null => {
  const base = db
    .prepare('SELECT id, lesson_id, type, prompt, explanation, hint, difficulty FROM questions WHERE id = ?')
    .get(questionId) as
    | {
        id: string;
        lesson_id: number;
        type: 'mcq' | 'truefalse' | 'match';
        prompt: string;
        explanation: string;
        hint: string | null;
        difficulty: number;
      }
    | undefined;

  if (!base) return null;

  const tags = db
    .prepare('SELECT tag FROM question_tags WHERE question_id = ? ORDER BY tag ASC')
    .all(questionId) as Array<{ tag: string }>;

  const snapshot: QuestionSnapshot = {
    id: base.id,
    lessonId: base.lesson_id,
    type: base.type,
    prompt: base.prompt,
    explanation: base.explanation || undefined,
    hint: base.hint || undefined,
    difficulty: base.difficulty,
    tags: tags.map((row) => row.tag),
  };

  if (base.type === 'mcq') {
    const options = db
      .prepare('SELECT option_index, text, is_correct FROM question_options WHERE question_id = ? ORDER BY option_index ASC')
      .all(questionId) as Array<{ option_index: number; text: string; is_correct: number }>;

    snapshot.mcq = {
      options: options.map((row) => row.text),
      correctIndex: options.find((row) => row.is_correct === 1)?.option_index ?? 0,
    };
  }

  if (base.type === 'truefalse') {
    const tf = db
      .prepare('SELECT correct FROM question_true_false WHERE question_id = ?')
      .get(questionId) as { correct: number } | undefined;
    snapshot.truefalse = { correct: Boolean(tf?.correct) };
  }

  if (base.type === 'match') {
    const pairs = db
      .prepare('SELECT pair_index, left_text, right_text FROM question_match_pairs WHERE question_id = ? ORDER BY pair_index ASC')
      .all(questionId) as Array<{ pair_index: number; left_text: string; right_text: string }>;
    snapshot.match = {
      pairs: pairs.map((row) => ({ left: row.left_text, right: row.right_text })),
    };
  }

  return snapshot;
};

const toComparable = (question: DiffTargetQuestion | QuestionSnapshot): string => {
  return JSON.stringify({
    lessonId: question.lessonId,
    type: question.type,
    prompt: question.prompt,
    explanation: question.explanation ?? '',
    hint: question.hint ?? '',
    difficulty: question.difficulty ?? 2,
    tags: [...(question.tags ?? [])].sort(),
    mcq: question.mcq
      ? {
          options: question.mcq.options,
          correctIndex: question.mcq.correctIndex,
        }
      : undefined,
    truefalse: question.truefalse,
    match: question.match
      ? {
          pairs: question.match.pairs,
        }
      : undefined,
  });
};

const run = () => {
  const inputPath = parseInputPath();
  const raw = loadJson(inputPath);
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

  const candidateQuestions: DiffTargetQuestion[] = validation.normalizedQuestions.map((question, index) => ({
    ...question,
    id: (question.id?.trim() || generateQuestionId(question, index)).trim(),
  }));

  const db = new Database(dbPath);

  try {
    ensureDbReady(db);

    const incomingIds = new Set(candidateQuestions.map((question) => question.id));
    const existingRows = db
      .prepare('SELECT id FROM questions')
      .all() as Array<{ id: string }>;

    const existingIds = new Set(existingRows.map((row) => row.id));

    const creates: string[] = [];
    const updates: Array<{ id: string; reason: string }> = [];
    const unchanged: string[] = [];

    candidateQuestions.forEach((question) => {
      if (!existingIds.has(question.id)) {
        creates.push(question.id);
        return;
      }

      const current = loadQuestionSnapshot(db, question.id);
      if (!current) {
        creates.push(question.id);
        return;
      }

      const nextComparable = toComparable(question);
      const currentComparable = toComparable(current);

      if (nextComparable === currentComparable) {
        unchanged.push(question.id);
      } else {
        updates.push({ id: question.id, reason: 'content-changed' });
      }
    });

    const deletes = existingRows
      .map((row) => row.id)
      .filter((id) => !incomingIds.has(id));

    console.log(`Diff summary for ${path.basename(inputPath)}:`);
    console.log(`  create: ${creates.length}`);
    console.log(`  update: ${updates.length}`);
    console.log(`  unchanged: ${unchanged.length}`);
    console.log(`  delete (db-only): ${deletes.length}`);

    if (creates.length > 0) {
      console.log('Create IDs:');
      creates.slice(0, 25).forEach((id) => console.log(`  + ${id}`));
      if (creates.length > 25) console.log(`  ... and ${creates.length - 25} more`);
    }

    if (updates.length > 0) {
      console.log('Update IDs:');
      updates.slice(0, 25).forEach((item) => console.log(`  ~ ${item.id} (${item.reason})`));
      if (updates.length > 25) console.log(`  ... and ${updates.length - 25} more`);
    }

    if (deletes.length > 0) {
      console.log('Delete candidates (in DB but not input):');
      deletes.slice(0, 25).forEach((id) => console.log(`  - ${id}`));
      if (deletes.length > 25) console.log(`  ... and ${deletes.length - 25} more`);
    }
  } finally {
    db.close();
  }
};

run();
