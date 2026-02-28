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
  it('calculates lesson XP with completion and perfect bonuses only on first completion', () => {
    const firstCompletionXp = calculateLessonEarnedXp(5, true, true, xpConfig);
    const repeatCompletionXp = calculateLessonEarnedXp(5, false, true, xpConfig);

    expect(firstCompletionXp).toBe(100);
    expect(repeatCompletionXp).toBe(50);
  });

  it('calculates total quiz XP with mastery/perfect thresholds', () => {
    const masteredXp = calculateTotalQuizEarnedXp(8, 80, xpConfig);
    const perfectXp = calculateTotalQuizEarnedXp(10, 100, xpConfig);

    expect(masteredXp).toBe(120);
    expect(perfectXp).toBe(200);
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
