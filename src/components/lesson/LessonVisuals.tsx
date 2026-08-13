import React from 'react';
import type { LessonWithBanks } from '../../types/domain';
import { MultipleChoiceQuestion } from '../quiz/MultipleChoiceQuestion';

interface Props {
  lesson: LessonWithBanks;
}

const LessonSummaryCard: React.FC<{summary: string}> = ({ summary }) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-start gap-4">
    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">⚡</div>
    <div>
      <h3 className="text-lg font-semibold">快速摘要</h3>
      <p className="text-sm text-gray-700">{summary}</p>
    </div>
  </div>
);

const TakeawaysRow: React.FC<{items: string[]}> = ({ items }) => (
  <div className="flex gap-3 mt-3 flex-wrap">
    {items.map((t) => (
      <div key={t} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-md text-sm shadow-sm">
        {t}
      </div>
    ))}
  </div>
);

const StrengthRow: React.FC = () => (
  <ul className="space-y-2 mt-4">
    {['日支（明根）','月支（得令）','年支','時支'].map((label, i) => (
      <li key={label} className="flex items-center gap-3">
        <div className="w-28 text-sm text-gray-600">{label}</div>
        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className={`h-3 bg-amber-400`} style={{ width: `${100 - i * 20}%` }} />
        </div>
      </li>
    ))}
  </ul>
);

const CompareColumns: React.FC = () => (
  <div className="grid md:grid-cols-2 gap-4 mt-4">
    <div className="p-3 bg-white rounded shadow-sm">
      <h4 className="font-medium">陽日元（怕弱）</h4>
      <ul className="mt-2 text-sm space-y-1">
        <li>需根氣充足，表現主動</li>
        <li>根氣不足時易失去動力</li>
      </ul>
    </div>
    <div className="p-3 bg-white rounded shadow-sm">
      <h4 className="font-medium">陰日元（怕旺）</h4>
      <ul className="mt-2 text-sm space-y-1">
        <li>需要生機與柔韌</li>
        <li>過旺會喪失陰柔特質</li>
      </ul>
    </div>
  </div>
);

const CollapsibleParagraph: React.FC<{preview: string; full?: string}> = ({ preview, full }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mt-3">
      <p className="text-sm text-gray-800">{open ? full ?? preview : preview}</p>
      {full && (
        <button
          onClick={() => setOpen((s) => !s)}
          className="text-xs text-indigo-600 mt-1"
          aria-expanded={open}
        >
          {open ? '收起' : '展開'}
        </button>
      )}
    </div>
  );
};

const InlineQuiz: React.FC<{lesson: LessonWithBanks}> = ({ lesson }) => {
  const q = lesson.questionBank?.[0];
  if (!q) return null;
  return (
    <div className="mt-4">
      <MultipleChoiceQuestion
        question={q.question}
        options={q.options}
        correctIndex={q.correct}
        explanation={q.explanation}
        showHint={false}
        canUseHint={false}
      />
    </div>
  );
};

const LessonVisuals: React.FC<Props> = ({ lesson }) => {
  const summary = lesson.learning_objectives_cn ?? '深入判斷日元根氣與強弱層次，並理解動態變化。';
  const takeaways = [
    '根氣 = 通根（藏干）',
    '日支為明根，最強',
    '強弱為光譜，受沖會受損',
  ];

  return (
    <div className="mb-6">
      <LessonSummaryCard summary={summary} />
      <TakeawaysRow items={takeaways} />
      <StrengthRow />
      <CompareColumns />
      <CollapsibleParagraph preview={lesson.steps?.[2]?.paragraphs?.[0] ?? ''} full={lesson.steps?.[2]?.paragraphs?.join('\n\n')} />
      <InlineQuiz lesson={lesson} />
    </div>
  );
};

export default LessonVisuals;
