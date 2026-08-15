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
  appearance?: 'default' | 'atlas';
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
  appearance = 'default',
}) => {
  const isLarge = size === 'large';

  const getOptionClasses = (index: number) => {
    if (answered) {
      if (index === correctIndex) {
        return 'border-green-500 bg-green-50';
      }

      if (selectedAnswer === index) {
        return 'border-red-500 bg-red-50';
      }

      return 'border-gray-300';
    }

    if (selectedAnswer === index) {
      return 'border-blue-500 bg-blue-50';
    }

    return 'border-gray-300 hover:border-blue-500 hover:bg-blue-50';
  };

  return (
    <>
      <h2 className={appearance === 'atlas' ? 'lesson-atlas-question-title' : isLarge ? 'text-xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-800' : 'text-xl sm:text-2xl font-bold mb-6 text-gray-800'}>
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
          appearance={appearance}
        />
      )}

      <div className={appearance === 'atlas' ? 'lesson-atlas-option-list' : 'space-y-3 mb-6'}>
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onSelectAnswer(idx)}
            disabled={answered}
            className={`${appearance === 'atlas' ? 'lesson-atlas-option' : `w-full ${isLarge ? 'p-3 sm:p-5 text-sm sm:text-base lg:text-lg' : 'p-3 sm:p-4 text-sm sm:text-base'} text-left rounded-lg border-2`} transition-all ${getOptionClasses(idx)} ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {appearance === 'atlas' ? <><span className="lesson-atlas-option-letter">{String.fromCharCode(65 + idx)}</span><span>{option}</span></> : <><span className="font-semibold">{String.fromCharCode(65 + idx)}.</span> {option}</>}
          </button>
        ))}
      </div>

      {showFeedback && (
        <div className={`${appearance === 'atlas' ? 'lesson-atlas-feedback' : `${isLarge ? 'p-3 sm:p-5 text-sm sm:text-base lg:text-lg' : 'p-4'} rounded-lg`} ${selectedAnswer === correctIndex ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
          <p className={appearance === 'atlas' ? 'lesson-atlas-feedback-title' : `font-semibold mb-2 ${isLarge ? 'text-base sm:text-lg' : ''}`}>
            {selectedAnswer === correctIndex ? '✓ 正確!' : '✗ 錯誤'}
          </p>
          <p className={appearance === 'atlas' ? 'lesson-atlas-feedback-copy' : `text-gray-700 ${isLarge ? 'text-sm sm:text-base' : ''}`}>{explanation}</p>
        </div>
      )}
    </>
  );
};
