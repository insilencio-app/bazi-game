import React from 'react';

interface QuizHintPanelProps {
  hint: string;
  answered: boolean;
  showHint: boolean;
  canUseHint: boolean;
  hintXpCost?: number;
  onUseHint?: () => void;
}

export const QuizHintPanel: React.FC<QuizHintPanelProps> = ({
  hint,
  answered,
  showHint,
  canUseHint,
  hintXpCost = 50,
  onUseHint,
}) => {
  if (answered) return null;

  return (
    <div className="mb-4">
      {!showHint ? (
        <button
          onClick={onUseHint}
          disabled={!canUseHint}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm sm:text-base ${
            canUseHint
              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">💡</span>
          <span>使用提示 (花費 {hintXpCost} XP)</span>
          {!canUseHint && <span className="text-xs">(XP不足)</span>}
        </button>
      ) : (
        <div className="p-3 sm:p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500">
          <p className="font-semibold text-yellow-700 mb-1 flex items-center gap-2 text-sm sm:text-base">
            <span className="text-lg">💡</span>
            提示：
          </p>
          <p className="text-gray-700 text-sm sm:text-base">{hint}</p>
        </div>
      )}
    </div>
  );
};
