import React from 'react';
import type { LessonWithBanks } from '../../types/domain';
import { MultipleChoiceQuestion } from '../quiz/MultipleChoiceQuestion';

interface LessonTemplateProps {
  lesson: LessonWithBanks;
}

export const LessonTemplate: React.FC<LessonTemplateProps> = ({ lesson }) => {
  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">學習目標</h2>
        <p className="text-gray-700">{lesson.learning_objectives_cn ?? '（暫無學習目標）'}</p>
      </div>
    </div>
  );
};

const IndependentMcq: React.FC<{ q: { id: number | string; question: string; options: string[]; correct: number; explanation: string }; onAnswered?: (id: number | string, correct: boolean) => void } > = ({ q, onAnswered }) => {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [answered, setAnswered] = React.useState(false);

  return (
    <MultipleChoiceQuestion
      question={q.question}
      options={q.options}
      correctIndex={q.correct}
      explanation={q.explanation}
      selectedAnswer={selected}
      answered={answered}
      showFeedback={answered}
      onSelectAnswer={(idx) => {
        if (answered) return;
        setSelected(idx);
        setAnswered(true);
        const isCorrect = idx === q.correct;
        onAnswered?.(q.id, isCorrect);
      }}
      showHint={false}
      canUseHint={false}
      size="compact"
    />
  );
};

export default LessonTemplate;
