import { describe, expect, it } from 'vitest';
import { normalizeLessonsToDataset } from '../migration/normalizeLessons';

describe('normalizeLessonsToDataset', () => {
  it('creates normalized rows for all supported question types', () => {
    const dataset = normalizeLessonsToDataset();

    expect(dataset.lessons.length).toBe(8);

    const typeCounts = dataset.questions.reduce(
      (accumulator, question) => {
        accumulator[question.type] += 1;
        return accumulator;
      },
      { mcq: 0, truefalse: 0, match: 0 }
    );

    expect(typeCounts.mcq).toBeGreaterThan(0);
    expect(typeCounts.truefalse).toBeGreaterThan(0);
    expect(typeCounts.match).toBeGreaterThan(0);
  });

  it('uses unique question ids and valid answer mappings', () => {
    const dataset = normalizeLessonsToDataset();

    const questionIds = dataset.questions.map((question) => question.id);
    expect(new Set(questionIds).size).toBe(questionIds.length);

    const mcqQuestionIds = new Set(dataset.questions.filter((question) => question.type === 'mcq').map((question) => question.id));

    mcqQuestionIds.forEach((questionId) => {
      const questionOptions = dataset.options.filter((option) => option.questionId === questionId);
      const correctCount = questionOptions.filter((option) => option.isCorrect).length;

      expect(questionOptions.length).toBeGreaterThanOrEqual(2);
      expect(correctCount).toBe(1);
    });

    const trueFalseQuestionIds = new Set(
      dataset.questions.filter((question) => question.type === 'truefalse').map((question) => question.id)
    );

    trueFalseQuestionIds.forEach((questionId) => {
      const answer = dataset.trueFalseAnswers.find((item) => item.questionId === questionId);
      expect(answer).toBeDefined();
    });

    const matchQuestionIds = new Set(dataset.questions.filter((question) => question.type === 'match').map((question) => question.id));

    matchQuestionIds.forEach((questionId) => {
      const pairs = dataset.matchPairs.filter((item) => item.questionId === questionId);
      expect(pairs.length).toBeGreaterThan(0);
    });
  });
});
