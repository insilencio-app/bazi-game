import React from 'react';
import { mockLessons } from '../data/mockData';
import { loadQuizSessionQuestions, submitQuizAttempts } from '../api/quizApi';
import type { GameMode } from '../routes';

const TOTAL_QUIZ_AUTO_ADVANCE_STORAGE_KEY = 'bazi-total-quiz-auto-advance-v1';
const TOTAL_QUIZ_AUTO_ADVANCE_DELAY_MS = 1000;

const loadAutoAdvancePreference = () => {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    return window.localStorage.getItem(TOTAL_QUIZ_AUTO_ADVANCE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

type TotalQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  hint?: string;
  lessonId: number;
  lessonTitle: string;
};

interface UseTotalQuizSessionParams {
  currentMode: GameMode;
  userXp: number;
  hintXpCost: number;
  onQuestionAnswered: (lessonId: number, correct: boolean) => void;
  onUseHint: () => void;
}

export const evaluateTotalQuizAnswer = ({
  selectedAnswer,
  correctAnswer,
  currentStreak,
  currentMaxStreak,
  questionStartAt,
  now,
}: {
  selectedAnswer: number;
  correctAnswer: number;
  currentStreak: number;
  currentMaxStreak: number;
  questionStartAt: number | null;
  now: number;
}) => {
  const isCorrect = selectedAnswer === correctAnswer;
  const nextStreak = isCorrect ? currentStreak + 1 : 0;
  const nextMaxStreak = isCorrect ? Math.max(currentMaxStreak, nextStreak) : currentMaxStreak;
  const isFastCorrect = Boolean(isCorrect && questionStartAt && now - questionStartAt <= 30000);

  return {
    isCorrect,
    nextStreak,
    nextMaxStreak,
    scoreDelta: isCorrect ? 1 : 0,
    fastCorrectDelta: isFastCorrect ? 1 : 0,
  };
};

export const useTotalQuizSession = ({
  currentMode,
  userXp,
  hintXpCost,
  onQuestionAnswered,
  onUseHint,
}: UseTotalQuizSessionParams) => {
  const [quizIndex, setQuizIndex] = React.useState(0);
  const [quizScore, setQuizScore] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [answered, setAnswered] = React.useState(false);
  const [isQuizFinished, setIsQuizFinished] = React.useState(false);
  const [randomQuestions, setRandomQuestions] = React.useState<TotalQuizQuestion[]>([]);
  const [isTotalQuizRewardApplied, setIsTotalQuizRewardApplied] = React.useState(false);
  const [currentQuizStreak, setCurrentQuizStreak] = React.useState(0);
  const [maxQuizStreak, setMaxQuizStreak] = React.useState(0);
  const [fastCorrectInRun, setFastCorrectInRun] = React.useState(0);
  const [totalQuizAnswerHistory, setTotalQuizAnswerHistory] = React.useState<boolean[]>([]);
  const [questionStartAt, setQuestionStartAt] = React.useState<number | null>(null);
  const [showTotalQuizHint, setShowTotalQuizHint] = React.useState(false);
  const [apiSessionId, setApiSessionId] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [autoAdvanceOnCorrect, setAutoAdvanceOnCorrect] = React.useState(loadAutoAdvancePreference);
  const [attemptsToSync, setAttemptsToSync] = React.useState<
    Array<{ questionId: string; isCorrect: boolean; responseMs: number | null }>
  >([]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      window.localStorage.setItem(TOTAL_QUIZ_AUTO_ADVANCE_STORAGE_KEY, String(autoAdvanceOnCorrect));
    } catch {
      // Ignore persistence failures and keep runtime behavior.
    }
  }, [autoAdvanceOnCorrect]);

  React.useEffect(() => {
    if (currentMode !== 'total-quiz' || randomQuestions.length > 0) return;

    let cancelled = false;

    const loadQuestions = async () => {
      setLoadError(null);

      try {
        const session = await loadQuizSessionQuestions({
          userId: 'guest',
          policy: {
            totalCount: 20,
            minGap: 30,
            typeTargets: {
              mcq: 20,
              truefalse: 0,
              match: 0,
            },
          },
        });
        const lessonTitleById = new Map(mockLessons.map((lesson) => [lesson.id, lesson.title_cn]));
        const remoteQuestions = session.questions
          .filter((question) => question.type === 'mcq' && Array.isArray(question.options) && typeof question.answer === 'number')
          .map(
            (question): TotalQuizQuestion => ({
              id: question.id,
              question: question.prompt,
              options: question.options ?? [],
              correct: question.answer as number,
              explanation: question.explanation,
              hint: question.hint ?? undefined,
              lessonId: question.lessonId,
              lessonTitle: lessonTitleById.get(question.lessonId) ?? `課程 ${question.lessonId}`,
            })
          );

        if (cancelled) return;

        if (remoteQuestions.length > 0) {
          setApiSessionId(session.sessionId);
          setRandomQuestions(remoteQuestions);
          return;
        }

        setRandomQuestions([]);
        setLoadError('總測驗題目載入失敗。');
      } catch {
        if (!cancelled) {
          setRandomQuestions([]);
          setLoadError('總測驗題目載入失敗，請確認測驗 API 已啟動。');
        }
      }
    };

    void loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [currentMode, randomQuestions.length]);

  React.useEffect(() => {
    if (currentMode !== 'total-quiz') {
      setRandomQuestions([]);
      setQuizIndex(0);
      setQuizScore(0);
      setSelectedAnswer(null);
      setAnswered(false);
      setIsQuizFinished(false);
      setIsTotalQuizRewardApplied(false);
      setCurrentQuizStreak(0);
      setMaxQuizStreak(0);
      setFastCorrectInRun(0);
      setTotalQuizAnswerHistory([]);
      setQuestionStartAt(null);
      setShowTotalQuizHint(false);
      setApiSessionId(null);
      setLoadError(null);
      setAttemptsToSync([]);
    }
  }, [currentMode]);

  React.useEffect(() => {
    if (!isQuizFinished || !apiSessionId || attemptsToSync.length === 0) return;

    void submitQuizAttempts(apiSessionId, attemptsToSync).catch(() => undefined);
  }, [isQuizFinished, apiSessionId, attemptsToSync]);

  React.useEffect(() => {
    if (currentMode === 'total-quiz' && randomQuestions.length > 0 && !isQuizFinished) {
      setQuestionStartAt(Date.now());
    }
  }, [currentMode, randomQuestions.length, quizIndex, isQuizFinished]);

  const isLoading = randomQuestions.length === 0;
  const currentQuestion = isLoading ? null : randomQuestions[quizIndex];

  React.useEffect(() => {
    if (currentMode !== 'total-quiz' || !autoAdvanceOnCorrect || !answered || !currentQuestion) {
      return;
    }

    const isCurrentAnswerCorrect = selectedAnswer === currentQuestion.correct;
    if (!isCurrentAnswerCorrect) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (quizIndex < randomQuestions.length - 1) {
        setQuizIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
        setQuestionStartAt(Date.now());
        setShowTotalQuizHint(false);
        return;
      }

      setIsQuizFinished(true);
    }, TOTAL_QUIZ_AUTO_ADVANCE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    answered,
    autoAdvanceOnCorrect,
    currentMode,
    currentQuestion,
    quizIndex,
    randomQuestions.length,
    selectedAnswer,
  ]);
  const totalQuestions = randomQuestions.length;
  const progress = totalQuestions ? ((quizIndex + 1) / totalQuestions) * 100 : 0;
  const latestPercent = totalQuestions ? Math.round((quizScore / totalQuestions) * 100) : 0;
  const recentWindowSize = Math.max(1, totalQuestions);
  const recentAnswers = totalQuizAnswerHistory.slice(-recentWindowSize);
  const recentAttempts = recentAnswers.length;
  const recentCorrect = recentAnswers.filter(Boolean).length;
  const recentPercent = recentAttempts > 0 ? Math.round((recentCorrect / recentAttempts) * 100) : 0;
  const latestBarPercent = Math.min(100, Math.max(0, latestPercent));
  const currentAttemptedCount = quizIndex + (answered ? 1 : 0);
  const currentCorrectCount =
    quizScore + (answered && currentQuestion && selectedAnswer === currentQuestion.correct ? 1 : 0);
  const currentAccuracy = currentAttemptedCount > 0 ? Math.round((currentCorrectCount / currentAttemptedCount) * 100) : 0;

  const handleCheck = () => {
    if (!currentQuestion) return;
    if (selectedAnswer === null || answered) return;

    setAnswered(true);
    const evaluation = evaluateTotalQuizAnswer({
      selectedAnswer,
      correctAnswer: currentQuestion.correct,
      currentStreak: currentQuizStreak,
      currentMaxStreak: maxQuizStreak,
      questionStartAt,
      now: Date.now(),
    });

    if (evaluation.isCorrect) {
      setQuizScore((prev) => prev + evaluation.scoreDelta);
      setCurrentQuizStreak(evaluation.nextStreak);
      setMaxQuizStreak(evaluation.nextMaxStreak);

      if (evaluation.fastCorrectDelta > 0) {
        setFastCorrectInRun((prev) => prev + evaluation.fastCorrectDelta);
      }
    } else {
      setCurrentQuizStreak(0);
    }

    setTotalQuizAnswerHistory((prev) => [...prev, evaluation.isCorrect]);
    onQuestionAnswered(currentQuestion.lessonId, evaluation.isCorrect);

    const responseMs = questionStartAt ? Math.max(0, Date.now() - questionStartAt) : null;
    setAttemptsToSync((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        isCorrect: evaluation.isCorrect,
        responseMs,
      },
    ]);
  };

  const handleNext = () => {
    if (quizIndex < randomQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setQuestionStartAt(Date.now());
      setShowTotalQuizHint(false);
      return;
    }

    setIsQuizFinished(true);
  };

  const handleUseTotalQuizHint = () => {
    if (userXp >= hintXpCost && !showTotalQuizHint) {
      setShowTotalQuizHint(true);
      onUseHint();
    }
  };

  return {
    quizIndex,
    quizScore,
    selectedAnswer,
    answered,
    isQuizFinished,
    randomQuestions,
    isTotalQuizRewardApplied,
    maxQuizStreak,
    fastCorrectInRun,
    totalQuizAnswerHistory,
    showTotalQuizHint,
    autoAdvanceOnCorrect,
    setSelectedAnswer,
    setIsTotalQuizRewardApplied,
    setAutoAdvanceOnCorrect,
    loadError,
    isLoading,
    currentQuestion,
    totalQuestions,
    progress,
    latestPercent,
    recentWindowSize,
    recentCorrect,
    recentAttempts,
    recentPercent,
    latestBarPercent,
    currentAccuracy,
    handleCheck,
    handleNext,
    handleUseTotalQuizHint,
  };
};
