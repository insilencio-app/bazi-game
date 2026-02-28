import { describe, expect, it } from 'vitest';
import { evaluateTotalQuizAnswer } from '../useTotalQuizSession';

describe('total quiz scoring logic', () => {
  it('awards score/streak/fast-correct on correct quick answer', () => {
    const result = evaluateTotalQuizAnswer({
      selectedAnswer: 1,
      correctAnswer: 1,
      currentStreak: 3,
      currentMaxStreak: 4,
      questionStartAt: 1_000,
      now: 20_000,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.nextStreak).toBe(4);
    expect(result.nextMaxStreak).toBe(4);
    expect(result.scoreDelta).toBe(1);
    expect(result.fastCorrectDelta).toBe(1);
  });

  it('resets streak and gives no score on wrong answer', () => {
    const result = evaluateTotalQuizAnswer({
      selectedAnswer: 0,
      correctAnswer: 1,
      currentStreak: 5,
      currentMaxStreak: 7,
      questionStartAt: 1_000,
      now: 10_000,
    });

    expect(result.isCorrect).toBe(false);
    expect(result.nextStreak).toBe(0);
    expect(result.nextMaxStreak).toBe(7);
    expect(result.scoreDelta).toBe(0);
    expect(result.fastCorrectDelta).toBe(0);
  });

  it('does not count as fast-correct after 30 seconds', () => {
    const result = evaluateTotalQuizAnswer({
      selectedAnswer: 1,
      correctAnswer: 1,
      currentStreak: 0,
      currentMaxStreak: 0,
      questionStartAt: 1_000,
      now: 35_100,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.scoreDelta).toBe(1);
    expect(result.fastCorrectDelta).toBe(0);
  });
});
