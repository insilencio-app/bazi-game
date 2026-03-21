import React from 'react';

export type UserProgress = {
  totalScore: number;
  totalXp: number;
  correctAnswers: number;
  totalQuizMastered: number;
  totalQuizPerfect: number;
  totalQuizAttempts: number;
  bestStreak: number;
  fastCorrectAnswers: number;
  dailyStreak: number;
  lastPlayedDate: string | null;
  hintsUsed: number;
  lessonPerformance: Record<number, { attempts: number; correct: number }>;
  lessonRecentAnswers: Record<number, boolean[]>;
  lessonRecentWindowSize: Record<number, number>;
  lessonLatestPercent: Record<number, number>;
  totalQuizLatestPercent: number | null;
};

type PersistedProgress<TBadgeId extends string> = {
  userProgress: UserProgress;
  completedLessonIds: number[];
  perfectLessonIds: number[];
  highScoreLessonIds: number[];
  lessonAttemptCounts: Record<string, number>;
  unlockedBadgeIds: TBadgeId[];
};

interface UseProgressionStoreParams<TBadgeId extends string> {
  storageKey: string;
  defaultProgress: UserProgress;
  validBadgeIds: readonly TBadgeId[];
  getLessonRecentWindowSize: (lessonId: number) => number;
  getAchievedBadges: (
    progress: UserProgress,
    completedLessonIds: Set<number>,
    perfectLessonIds: Set<number>,
    highScoreLessonIds: Set<number>,
    lessonAttemptCounts: Record<number, number>
  ) => TBadgeId[];
  xpConfig: {
    correctAnswerXp: number;
    lessonCompleteXp: number;
    perfectLessonBonusXp: number;
    totalQuizMasteryBonusXp: number;
    totalQuizPerfectBonusXp: number;
    hintXpCost: number;
  };
}

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const applyDailyPlay = (progress: UserProgress): UserProgress => {
  const todayKey = getDateKey();
  if (progress.lastPlayedDate === todayKey) return progress;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);
  const nextStreak = progress.lastPlayedDate === yesterdayKey ? progress.dailyStreak + 1 : 1;

  return {
    ...progress,
    dailyStreak: nextStreak,
    lastPlayedDate: todayKey,
  };
};

export const calculateLessonEarnedXp = (
  score: number,
  isNewCompletion: boolean,
  isPerfectLesson: boolean,
  xpConfig: UseProgressionStoreParams<string>['xpConfig']
): number => {
  return (
    score * xpConfig.correctAnswerXp +
    (isNewCompletion ? xpConfig.lessonCompleteXp : 0) +
    (isPerfectLesson && isNewCompletion ? xpConfig.perfectLessonBonusXp : 0)
  );
};

export const calculateTotalQuizEarnedXp = (
  quizScore: number,
  percentage: number,
  xpConfig: UseProgressionStoreParams<string>['xpConfig']
): number => {
  return (
    quizScore * xpConfig.correctAnswerXp +
    (percentage >= 80 ? xpConfig.totalQuizMasteryBonusXp : 0) +
    (percentage === 100 ? xpConfig.totalQuizPerfectBonusXp : 0)
  );
};

export const getNewBadgeIds = <TBadgeId extends string>(
  achievedBadges: TBadgeId[],
  unlockedBadgeIds: TBadgeId[]
): TBadgeId[] => {
  return achievedBadges.filter((id) => !unlockedBadgeIds.includes(id));
};

const loadPersistedProgress = <TBadgeId extends string>(
  storageKey: string,
  defaultProgress: UserProgress,
  validBadgeIds: readonly TBadgeId[],
  getLessonRecentWindowSize: (lessonId: number) => number
): PersistedProgress<TBadgeId> => {
  if (typeof window === 'undefined') {
    return {
      userProgress: defaultProgress,
      completedLessonIds: [],
      perfectLessonIds: [],
      highScoreLessonIds: [],
      lessonAttemptCounts: {},
      unlockedBadgeIds: [],
    };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        userProgress: defaultProgress,
        completedLessonIds: [],
        perfectLessonIds: [],
        highScoreLessonIds: [],
        lessonAttemptCounts: {},
        unlockedBadgeIds: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedProgress<TBadgeId>>;
    const mergedProgress: UserProgress = {
      ...defaultProgress,
      ...(parsed.userProgress ?? {}),
    };

    const migratedWindowSize: Record<number, number> = {
      ...(mergedProgress.lessonRecentWindowSize ?? {}),
    };

    const lessonIdsWithProgress = new Set<number>([
      ...Object.keys(mergedProgress.lessonPerformance ?? {}).map((key) => Number(key)),
      ...Object.keys(mergedProgress.lessonRecentAnswers ?? {}).map((key) => Number(key)),
      ...Object.keys(mergedProgress.lessonLatestPercent ?? {}).map((key) => Number(key)),
    ]);

    lessonIdsWithProgress.forEach((lessonId) => {
      if (!Number.isFinite(lessonId) || lessonId <= 0) return;
      migratedWindowSize[lessonId] = getLessonRecentWindowSize(lessonId);
    });

    const validBadgeSet = new Set<TBadgeId>(validBadgeIds);

    return {
      userProgress: {
        ...mergedProgress,
        lessonRecentWindowSize: migratedWindowSize,
      },
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      perfectLessonIds: Array.isArray(parsed.perfectLessonIds) ? parsed.perfectLessonIds : [],
      highScoreLessonIds: Array.isArray(parsed.highScoreLessonIds) ? parsed.highScoreLessonIds : [],
      lessonAttemptCounts:
        parsed.lessonAttemptCounts && typeof parsed.lessonAttemptCounts === 'object' ? parsed.lessonAttemptCounts : {},
      unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds)
        ? parsed.unlockedBadgeIds.filter((id): id is TBadgeId => validBadgeSet.has(id as TBadgeId))
        : [],
    };
  } catch {
    return {
      userProgress: defaultProgress,
      completedLessonIds: [],
      perfectLessonIds: [],
      highScoreLessonIds: [],
      lessonAttemptCounts: {},
      unlockedBadgeIds: [],
    };
  }
};

export const useProgressionStore = <TBadgeId extends string>({
  storageKey,
  defaultProgress,
  validBadgeIds,
  getLessonRecentWindowSize,
  getAchievedBadges,
  xpConfig,
}: UseProgressionStoreParams<TBadgeId>) => {
  const initialProgress = React.useMemo(
    () => loadPersistedProgress(storageKey, defaultProgress, validBadgeIds, getLessonRecentWindowSize),
    [storageKey, defaultProgress, validBadgeIds, getLessonRecentWindowSize]
  );

  const [completedLessonIds, setCompletedLessonIds] = React.useState<Set<number>>(
    () => new Set(initialProgress.completedLessonIds)
  );
  const [perfectLessonIds, setPerfectLessonIds] = React.useState<Set<number>>(
    () => new Set(initialProgress.perfectLessonIds)
  );
  const [highScoreLessonIds, setHighScoreLessonIds] = React.useState<Set<number>>(
    () => new Set(initialProgress.highScoreLessonIds)
  );
  const [lessonAttemptCounts, setLessonAttemptCounts] = React.useState<Record<number, number>>(() => {
    const entries = Object.entries(initialProgress.lessonAttemptCounts ?? {}).map(([key, value]) => [Number(key), Number(value)]);
    return Object.fromEntries(entries) as Record<number, number>;
  });
  const [unlockedBadgeIds, setUnlockedBadgeIds] = React.useState<TBadgeId[]>(() => initialProgress.unlockedBadgeIds);
  const [userProgress, setUserProgress] = React.useState<UserProgress>(() => initialProgress.userProgress);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload: PersistedProgress<TBadgeId> = {
      userProgress,
      completedLessonIds: Array.from(completedLessonIds),
      perfectLessonIds: Array.from(perfectLessonIds),
      highScoreLessonIds: Array.from(highScoreLessonIds),
      lessonAttemptCounts: Object.fromEntries(Object.entries(lessonAttemptCounts).map(([key, value]) => [String(key), value])),
      unlockedBadgeIds,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [storageKey, userProgress, completedLessonIds, perfectLessonIds, highScoreLessonIds, lessonAttemptCounts, unlockedBadgeIds]);

  const spendHint = React.useCallback(() => {
    setUserProgress((prev) => ({
      ...prev,
      totalXp: Math.max(0, prev.totalXp - xpConfig.hintXpCost),
      hintsUsed: prev.hintsUsed + 1,
    }));
  }, [xpConfig.hintXpCost]);

  const recordQuestionAnswer = React.useCallback((lessonId: number, correct: boolean) => {
    setUserProgress((prev) => {
      const lessonStats = prev.lessonPerformance[lessonId] ?? { attempts: 0, correct: 0 };
      const recentWindowSize = Math.max(1, prev.lessonRecentWindowSize[lessonId] ?? 10);
      const recentAnswers = prev.lessonRecentAnswers[lessonId] ?? [];
      const nextRecentAnswers = [...recentAnswers, correct].slice(-recentWindowSize);

      return {
        ...prev,
        lessonPerformance: {
          ...prev.lessonPerformance,
          [lessonId]: {
            attempts: lessonStats.attempts + 1,
            correct: lessonStats.correct + (correct ? 1 : 0),
          },
        },
        lessonRecentAnswers: {
          ...prev.lessonRecentAnswers,
          [lessonId]: nextRecentAnswers,
        },
      };
    });
  }, []);

  const completeLesson = React.useCallback(
    (lessonId: number, score: number, totalQuestions: number) => {
      const isNewCompletion = !completedLessonIds.has(lessonId);

      const nextCompletedLessonIds = new Set(completedLessonIds);
      if (isNewCompletion) {
        nextCompletedLessonIds.add(lessonId);
      }

      const isPerfectLesson = totalQuestions > 0 && score === totalQuestions;
      const nextPerfectLessonIds = new Set(perfectLessonIds);
      if (isPerfectLesson) {
        nextPerfectLessonIds.add(lessonId);
      }

      const lessonPercent = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      const nextHighScoreLessonIds = new Set(highScoreLessonIds);
      if (lessonId <= 11 && lessonPercent >= 80) {
        nextHighScoreLessonIds.add(lessonId);
      }

      const nextLessonAttemptCounts: Record<number, number> = {
        ...lessonAttemptCounts,
        [lessonId]: (lessonAttemptCounts[lessonId] ?? 0) + 1,
      };

      const earnedXp = calculateLessonEarnedXp(score, isNewCompletion, isPerfectLesson, xpConfig);

      const nextProgress: UserProgress = {
        ...applyDailyPlay(userProgress),
        totalScore: userProgress.totalScore + (isNewCompletion ? score : 0),
        totalXp: userProgress.totalXp + earnedXp,
        correctAnswers: userProgress.correctAnswers + score,
        lessonRecentWindowSize: {
          ...userProgress.lessonRecentWindowSize,
          [lessonId]: Math.max(1, totalQuestions),
        },
        lessonLatestPercent: {
          ...userProgress.lessonLatestPercent,
          [lessonId]: Math.round(lessonPercent),
        },
      };

      const achievedBadges = getAchievedBadges(
        nextProgress,
        nextCompletedLessonIds,
        nextPerfectLessonIds,
        nextHighScoreLessonIds,
        nextLessonAttemptCounts
      );
      const newBadges = getNewBadgeIds(achievedBadges, unlockedBadgeIds);

      setCompletedLessonIds(nextCompletedLessonIds);
      setPerfectLessonIds(nextPerfectLessonIds);
      setHighScoreLessonIds(nextHighScoreLessonIds);
      setLessonAttemptCounts(nextLessonAttemptCounts);
      setUserProgress(nextProgress);
      if (newBadges.length > 0) {
        setUnlockedBadgeIds((prev) => [...prev, ...newBadges]);
      }
    },
    [
      completedLessonIds,
      perfectLessonIds,
      highScoreLessonIds,
      lessonAttemptCounts,
      userProgress,
      unlockedBadgeIds,
      xpConfig.correctAnswerXp,
      xpConfig.lessonCompleteXp,
      xpConfig.perfectLessonBonusXp,
      getAchievedBadges,
    ]
  );

  const applyTotalQuizCompletion = React.useCallback(
    (quizScore: number, totalQuestions: number, maxQuizStreak: number, fastCorrectInRun: number) => {
      if (totalQuestions <= 0) return;

      const percentage = Math.round((quizScore / totalQuestions) * 100);
      const earnedXp = calculateTotalQuizEarnedXp(quizScore, percentage, xpConfig);

      const nextProgress: UserProgress = {
        ...applyDailyPlay(userProgress),
        totalXp: userProgress.totalXp + earnedXp,
        correctAnswers: userProgress.correctAnswers + quizScore,
        totalQuizMastered: userProgress.totalQuizMastered + (percentage >= 80 ? 1 : 0),
        totalQuizPerfect: userProgress.totalQuizPerfect + (percentage === 100 ? 1 : 0),
        totalQuizAttempts: userProgress.totalQuizAttempts + 1,
        bestStreak: Math.max(userProgress.bestStreak, maxQuizStreak),
        fastCorrectAnswers: userProgress.fastCorrectAnswers + fastCorrectInRun,
        totalQuizLatestPercent: percentage,
      };

      const achievedBadges = getAchievedBadges(
        nextProgress,
        completedLessonIds,
        perfectLessonIds,
        highScoreLessonIds,
        lessonAttemptCounts
      );
      const newBadges = getNewBadgeIds(achievedBadges, unlockedBadgeIds);

      setUserProgress(nextProgress);
      if (newBadges.length > 0) {
        setUnlockedBadgeIds((prev) => [...prev, ...newBadges]);
      }
    },
    [
      userProgress,
      completedLessonIds,
      perfectLessonIds,
      highScoreLessonIds,
      lessonAttemptCounts,
      unlockedBadgeIds,
      xpConfig.correctAnswerXp,
      xpConfig.totalQuizMasteryBonusXp,
      xpConfig.totalQuizPerfectBonusXp,
      getAchievedBadges,
    ]
  );

  return {
    userProgress,
    unlockedBadgeIds,
    completedLessonIds,
    perfectLessonIds,
    highScoreLessonIds,
    lessonAttemptCounts,
    spendHint,
    recordQuestionAnswer,
    completeLesson,
    applyTotalQuizCompletion,
  };
};
