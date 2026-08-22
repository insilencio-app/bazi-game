/* Design reminder — 五行研習桌：以靛藍流程、羊皮紙閱讀面與低干擾的五行色帶，把十神由名詞清單轉成可重覆使用的判讀工作流。 */
import React, { useState } from 'react';

interface TenGodsLessonGuideProps {
  stepId: number;
}

const CHAPTERS = [
  {
    title: '第一章・先定關係',
    cue: '五行關係 → 陰陽正偏',
    stepIds: [1, 2, 25, 3, 4],
    tone: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    marker: 'bg-indigo-700',
  },
  {
    title: '第二章・再看力量',
    cue: '速查 → 位置 → 透根 → 互動',
    stepIds: [45, 46, 5],
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
    marker: 'bg-amber-600',
  },
  {
    title: '第三章・放回全局',
    cue: '時間層次 → 制化與發揮',
    stepIds: [71, 72],
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    marker: 'bg-emerald-700',
  },
] as const;

const TRANSFER_CHECK = {
  prompt: '日主是甲木，現在看到癸水。應先判為哪一個十神？',
  answer: '正印',
  choices: ['偏印', '正印', '正官', '傷官'],
  feedback: '水生木，先定為印星；甲為陽、癸為陰，陰陽相異，所以是正印。',
} as const;

export const TenGodsLessonGuide: React.FC<TenGodsLessonGuideProps> = ({ stepId }) => {
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const currentChapterIndex = Math.max(0, CHAPTERS.findIndex((chapter) => (chapter.stepIds as readonly number[]).includes(stepId)));
  const currentChapter = CHAPTERS[currentChapterIndex];
  const isOpeningStep = stepId === 1;
  const shouldShowChapterMap = isOpeningStep || [3, 45, 71].includes(stepId);

  return (
    <div className="space-y-4">
      {isOpeningStep && (
        <section className="rounded-2xl border border-indigo-200 bg-[linear-gradient(135deg,#eef2ff_0%,#fffdf7_58%,#fff7e6_100%)] p-4 sm:p-5">
          <p className="text-xs font-bold tracking-[0.16em] text-indigo-700">本課任務・TEN GODS WORKFLOW</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h3 className="font-serif text-xl font-black text-slate-900">由日主與一個天干，走到有根據的十神判讀。</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">本課不要求你把十個名稱一次背熟；你要完成的是一條可重覆使用的路徑：先定五行關係，再用陰陽分出正偏，最後才把它放回旺衰、位置與互動。</p>
            </div>
            <div className="rounded-xl border border-white/90 bg-white/75 p-3 shadow-sm">
              <p className="text-xs font-bold text-amber-700">完成條件</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">能完成至少 3 次「關係 → 正偏 → 十神」轉換，並說出為何不能只看名稱。</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">前置：第 1 課五行生剋、第 2 課天干陰陽。</p>
            </div>
          </div>
        </section>
      )}

      {shouldShowChapterMap && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4" aria-label="第 5 課學習地圖">
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

      {stepId === 3 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-label="十神轉換自檢">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-amber-700">30 秒轉換自檢・不計分</p>
              <p className="mt-1 font-bold text-slate-900">{TRANSFER_CHECK.prompt}</p>
            </div>
            {selectedCheck && (
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${selectedCheck === TRANSFER_CHECK.answer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {selectedCheck === TRANSFER_CHECK.answer ? '轉換正確' : '再由五行關係開始'}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TRANSFER_CHECK.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setSelectedCheck(choice)}
                className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${selectedCheck === choice ? 'border-indigo-600 bg-indigo-700 text-white' : 'border-amber-200 bg-white text-slate-700 hover:bg-amber-100'}`}
              >
                {choice}
              </button>
            ))}
          </div>
          {selectedCheck === TRANSFER_CHECK.answer && <p className="mt-3 text-sm leading-6 text-emerald-800">{TRANSFER_CHECK.feedback}</p>}
          {selectedCheck && selectedCheck !== TRANSFER_CHECK.answer && <p className="mt-3 text-sm leading-6 text-rose-800">提示：先問「水對木做了甚麼？」；確定是印星後，才用甲、癸的陰陽同異分正偏。</p>}
        </section>
      )}
    </div>
  );
};
