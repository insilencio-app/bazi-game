import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

type ExportQuestionType = 'mcq' | 'truefalse' | 'match';

type ExportQuestion = {
  id: string;
  lessonId: number;
  type: ExportQuestionType;
  prompt: string;
  explanation?: string;
  hint?: string;
  difficulty: number;
  tags: string[];
  mcq?: {
    options: string[];
    correctIndex: number;
  };
  truefalse?: {
    correct: boolean;
  };
  match?: {
    pairs: Array<{ left: string; right: string }>;
  };
};

type CliOptions = {
  outputPath?: string;
  lessonId?: number;
};

const dbPath = path.join(process.cwd(), 'database', 'bazi.sqlite');

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;
  let lessonId: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--out') {
      outputPath = args[index + 1] ? path.resolve(process.cwd(), args[index + 1]) : undefined;
      index += 1;
      continue;
    }

    if (arg === '--lessonId') {
      const parsed = Number(args[index + 1]);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error('--lessonId must be a non-negative integer');
      }
      lessonId = parsed;
      index += 1;
    }
  }

  return { outputPath, lessonId };
};

const ensureDbReady = (db: Database.Database) => {
  const hasQuestionsTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'")
    .get() as { name: string } | undefined;

  if (!hasQuestionsTable) {
    throw new Error('Database schema not found. Run API once to initialize migrations.');
  }
};

const buildQuestionExport = (
  db: Database.Database,
  question: {
    id: string;
    lesson_id: number;
    type: ExportQuestionType;
    prompt: string;
    explanation: string;
    hint: string | null;
    difficulty: number;
  }
): ExportQuestion => {
  const tags = db
    .prepare('SELECT tag FROM question_tags WHERE question_id = ? ORDER BY tag ASC')
    .all(question.id) as Array<{ tag: string }>;

  const payload: ExportQuestion = {
    id: question.id,
    lessonId: question.lesson_id,
    type: question.type,
    prompt: question.prompt,
    explanation: question.explanation || undefined,
    hint: question.hint ?? undefined,
    difficulty: question.difficulty,
    tags: tags.map((item) => item.tag),
  };

  if (question.type === 'mcq') {
    const options = db
      .prepare(
        'SELECT option_index, text, is_correct FROM question_options WHERE question_id = ? ORDER BY option_index ASC'
      )
      .all(question.id) as Array<{ option_index: number; text: string; is_correct: number }>;

    payload.mcq = {
      options: options.map((option) => option.text),
      correctIndex: options.find((option) => option.is_correct === 1)?.option_index ?? 0,
    };
  }

  if (question.type === 'truefalse') {
    const answer = db
      .prepare('SELECT correct FROM question_true_false WHERE question_id = ?')
      .get(question.id) as { correct: number } | undefined;

    payload.truefalse = {
      correct: Boolean(answer?.correct),
    };
  }

  if (question.type === 'match') {
    const pairs = db
      .prepare(
        'SELECT pair_index, left_text, right_text FROM question_match_pairs WHERE question_id = ? ORDER BY pair_index ASC'
      )
      .all(question.id) as Array<{ pair_index: number; left_text: string; right_text: string }>;

    payload.match = {
      pairs: pairs.map((pair) => ({ left: pair.left_text, right: pair.right_text })),
    };
  }

  return payload;
};

const run = () => {
  const options = parseArgs();
  const db = new Database(dbPath);

  try {
    ensureDbReady(db);

    const whereClause = options.lessonId !== undefined ? 'WHERE lesson_id = ?' : '';
    const questions = db
      .prepare(
        `
        SELECT id, lesson_id, type, prompt, explanation, hint, difficulty
        FROM questions
        ${whereClause}
        ORDER BY lesson_id ASC, id ASC
        `
      )
      .all(...(options.lessonId !== undefined ? [options.lessonId] : [])) as Array<{
      id: string;
      lesson_id: number;
      type: ExportQuestionType;
      prompt: string;
      explanation: string;
      hint: string | null;
      difficulty: number;
    }>;

    const output = questions.map((question) => buildQuestionExport(db, question));
    const json = `${JSON.stringify(output, null, 2)}\n`;

    if (options.outputPath) {
      const dirPath = path.dirname(options.outputPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(options.outputPath, json, 'utf8');
      console.log(`Exported ${output.length} questions to ${options.outputPath}`);
      return;
    }

    process.stdout.write(json);
    console.error(`Exported ${output.length} questions.`);
  } finally {
    db.close();
  }
};

run();
