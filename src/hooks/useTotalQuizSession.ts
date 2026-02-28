import React from 'react';
import { mockLessons } from '../data/mockData';
import { selectByNovelty } from '../utils/quizSelection';
import type { GameMode } from '../routes';
import type { LessonQuestion, LessonWithQuestionBank } from '../types/domain';

type TotalQuizQuestion = {
  id: number;
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

  React.useEffect(() => {
    if (currentMode === 'total-quiz' && randomQuestions.length === 0) {
      const allQuestions = mockLessons.flatMap((lesson) =>
        (((lesson as LessonWithQuestionBank)?.questionBank ?? []) as LessonQuestion[]).map((question) => ({
          ...question,
          lessonId: lesson.id,
          lessonTitle: lesson.title_cn,
        }))
      );

      const selected = selectByNovelty(
        allQuestions,
        20,
        (question) => `lesson-${question.lessonId}-mcq-${question.id}`,
        'bazi-total-quiz-history-v1',
        30
      );

      setRandomQuestions(selected as TotalQuizQuestion[]);
    }
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
    }
  }, [currentMode]);

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
