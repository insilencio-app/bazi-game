import { act, renderHook } from '@testing-library/react';
import { useProgressionStore, type UserProgress } from '../useProgressionStore';

type BadgeId = 'first-complete' | 'perfect-lesson' | 'total-quiz-mastered' | 'total-quiz-perfect';

const defaultProgress: UserProgress = {
  totalScore: 0,
  totalXp: 0,
  correctAnswers: 0,
  totalQuizMastered: 0,
  totalQuizPerfect: 0,
  totalQuizAttempts: 0,
  bestStreak: 0,
  fastCorrectAnswers: 0,
  dailyStreak: 0,
  lastPlayedDate: null,
  hintsUsed: 0,
  lessonPerformance: {},
  lessonRecentAnswers: {},
  lessonRecentWindowSize: {},
  lessonLatestPercent: {},
  totalQuizLatestPercent: null,
};

const getAchievedBadges = (
  progress: UserProgress,
  completedLessonIds: Set<number>,
  perfectLessonIds: Set<number>
): BadgeId[] => {
  const badges: BadgeId[] = [];

  if (completedLessonIds.size > 0) badges.push('first-complete');
  if (perfectLessonIds.size > 0) badges.push('perfect-lesson');
  if (progress.totalQuizMastered > 0) badges.push('total-quiz-mastered');
  if (progress.totalQuizPerfect > 0) badges.push('total-quiz-perfect');

  return badges;
};

describe('useProgressionStore', () => {
  it('awards lesson XP and updates completion/perfect badges', () => {
    const { result } = renderHook(() =>
      useProgressionStore<BadgeId>({
        storageKey: 'test-progression-lesson',
        defaultProgress,
        validBadgeIds: ['first-complete', 'perfect-lesson', 'total-quiz-mastered', 'total-quiz-perfect'],
        getLessonRecentWindowSize: () => 10,
        getAchievedBadges,
        xpConfig: {
          correctAnswerXp: 10,
          lessonCompleteXp: 30,
          perfectLessonBonusXp: 20,
          totalQuizMasteryBonusXp: 40,
          totalQuizPerfectBonusXp: 60,
          hintXpCost: 50,
        },
      })
    );

    act(() => {
      result.current.completeLesson(1, 5, 5);
    });

    expect(result.current.userProgress.totalXp).toBe(100);
    expect(result.current.userProgress.correctAnswers).toBe(5);
    expect(result.current.userProgress.totalScore).toBe(5);
    expect(result.current.userProgress.lessonLatestPercent[1]).toBe(100);
    expect(result.current.unlockedBadgeIds).toEqual(
      expect.arrayContaining(['first-complete', 'perfect-lesson'])
    );

    act(() => {
      result.current.completeLesson(1, 5, 5);
    });

    expect(result.current.userProgress.totalXp).toBe(150);
    expect(result.current.userProgress.totalScore).toBe(5);
  });

  it('applies total quiz completion metrics and XP bonuses', () => {
    const { result } = renderHook(() =>
      useProgressionStore<BadgeId>({
        storageKey: 'test-progression-total-quiz',
        defaultProgress,
        validBadgeIds: ['first-complete', 'perfect-lesson', 'total-quiz-mastered', 'total-quiz-perfect'],
        getLessonRecentWindowSize: () => 10,
        getAchievedBadges,
        xpConfig: {
          correctAnswerXp: 10,
          lessonCompleteXp: 30,
          perfectLessonBonusXp: 20,
          totalQuizMasteryBonusXp: 40,
          totalQuizPerfectBonusXp: 60,
          hintXpCost: 50,
        },
      })
    );

    act(() => {
      result.current.applyTotalQuizCompletion(8, 10, 5, 2);
    });

    expect(result.current.userProgress.totalXp).toBe(120);
    expect(result.current.userProgress.totalQuizMastered).toBe(1);
    expect(result.current.userProgress.totalQuizPerfect).toBe(0);
    expect(result.current.userProgress.totalQuizAttempts).toBe(1);
    expect(result.current.userProgress.bestStreak).toBe(5);
    expect(result.current.userProgress.fastCorrectAnswers).toBe(2);
    expect(result.current.userProgress.totalQuizLatestPercent).toBe(80);
    expect(result.current.unlockedBadgeIds).toContain('total-quiz-mastered');

    act(() => {
      result.current.applyTotalQuizCompletion(10, 10, 7, 3);
    });

    expect(result.current.userProgress.totalXp).toBe(320);
    expect(result.current.userProgress.totalQuizMastered).toBe(2);
    expect(result.current.userProgress.totalQuizPerfect).toBe(1);
    expect(result.current.userProgress.totalQuizAttempts).toBe(2);
    expect(result.current.userProgress.bestStreak).toBe(7);
    expect(result.current.userProgress.fastCorrectAnswers).toBe(5);
    expect(result.current.userProgress.totalQuizLatestPercent).toBe(100);
    expect(result.current.unlockedBadgeIds).toContain('total-quiz-perfect');
  });
});
