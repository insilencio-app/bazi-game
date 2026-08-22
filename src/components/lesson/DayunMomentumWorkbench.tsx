/* 五行研習桌設計提醒：第 10 課以「原局→運干→運支→相對變化」的時序試驗桌呈現大運升降浮沉；只練盤面證據，不作人生預言。 */
import React, { useState } from 'react';

interface DayunMomentumWorkbenchProps {
  stepId: number;
}

type ScenarioId = 'root' | 'manifest' | 'relative';

const CHAPTERS = [
  { title: '第一章・先定時間層次', cue: '原局是基線；大運提供新的干支條件', steps: [1, 2, 3], tone: 'border-indigo-200 bg-indigo-50 text-indigo-800', marker: 'bg-indigo-700' },
  { title: '第二章・讀升、降、浮、沉', cue: '落根、顯現與相對支持／制約', steps: [4, 5, 6], tone: 'border-amber-200 bg-amber-50 text-amber-900', marker: 'bg-amber-600' },
  { title: '第三章・偏看後再全看', cue: '更新五氣證據，保留未確認條件', steps: [7, 8, 9], tone: 'border-emerald-200 bg-emerald-50 text-emerald-900', marker: 'bg-emerald-700' },
] as const;

const SCENARIOS: Record<ScenarioId, {
  tab: string;
  title: string;
  original: string[];
  luckPillar: { stem: string; branch: string };
  observation: string;
  tags: Array<{ label: string; tone: string }>;
  note: string;
}> = {
  root: {
    tab: 'A・落根',
    title: '甲木得寅：可記為新的根氣線索',
    original: ['原局天干：甲木已透', '原局地支：未見明顯寅、卯、亥支持', '閱讀重點：先確認甲木有形，但根氣證據偏少'],
    luckPillar: { stem: '戊', branch: '寅' },
    observation: '寅可為甲木提供新的根氣線索。本課稱為「降／落根」：可見力量獲得支持，不等於直接判為人生上升。',
    tags: [{ label: '甲木：有形', tone: 'bg-emerald-700' }, { label: '寅：新增根氣', tone: 'bg-amber-600' }],
    note: '仍要連同月令、其餘干支與生剋關係檢查支持度。',
  },
  manifest: {
    tab: 'B・顯現',
    title: '寅藏丙遇丙：藏干成為可見訊號',
    original: ['原局地支：寅中藏丙', '原局天干：未見丙火', '閱讀重點：丙火先是藏干線索，尚未透於天干'],
    luckPillar: { stem: '丙', branch: '午' },
    observation: '運干丙令原局寅中丙火成為可見力量。本課稱為「升／顯現」：由藏干線索轉為可觀察的天干訊號。',
    tags: [{ label: '丙火：原局藏干', tone: 'bg-rose-700' }, { label: '丙：運干顯現', tone: 'bg-amber-600' }],
    note: '顯現不等於自動最強；仍要查根、令與五氣整體關係。',
  },
  relative: {
    tab: 'C・浮沉',
    title: '丙火遇壬子：更新相對支持與制約',
    original: ['原局天干：丙火已透', '原局地支：丙火另有支持線索', '閱讀重點：先建立丙火既有的形與氣基線'],
    luckPillar: { stem: '壬', branch: '子' },
    observation: '壬子帶來水的可見與地支訊號，可能改變丙火所受的相對支持與制約。本課以「浮沉」記錄變化，不把它翻譯成必然好壞。',
    tags: [{ label: '丙火：既有形氣', tone: 'bg-rose-700' }, { label: '壬子：新增水訊號', tone: 'bg-sky-700' }],
    note: '必須再查月令、根氣、通關與其餘五行，才可寫出有條件的全局描述。',
  },
};

const QUICK_CHECK = {
  prompt: '原局寅中藏丙，天干未見丙；大運天干出現丙。哪一句最符合本課的記錄方法？',
  choices: [
    '丙火必定帶來某種人生結果。',
    '丙火原本完全不存在，所以不需要比較。',
    '丙火由藏干線索轉為可見訊號；仍要連同根、令與全局條件檢查。',
    '只要大運出現丙，就可以忽略地支。',
  ],
  answer: '丙火由藏干線索轉為可見訊號；仍要連同根、令與全局條件檢查。',
} as const;

export const DayunMomentumWorkbench: React.FC<DayunMomentumWorkbenchProps> = ({ stepId }) => {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('root');
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const scenario = SCENARIOS[scenarioId];
  const currentChapterIndex = Math.max(0, CHAPTERS.findIndex((chapter) => (chapter.steps as readonly number[]).includes(stepId)));
  const currentChapter = CHAPTERS[currentChapterIndex];
  const shouldShowMap = stepId === 1 || [4, 7].includes(stepId);

  return (
    <div className="space-y-4">
      {stepId === 1 && (
        <section className="rounded-2xl border border-indigo-200 bg-[linear-gradient(135deg,#eef2ff_0%,#fffdf7_56%,#f5fbf4_100%)] p-4 sm:p-5">
          <p className="text-xs font-bold tracking-[0.16em] text-indigo-700">本課任務・DAYUN MOMENTUM DESK</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h3 className="font-serif text-xl font-black text-slate-900">把一柱大運放回原局，分開記錄運干、運支與氣勢變化。</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">第 8 課教你排出大運；本課只讀一柱大運進入後的盤面證據。你會練習辨認落根、顯現及相對支持或制約，並保留尚待確認的條件。</p>
            </div>
            <div className="rounded-xl border border-white/90 bg-white/75 p-3 shadow-sm">
              <p className="text-xs font-bold text-amber-700">完成條件</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">能在固定情境中指出一次「降／落根」、一次「升／顯現」，並用有條件的語句描述一項浮沉變化。</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">前置：藏干、月令、干支關係、第 8 課排運與第 9 課形氣勢。</p>
            </div>
          </div>
        </section>
      )}

      {shouldShowMap && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4" aria-label="第 10 課學習地圖">
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

      {stepId === 2 && (
        <section className="grid gap-3 sm:grid-cols-3" aria-label="原局大運流年時間層次">
          {[
            ['原局', '既有基線', '透干、根氣、藏干、月令與五氣的已知資料', 'border-slate-200 bg-slate-50 text-slate-800'],
            ['大運', '較長時間層次', '帶來一組新的運干與運支條件，回到原局檢查', 'border-indigo-200 bg-indigo-50 text-indigo-900'],
            ['流年', '較短新增訊號', '可在大運的閱讀後再加入，不能脫離原局與運柱', 'border-amber-200 bg-amber-50 text-amber-900'],
          ].map(([label, title, description, tone]) => (
            <div key={label} className={`rounded-xl border p-3 ${tone}`}>
              <p className="text-xs font-black tracking-[0.12em]">{label}</p>
              <p className="mt-2 font-bold">{title}</p>
              <p className="mt-1 text-sm leading-6">{description}</p>
            </div>
          ))}
        </section>
      )}

      {stepId === 3 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-label="大運干支一體閱讀">
          <p className="text-xs font-bold tracking-[0.12em] text-slate-500">一柱運・雙層觀察</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
              <p className="text-xs font-black tracking-[0.12em] text-rose-700">運干</p>
              <p className="mt-1 font-serif text-2xl font-black text-rose-800">可見訊號</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">它可令某一五行成為可觀察的力量，也可能回應原局已有的藏干。</p>
            </div>
            <span className="hidden text-xl font-black text-amber-600 sm:block">＋</span>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-xs font-black tracking-[0.12em] text-emerald-700">運支</p>
              <p className="mt-1 font-serif text-2xl font-black text-emerald-800">根氣與關係線索</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">它可提供根氣、藏干、季節或地支關係；不能只看其中一半。</p>
            </div>
          </div>
        </section>
      )}

      {[4, 5, 6, 8, 9].includes(stepId) && (
        <section className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#fffdf7_56%,#f0f9ff_100%)] p-4 sm:p-5" aria-label="大運氣勢實驗桌">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-amber-700">固定教學情境・不計分</p>
              <h3 className="mt-1 font-serif text-xl font-black text-slate-900">大運氣勢實驗桌</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">點選情境，先看原局基線，再把一柱大運放回來記錄「落根、顯現或相對浮沉」。</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-bold text-amber-800">只記證據，不判人生</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => {
              const item = SCENARIOS[id];
              const isActive = id === scenarioId;
              return (
                <button key={id} type="button" onClick={() => setScenarioId(id)} className={`rounded-xl border px-3 py-3 text-left transition-colors ${isActive ? 'border-amber-700 bg-amber-700 text-white shadow-sm' : 'border-amber-200 bg-white/80 text-slate-700 hover:bg-amber-50'}`}>
                  <p className="text-xs font-black tracking-[0.1em]">{item.tab}</p>
                  <p className="mt-1 text-sm font-bold">{item.title}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.72fr_1.12fr]">
            <div className="rounded-xl border border-white/90 bg-white/75 p-3">
              <p className="text-xs font-black tracking-[0.12em] text-slate-600">原局・基線</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">{scenario.original.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-center">
              <p className="text-xs font-black tracking-[0.12em] text-indigo-700">大運一柱</p>
              <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-indigo-200 font-serif text-2xl font-black text-indigo-900">
                <span className="bg-white px-2 py-3">{scenario.luckPillar.stem}</span>
                <span className="border-l border-indigo-200 bg-indigo-100 px-2 py-3">{scenario.luckPillar.branch}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-indigo-800">先把干、支一起放回原局。</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-black tracking-[0.12em] text-emerald-700">觀測紀錄</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{scenario.observation}</p>
              <div className="mt-3 flex flex-wrap gap-2">{scenario.tags.map((tag) => <span key={tag.label} className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${tag.tone}`}>{tag.label}</span>)}</div>
              <p className="mt-3 border-t border-emerald-200 pt-3 text-xs leading-5 text-emerald-900">保留：{scenario.note}</p>
            </div>
          </div>
        </section>
      )}

      {stepId === 7 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-label="偏看與全看次序">
          <p className="text-xs font-bold tracking-[0.12em] text-slate-500">寫觀測卡的固定次序</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {[
              ['1', '原局基線', '先列原局的形、氣、勢。'],
              ['2', '運干更新', '記錄哪一股力量變得可見。'],
              ['3', '運支更新', '記錄根氣、藏干與關係線索。'],
              ['4', '全局條件', '再看流通、制約、月令與待驗證。'],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-black text-white">{number}</span>
                <p className="mt-2 text-sm font-bold text-slate-800">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {stepId === 9 && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-label="大運升降浮沉自檢">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-emerald-700">30 秒自檢・不計分</p>
              <p className="mt-1 font-bold text-slate-900">{QUICK_CHECK.prompt}</p>
            </div>
            {selectedCheck && <span className={`rounded-full px-3 py-1 text-sm font-bold ${selectedCheck === QUICK_CHECK.answer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{selectedCheck === QUICK_CHECK.answer ? '描述穩妥' : '再回到證據次序'}</span>}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {QUICK_CHECK.choices.map((choice) => (
              <button key={choice} type="button" onClick={() => setSelectedCheck(choice)} className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${selectedCheck === choice ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-200 bg-white text-slate-700 hover:bg-emerald-100'}`}>{choice}</button>
            ))}
          </div>
          {selectedCheck && <p className={`mt-3 text-sm leading-6 ${selectedCheck === QUICK_CHECK.answer ? 'text-emerald-800' : 'text-rose-800'}`}>{selectedCheck === QUICK_CHECK.answer ? '正確：先記錄「由藏干轉為可見」，再保留根、令與全局條件。' : '提示：不要把一個運干或運支翻譯成人生結果；先比較原局基線、運干顯現與運支根氣。'}</p>}
        </section>
      )}
    </div>
  );
};
