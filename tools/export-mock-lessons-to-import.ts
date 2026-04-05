import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mockLessons } from '../src/data/mockData';
import type { ImportQuestion } from '../src/content/importValidation';

type CliOptions = {
  outputPath: string;
  lessonIds: number[];
};

export const resolveLessonIds = (lessonIdsArg?: string): number[] => {
  if (!lessonIdsArg) {
    return mockLessons.map((lesson) => lesson.id).sort((left, right) => left - right);
  }

  const lessonIds = Array.from(
    new Set(
      lessonIdsArg
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value >= 0)
    )
  ).sort((left, right) => left - right);

  if (lessonIds.length === 0) {
    throw new Error('No valid lesson ids provided.');
  }

  return lessonIds;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;
  let lessonIdsArg: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--out') {
      outputPath = args[index + 1] ? path.resolve(process.cwd(), args[index + 1]) : undefined;
      index += 1;
      continue;
    }

    if (arg === '--lessonIds') {
      lessonIdsArg = args[index + 1];
      index += 1;
    }
  }

  if (!outputPath) {
    throw new Error('Missing --out <path>.');
  }

  const lessonIds = resolveLessonIds(lessonIdsArg);

  return { outputPath, lessonIds };
};

export const buildImportQuestionsFromMockLessons = (lessonIds: number[]): ImportQuestion[] => {
  return mockLessons
    .filter((lesson) => lessonIds.includes(lesson.id))
    .flatMap((lesson) => {
      const mcqQuestions: ImportQuestion[] = lesson.questionBank.map((question) => ({
        id: `mock-l${lesson.id}-mcq-${question.id}`,
        lessonId: lesson.id,
        type: 'mcq',
        prompt: question.question,
        explanation: question.explanation,
        difficulty: 2,
        tags: ['mock-sync'],
        mcq: {
          options: question.options,
          correctIndex: question.correct,
        },
      }));

      const trueFalseQuestions: ImportQuestion[] = lesson.trueFalseBank.map((question) => ({
        id: `mock-l${lesson.id}-truefalse-${question.id}`,
        lessonId: lesson.id,
        type: 'truefalse',
        prompt: question.question,
        explanation: question.explanation,
        difficulty: 2,
        tags: ['mock-sync'],
        truefalse: {
          correct: question.correct,
        },
      }));

      const matchQuestions: ImportQuestion[] = lesson.matchBank.map((question) => ({
        id: `mock-l${lesson.id}-match-${question.id}`,
        lessonId: lesson.id,
        type: 'match',
        prompt: question.prompt,
        difficulty: 2,
        tags: ['mock-sync'],
        match: {
          pairs: question.pairs,
        },
      }));

      return [...mcqQuestions, ...trueFalseQuestions, ...matchQuestions];
    });
};

const run = () => {
  const options = parseArgs();
  const questions = buildImportQuestionsFromMockLessons(options.lessonIds);

  const outputDir = path.dirname(options.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(options.outputPath, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
  console.log(`Exported ${questions.length} questions for lessons ${options.lessonIds.join(', ')} to ${options.outputPath}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}