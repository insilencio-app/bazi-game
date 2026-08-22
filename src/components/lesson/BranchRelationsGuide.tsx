/* Design reminder — 五行研習桌：以羊皮紙閱讀面、靛藍任務導引和綠／紅／金三段色帶，將地支關係由並列名詞轉成「聚合、張力、複雜」的判讀順序。 */
import React, { useState } from 'react';

interface BranchRelationsGuideProps {
  stepId: number;
}

const CHAPTERS = [
  {
    title: '第一章・聚合關係',
    cue: '三合與六合：先辨組合，再談是否成局',
    stepIds: [1, 2, 3],
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    marker: 'bg-emerald-700',
  },
  {
    title: '第二章・明顯張力',
    cue: '六沖：先定位哪一對形成動象',
    stepIds: [4],
    tone: 'border-rose-200 bg-rose-50 text-rose-900',
    marker: 'bg-rose-700',
  },
  {
    title: '第三章・複雜訊號',
    cue: '刑、破、害：回到位置、場景與全局',
    stepIds: [5, 6, 7, 8, 9, 91, 10],
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
    marker: 'bg-amber-700',
  },
] as const;

const QUICK_CHECK = {
  prompt: '在簡化命局中同時看到「卯」與「酉」，第一步應把它辨識為哪一類關係？',
  answer: '六沖',
  choices: ['六合', '六沖', '三合', '六害'],
  feedback: '卯酉是六沖。辨識到關係後，還要回到它落在哪一柱、是否有其他組合與整體旺衰，不應直接下吉凶結論。',
} as const;

export const BranchRelationsGuide: React.FC<BranchRelationsGuideProps> = ({ stepId }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const currentChapterIndex = Math.max(0, CHAPTERS.findIndex((chapter) => (chapter.stepIds as readonly number[]).includes(stepId)));
  const currentChapter = CHAPTERS[currentChapterIndex];
  const isOpeningStep = stepId === 1;
  const shouldShowMap = isOpeningStep || [4, 5].includes(stepId);

  return (
    <div className="space-y-4">
      {isOpeningStep && (
        <section className="rounded-2xl border border-indigo-200 bg-[linear-gradient(135deg,#eef2ff_0%,#fffdf7_58%,#fff7e6_100%)] p-4 sm:p-5">
          <p className="text-xs font-bold tracking-[0.16em] text-indigo-700">本課任務・BRANCH RELATIONSHIP MAP</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h3 className="font-serif text-xl font-black text-slate-900">看見兩個地支時，知道先找關係，再回到全局。</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">地支關係不是一張吉凶判決表。本課會先把關係分成聚合、張力與複雜訊號三個方向，再練習把辨識結果放回柱位、場景與全局結構。</p>
            </div>
            <div className="rounded-xl border border-white/90 bg-white/75 p-3 shadow-sm">
              <p className="text-xs font-bold text-amber-700">完成條件</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">能辨識一組三合／六合、一組六沖，並用「訊號」而非「必然事件」描述刑、破、害。</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">前置：第 3 課十二地支、第 6 課地支藏干。</p>
            </div>
          </div>
        </section>
      )}

      {shouldShowMap && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4" aria-label="第 7 課學習地圖">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">本課地圖</p>
            <p className="text-xs font-semibold text-slate-500">目前：{currentChapter.title}</p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {CHAPTERS.map((chapter, index) => {
              const isCurrent = index === currentChapterIndex;
              const isComplete = index < currentChapterIndex;
              return (
                <div key={chapter.title} className={`rounded-lg border p-3 ${isCurrent ? chapter.tone : isComplete ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${isCurrent ? chapter.marker : isComplete ? 'bg-slate-500' : 'bg-slate-300'}`}>{isComplete ? '✓' : index + 1}</span>
                    <p className="text-sm font-bold">{chapter.title}</p>
                  </div>
                  <p className="mt-1 pl-7 text-xs leading-5">{chapter.cue}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {stepId === 4 && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4" aria-label="地支關係自檢">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-rose-700">30 秒辨識自檢・不計分</p>
              <p className="mt-1 font-bold text-slate-900">{QUICK_CHECK.prompt}</p>
            </div>
            {selectedAnswer && (
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${selectedAnswer === QUICK_CHECK.answer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-200 text-rose-900'}`}>
                {selectedAnswer === QUICK_CHECK.answer ? '辨識正確' : '再看六沖圖'}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_CHECK.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setSelectedAnswer(choice)}
                className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${selectedAnswer === choice ? 'border-indigo-600 bg-indigo-700 text-white' : 'border-rose-200 bg-white text-slate-700 hover:bg-rose-100'}`}
              >
                {choice}
              </button>
            ))}
          </div>
          {selectedAnswer === QUICK_CHECK.answer && <p className="mt-3 text-sm leading-6 text-emerald-800">{QUICK_CHECK.feedback}</p>}
          {selectedAnswer && selectedAnswer !== QUICK_CHECK.answer && <p className="mt-3 text-sm leading-6 text-rose-800">提示：先看圓圖上相對的兩端；六沖由相對位置的一對地支構成。</p>}
        </section>
      )}
    </div>
  );
};
