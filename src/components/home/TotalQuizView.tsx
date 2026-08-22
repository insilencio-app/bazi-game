import React from 'react';
/* Design reminder — 五行研習桌：總測驗是集中判讀的工作頁；使用短檔頭與清楚進度，不以大型 hero 搶奪題目空間。 */
import { MultipleChoiceQuestion } from '../quiz/MultipleChoiceQuestion';
import { QuizActionButton } from '../quiz/QuizActionButton';

type TotalQuizQuestion = {
  lessonTitle: string;
  question: string;
  hint?: string;
  options: string[];
  correct: number;
  explanation: string;
};

interface TotalQuizViewProps {
  isLoading: boolean;
  loadError: string | null;
  isQuizFinished: boolean;
  quizIndex: number;
  totalQuestions: number;
  progress: number;
  currentAccuracy: number;
  latestPercent: number;
  latestBarPercent: number;
  recentWindowSize: number;
  recentCorrect: number;
  recentAttempts: number;
  recentPercent: number;
  quizScore: number;
  currentQuestion: TotalQuizQuestion | null;
  selectedAnswer: number | null;
  answered: boolean;
  showTotalQuizHint: boolean;
  autoAdvanceOnCorrect: boolean;
  userXp: number;
  hintXpCost: number;
  onBack: () => void;
  onUseHint: () => void;
  onToggleAutoAdvance: () => void;
  onSelectAnswer: (index: number) => void;
  onCheck: () => void;
  onNext: () => void;
  rewardOverlay: React.ReactNode;
}

export const TotalQuizView: React.FC<TotalQuizViewProps> = ({
  isLoading,
  loadError,
  isQuizFinished,
  quizIndex,
  totalQuestions,
  progress,
  currentAccuracy,
  latestPercent,
  latestBarPercent,
  recentWindowSize,
  recentCorrect,
  recentAttempts,
  recentPercent,
  quizScore,
  currentQuestion,
  selectedAnswer,
  answered,
  showTotalQuizHint,
  autoAdvanceOnCorrect,
  userXp,
  hintXpCost,
  onBack,
  onUseHint,
  onToggleAutoAdvance,
  onSelectAnswer,
  onCheck,
  onNext,
  rewardOverlay,
}) => {
  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">總測驗</h2>
        <p className="text-gray-700 mt-4 mb-6">{loadError}</p>
        <QuizActionButton label="返回主頁" onClick={onBack} fullWidth />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">總測驗</h2>
        <p className="text-gray-700 mt-4">加載測驗中...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  if (isQuizFinished) {
    return (
      <>
        <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">綜合測驗完成！</h2>
          <p className="text-lg sm:text-xl text-gray-700 mb-6">你已完成綜合測驗。</p>
          <div className="mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700 font-medium">總測驗進度（本次）</p>
              <p className="text-sm font-semibold text-blue-700">{latestPercent}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${latestBarPercent}%` }}></div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-5 sm:p-8 mb-6">
            <p className="text-4xl sm:text-5xl font-bold text-blue-700 mb-2">{quizScore} / {totalQuestions}</p>
            <p className="text-lg sm:text-xl text-gray-700">答對題數</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-2">本次成績：{latestPercent}%</p>
            <p className="text-sm sm:text-base text-gray-700 mt-2">
              最近{recentWindowSize}題：{recentCorrect}/{recentAttempts} • {recentPercent}%
            </p>
          </div>
          <QuizActionButton label="返回主頁" onClick={onBack} fullWidth />
        </div>
        {rewardOverlay}
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      <div className="total-quiz-header mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div><p className="total-quiz-header__kicker">INTEGRATED REVIEW</p><h1 className="text-2xl sm:text-3xl font-bold text-gray-800">總測驗</h1></div>
          <QuizActionButton label="返回主頁" onClick={onBack} variant="accent" size="compact" stretch={false} />
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:text-base text-gray-700">
          <span className="font-semibold">第 {quizIndex + 1}/{totalQuestions} 題</span>
          <span className="mx-2">•</span>
          <span className="font-semibold text-blue-700">目前正確率：{currentAccuracy}%</span>
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={autoAdvanceOnCorrect}
            onChange={onToggleAutoAdvance}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>答對後自動下一題</span>
        </label>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-700 mb-2">課程：{currentQuestion.lessonTitle}</p>
        <MultipleChoiceQuestion
          question={currentQuestion.question}
          options={currentQuestion.options}
          correctIndex={currentQuestion.correct}
          explanation={currentQuestion.explanation}
          selectedAnswer={selectedAnswer}
          answered={answered}
          showFeedback={answered}
          onSelectAnswer={onSelectAnswer}
          hint={currentQuestion.hint}
          showHint={showTotalQuizHint}
          onUseHint={onUseHint}
          canUseHint={userXp >= hintXpCost}
          hintXpCost={hintXpCost}
          size="compact"
        />
      </div>

      {!answered && (
        <QuizActionButton label="檢查" onClick={onCheck} disabled={selectedAnswer === null} fullWidth />
      )}

      {answered && (
        <div className="space-y-3">
          {autoAdvanceOnCorrect && selectedAnswer === currentQuestion.correct && (
            <p className="text-center text-sm text-gray-600">答對後將自動進入下一題。</p>
          )}
          <QuizActionButton label={quizIndex === totalQuestions - 1 ? '完成' : '繼續'} onClick={onNext} fullWidth />
        </div>
      )}
    </div>
  );
};
