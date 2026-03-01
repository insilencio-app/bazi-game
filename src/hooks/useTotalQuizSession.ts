import React from 'react';
import { mockLessons } from '../data/mockData';
import { createQuizSession, getQuizSession, submitQuizAttempts } from '../api/quizApi';
import { useRemoteQuizApi } from '../config/env';
import { selectByNovelty } from '../utils/quizSelection';
import type { GameMode } from '../routes';
import type { LessonQuestion, LessonWithQuestionBank } from '../types/domain';

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
  const [attemptsToSync, setAttemptsToSync] = React.useState<
    Array<{ questionId: string; isCorrect: boolean; responseMs: number | null }>
  >([]);

  const getLocalQuestions = React.useCallback((): TotalQuizQuestion[] => {
    const allQuestions = mockLessons.flatMap((lesson) =>
      (((lesson as LessonWithQuestionBank)?.questionBank ?? []) as LessonQuestion[]).map((question) => ({
        id: `lesson-${lesson.id}-mcq-${question.id}`,
        question: question.question,
        options: question.options,
        correct: question.correct,
        explanation: question.explanation,
        hint: question.hint,
        lessonId: lesson.id,
        lessonTitle: lesson.title_cn,
      }))
    );

    return selectByNovelty(
      allQuestions,
      20,
      (question) => question.id,
      'bazi-total-quiz-history-v1',
      30
    );
  }, []);

  React.useEffect(() => {
    if (currentMode !== 'total-quiz' || randomQuestions.length > 0) return;

    let cancelled = false;

    const loadQuestions = async () => {
      if (!useRemoteQuizApi) {
        setRandomQuestions(getLocalQuestions());
        return;
      }

      try {
        const created = await createQuizSession({
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

        const sessionDetail = await getQuizSession(created.sessionId, true);
        const lessonTitleById = new Map(mockLessons.map((lesson) => [lesson.id, lesson.title_cn]));
        const remoteQuestions = sessionDetail.questions
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
          setApiSessionId(created.sessionId);
          setRandomQuestions(remoteQuestions);
          return;
        }

        setRandomQuestions(getLocalQuestions());
      } catch {
        if (!cancelled) {
          setRandomQuestions(getLocalQuestions());
        }
      }
    };

    void loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [currentMode, randomQuestions.length, getLocalQuestions]);

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
    setSelectedAnswer,
    setIsTotalQuizRewardApplied,
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
