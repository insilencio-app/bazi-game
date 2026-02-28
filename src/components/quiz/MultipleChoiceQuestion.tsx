import React from 'react';
import { QuizHintPanel } from './QuizHintPanel';

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedAnswer: number | null;
  answered: boolean;
  showFeedback: boolean;
  onSelectAnswer: (index: number) => void;
  hint?: string;
  showHint?: boolean;
  onUseHint?: () => void;
  canUseHint?: boolean;
  hintXpCost?: number;
  size?: 'compact' | 'large';
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  options,
  correctIndex,
  explanation,
  selectedAnswer,
  answered,
  showFeedback,
  onSelectAnswer,
  hint,
  showHint = false,
  onUseHint,
  canUseHint = false,
  hintXpCost = 50,
  size = 'compact',
}) => {
  const isLarge = size === 'large';

  return (
    <>
      <h2 className={isLarge ? 'text-xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-800' : 'text-xl sm:text-2xl font-bold mb-6 text-gray-800'}>
        {question}
      </h2>

      {hint && !answered && (
        <QuizHintPanel
          hint={hint}
          answered={answered}
          showHint={showHint}
          onUseHint={onUseHint}
          canUseHint={canUseHint}
          hintXpCost={hintXpCost}
        />
      )}

      <div className="space-y-3 mb-6">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onSelectAnswer(idx)}
            disabled={answered}
            className={`w-full ${isLarge ? 'p-3 sm:p-5 text-sm sm:text-base lg:text-lg' : 'p-3 sm:p-4 text-sm sm:text-base'} text-left rounded-lg border-2 transition-all ${
              selectedAnswer === idx
                ? idx === correctIndex
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

      {showFeedback && (
        <div className={`${isLarge ? 'p-3 sm:p-5 text-sm sm:text-base lg:text-lg' : 'p-4'} rounded-lg ${selectedAnswer === correctIndex ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
          <p className={`font-semibold mb-2 ${isLarge ? 'text-base sm:text-lg' : ''}`}>
            {selectedAnswer === correctIndex ? '✓ 正確!' : '✗ 錯誤'}
          </p>
          <p className={`text-gray-700 ${isLarge ? 'text-sm sm:text-base' : ''}`}>{explanation}</p>
        </div>
      )}
    </>
  );
};
