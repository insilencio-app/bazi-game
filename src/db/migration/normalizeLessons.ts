import { mockLessons } from '../../data/mockData';
import type { LessonMatch, LessonQuestion, LessonTrueFalse, LessonWithBanks } from '../../types/domain';
import type {
  LessonRow,
  NormalizedQuizDataset,
  QuestionMatchPairRow,
  QuestionOptionRow,
  QuestionRow,
  QuestionTagRow,
  QuestionTrueFalseRow,
} from '../schema';

const toQuestionId = (lessonId: number, type: 'mcq' | 'truefalse' | 'match', bankId: number) =>
  `lesson-${lessonId}-${type}-${bankId}`;

const cleanText = (value: string | undefined): string => (value ?? '').trim();

const inferDifficulty = (prompt: string): 1 | 2 | 3 | 4 | 5 => {
  const text = prompt.trim();
  if (text.length >= 80) return 4;
  if (text.length >= 50) return 3;
  return 2;
};

export const normalizeLessonsToDataset = (): NormalizedQuizDataset => {
  const lessons: LessonRow[] = [];
  const questions: QuestionRow[] = [];
  const options: QuestionOptionRow[] = [];
  const trueFalseAnswers: QuestionTrueFalseRow[] = [];
  const matchPairs: QuestionMatchPairRow[] = [];
  const tags: QuestionTagRow[] = [];

  (mockLessons as LessonWithBanks[]).forEach((lesson) => {
    lessons.push({
      id: lesson.id,
      titleCn: cleanText(lesson.title_cn) || `課程 ${lesson.id}`,
    });

    const mcqBank = Array.isArray(lesson.questionBank) ? lesson.questionBank : [];
    const tfBank = Array.isArray(lesson.trueFalseBank) ? lesson.trueFalseBank : [];
    const matchBank = Array.isArray(lesson.matchBank) ? lesson.matchBank : [];

    mcqBank.forEach((entry: LessonQuestion) => {
      const questionId = toQuestionId(lesson.id, 'mcq', entry.id);
      const prompt = cleanText(entry.question);
      const explanation = cleanText(entry.explanation);

      questions.push({
        id: questionId,
        lessonId: lesson.id,
        type: 'mcq',
        prompt,
        explanation,
        hint: cleanText(entry.hint) || null,
        difficulty: inferDifficulty(prompt),
        status: 'active',
      });

      entry.options.forEach((option, optionIndex) => {
        options.push({
          questionId,
          optionIndex,
          text: cleanText(option),
          isCorrect: optionIndex === entry.correct,
        });
      });
    });

    tfBank.forEach((entry: LessonTrueFalse) => {
      const questionId = toQuestionId(lesson.id, 'truefalse', entry.id);
      const prompt = cleanText(entry.question);

      questions.push({
        id: questionId,
        lessonId: lesson.id,
        type: 'truefalse',
        prompt,
        explanation: cleanText(entry.explanation),
        hint: cleanText(entry.hint) || null,
        difficulty: inferDifficulty(prompt),
        status: 'active',
      });

      trueFalseAnswers.push({
        questionId,
        correct: entry.correct,
      });
    });

    matchBank.forEach((entry: LessonMatch) => {
      const questionId = toQuestionId(lesson.id, 'match', entry.id);
      const prompt = cleanText(entry.prompt);

      questions.push({
        id: questionId,
        lessonId: lesson.id,
        type: 'match',
        prompt,
        explanation: '',
        hint: null,
        difficulty: inferDifficulty(prompt),
        status: 'active',
      });

      entry.pairs.forEach((pair, pairIndex) => {
        matchPairs.push({
          questionId,
          pairIndex,
          leftText: cleanText(pair.left),
          rightText: cleanText(pair.right),
        });
      });
    });

    const titleTag = cleanText(lesson.title_cn);
    if (titleTag) {
      const lessonQuestionIds = questions
        .filter((question) => question.lessonId === lesson.id)
        .map((question) => question.id);

      lessonQuestionIds.forEach((questionId) => {
        tags.push({ questionId, tag: titleTag });
      });
    }
  });

  return {
    lessons,
    questions,
    options,
    trueFalseAnswers,
    matchPairs,
    tags,
  };
};
