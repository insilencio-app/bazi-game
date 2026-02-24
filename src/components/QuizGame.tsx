import React, { useState } from 'react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export const QuizGame: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(3);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    if (answered) return;
    setSelectedAnswer(optionIndex);
  };

  const handleCheck = () => {
    if (answered || selectedAnswer === null) return;

    setAnswered(true);
    setShowFeedback(true);

    if (selectedAnswer === currentQuestion.correct) {
      setScore(score + 1);
      setXp(xp + 10);
    } else {
      setLives(lives - 1);
    }
  };

  const handleNext = () => {
    if (lives <= 0) {
      onComplete(score);
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setShowFeedback(false);
      return;
    }

    onComplete(score);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-base text-gray-600 mb-2">
          <span className="text-lg font-semibold">題目 {currentIndex + 1}/{questions.length}</span>
          <div className="flex items-center gap-4 text-lg font-semibold">
            <span className="text-yellow-600">XP {xp}</span>
            <span className="text-red-600">❤ {lives}</span>
            <span>分數: {score}/{questions.length}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">{currentQuestion.question}</h2>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQuestion.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            disabled={answered}
            className={`w-full p-5 text-left rounded-lg border-2 transition-all text-xl ${
              selectedAnswer === idx
                ? idx === currentQuestion.correct
                  ? 'border-green-500 bg-green-50'
                  : answered
                  ? 'border-red-500 bg-red-50'
                  : 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span> {option}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`p-5 rounded-lg mb-6 text-lg ${selectedAnswer === currentQuestion.correct ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
          <p className="font-semibold mb-2 text-xl">
            {selectedAnswer === currentQuestion.correct ? '✓ 正確!' : '✗ 錯誤'}
          </p>
          <p className="text-gray-700">{currentQuestion.explanation}</p>
        </div>
      )}

      {!answered && (
        <button
          onClick={handleCheck}
          disabled={selectedAnswer === null}
          className={`w-full font-bold py-4 rounded-lg transition-colors text-lg ${
            selectedAnswer === null
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          檢查
        </button>
      )}

      {answered && (
        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg"
        >
          {lives <= 0 ? '結束' : currentIndex < questions.length - 1 ? '繼續' : '完成'}
        </button>
      )}
    </div>
  );
};
