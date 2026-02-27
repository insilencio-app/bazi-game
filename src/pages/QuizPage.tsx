import React, { useState } from 'react';
import { mockQuizzes } from '../data/mockData';
import { QuizGame } from '../components/QuizGame';

interface QuizPageProps {
  quizId: number;
  onComplete: (score: number) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ quizId, onComplete }) => {
  const quiz = mockQuizzes.find((q) => q.id === quizId);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  if (!quiz) {
    return <div>測驗未找到</div>;
  }

  const handleQuizComplete = (score: number) => {
    setFinalScore(score);
    setCompleted(true);
  };

  if (completed) {
    const percentage = Math.round((finalScore / quiz.questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-4xl font-bold mb-4">測驗完成！</h2>
        
        {/* Score Display */}
        <div className={`mb-8 p-8 rounded-lg ${passed ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <div className="text-6xl font-bold mb-2">{percentage}%</div>
          <div className="text-2xl font-semibold mb-4">
            {finalScore}/{quiz.questions.length} 正確
          </div>
          <p className={`text-lg ${passed ? 'text-green-700' : 'text-yellow-700'}`}>
            {passed ? '🎉 太棒了！你通過了這個測驗！' : '再加油！繼續學習會更好！'}
          </p>
        </div>

        {/* Performance Analysis */}
        {passed && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded text-left">
            <p className="font-semibold text-green-900 mb-2">✓ 出色表現</p>
            <p className="text-green-800">你已掌握了這個主題的核心概念，可以進入下一課！</p>
          </div>
        )}

        {!passed && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded text-left">
            <p className="font-semibold text-yellow-900 mb-2">💡 建議</p>
            <p className="text-yellow-800">建議你再複習一下課程內容，然後重新做一遍測驗。</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => onComplete(finalScore)}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回主頁
          </button>
          <button
            onClick={() => {
              setCompleted(false);
              setFinalScore(0);
            }}
            className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            重新做一遍
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2 text-center">{quiz.title_cn}</h1>
      <p className="text-gray-600 text-center mb-8">測驗模式</p>
      <QuizGame questions={quiz.questions} onComplete={handleQuizComplete} />
    </div>
  );
};
