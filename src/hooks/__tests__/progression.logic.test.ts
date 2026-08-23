import { describe, expect, it } from 'vitest';
import {
  applyDailyPlay,
  calculateLessonEarnedXp,
  calculateTotalQuizEarnedXp,
  getNewBadgeIds,
  type UserProgress,
} from '../useProgressionStore';

const xpConfig = {
  correctAnswerXp: 10,
  lessonCompleteXp: 30,
  perfectLessonBonusXp: 20,
  totalQuizMasteryBonusXp: 40,
  totalQuizPerfectBonusXp: 60,
  hintXpCost: 50,
};

describe('progression logic', () => {
  it('calculates lesson completion and perfect bonuses without re-awarding per-question XP', () => {
    const firstCompletionXp = calculateLessonEarnedXp(true, true, xpConfig);
    const repeatCompletionXp = calculateLessonEarnedXp(false, true, xpConfig);

    expect(firstCompletionXp).toBe(50);
    expect(repeatCompletionXp).toBe(0);
  });

  it('calculates total quiz mastery and perfect bonuses without re-awarding per-question XP', () => {
    const masteredXp = calculateTotalQuizEarnedXp(80, xpConfig);
    const perfectXp = calculateTotalQuizEarnedXp(100, xpConfig);

    expect(masteredXp).toBe(40);
    expect(perfectXp).toBe(100);
  });

  it('returns only newly unlocked badges', () => {
    const achieved = ['a', 'b', 'c'] as const;
    const unlocked = ['b'] as const;

    const newBadges = getNewBadgeIds([...achieved], [...unlocked]);

    expect(newBadges).toEqual(['a', 'c']);
  });

  it('increments daily streak for consecutive day and resets after gap', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const base: UserProgress = {
      totalScore: 0,
      totalXp: 0,
      correctAnswers: 0,
      totalQuizMastered: 0,
      totalQuizPerfect: 0,
      totalQuizAttempts: 0,
      bestStreak: 0,
      fastCorrectAnswers: 0,
      dailyStreak: 4,
      lastPlayedDate: `${yesterday.getFullYear()}-${`${yesterday.getMonth() + 1}`.padStart(2, '0')}-${`${yesterday.getDate()}`.padStart(2, '0')}`,
      hintsUsed: 0,
      lessonPerformance: {},
      lessonRecentAnswers: {},
      lessonRecentWindowSize: {},
      lessonLatestPercent: {},
      totalQuizLatestPercent: null,
    };

    const consecutive = applyDailyPlay(base);
    expect(consecutive.dailyStreak).toBe(5);

    const gapped = applyDailyPlay({
      ...base,
      lastPlayedDate: `${twoDaysAgo.getFullYear()}-${`${twoDaysAgo.getMonth() + 1}`.padStart(2, '0')}-${`${twoDaysAgo.getDate()}`.padStart(2, '0')}`,
    });
    expect(gapped.dailyStreak).toBe(1);
  });
});
