import { describe, expect, it } from 'vitest';
import { validateImportQuestions } from '../importValidation';

describe('validateImportQuestions', () => {
  it('passes valid mixed question payload', () => {
    const payload = [
      {
        lessonId: 1,
        type: 'mcq',
        prompt: '木生火是否正確？',
        mcq: {
          options: ['是', '否'],
          correctIndex: 0,
        },
      },
      {
        lessonId: 2,
        type: 'truefalse',
        prompt: '甲己屬於五合。',
        truefalse: { correct: true },
      },
      {
        lessonId: 3,
        type: 'match',
        prompt: '配對關係',
        match: {
          pairs: [
            { left: '六合', right: '子丑' },
            { left: '六沖', right: '子午' },
          ],
        },
      },
    ];

    const result = validateImportQuestions(payload);
    expect(result.errors).toHaveLength(0);
    expect(result.normalizedQuestions).toHaveLength(3);
  });

  it('returns errors for invalid question fields', () => {
    const payload = [
      {
        lessonId: -1,
        type: 'mcq',
        prompt: '',
        difficulty: 9,
        mcq: {
          options: ['A'],
          correctIndex: 3,
        },
      },
    ];

    const result = validateImportQuestions(payload);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((error) => error.code === 'LESSON_ID_INVALID')).toBe(true);
    expect(result.errors.some((error) => error.code === 'PROMPT_EMPTY')).toBe(true);
    expect(result.errors.some((error) => error.code === 'DIFFICULTY_INVALID')).toBe(true);
    expect(result.errors.some((error) => error.code === 'MCQ_OPTIONS_TOO_FEW')).toBe(true);
    expect(result.errors.some((error) => error.code === 'MCQ_CORRECT_INDEX_INVALID')).toBe(true);
  });

  it('returns warnings for duplicated prompt in same lesson/type', () => {
    const payload = [
      {
        lessonId: 2,
        type: 'truefalse',
        prompt: '甲己屬於五合。',
        truefalse: { correct: true },
      },
      {
        lessonId: 2,
        type: 'truefalse',
        prompt: '  甲己屬於五合。 ',
        truefalse: { correct: true },
      },
    ];

    const result = validateImportQuestions(payload);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((warning) => warning.code === 'PROMPT_DUPLICATED')).toBe(true);
  });
});
