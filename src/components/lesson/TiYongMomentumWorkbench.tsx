/* 五行研習桌設計提醒：以羊皮紙、深靛藍與五行證據卡呈現「形→氣→勢」；互動只供學習，不改正式測驗分數、XP 或完成狀態。 */
import React, { useState } from 'react';

interface TiYongMomentumWorkbenchProps {
  stepId: number;
}

type ElementName = '木' | '火' | '土' | '金' | '水';

const CHAPTERS = [
  { title: '第一章・先分體用', cue: '先定閱讀鏡頭，不貼吉凶標籤', steps: [1, 2], tone: 'border-indigo-200 bg-indigo-50 text-indigo-800', marker: 'bg-indigo-700' },
  { title: '第二章・記錄形氣勢', cue: '透干、根氣與蓄勢分層觀察', steps: [3, 4, 5, 6, 7], tone: 'border-amber-200 bg-amber-50 text-amber-900', marker: 'bg-amber-600' },
  { title: '第三章・五氣全看', cue: '逐項建卡，再看全局配合', steps: [8, 9], tone: 'border-emerald-200 bg-emerald-50 text-emerald-900', marker: 'bg-emerald-700' },
] as const;

const ELEMENT_EVIDENCE: Record<ElementName, { tone: string; chip: string; symbol: string; visible: string[]; support: string[]; potential: string[]; summary: string }> = {
  木: {
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    chip: 'bg-emerald-700',
    symbol: '甲',
    visible: ['天干：甲木已透'],
    support: ['地支：寅、卯可作木的根氣線索', '季節：以春令的教學設定作支持證據'],
    potential: ['需要再看其餘干支是否制約、通關或耗洩'],
    summary: '木同時有形與根氣；本課只記錄支持度，不以此直接判定喜忌。',
  },
  火: {
    tone: 'border-rose-200 bg-rose-50 text-rose-900',
    chip: 'bg-rose-700',
    symbol: '丙',
    visible: ['天干：丙火已透'],
    support: ['可見力量已出現，仍須檢查是否有同類根與月令支持'],
    potential: ['不能因為透干就直接判為最強或最有利'],
    summary: '火有形；氣與勢仍要以根、令和全局關係補足。',
  },
  土: {
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
    chip: 'bg-amber-700',
    symbol: '戊',
    visible: ['本命例沒有把土透於天干'],
    support: ['可回到寅中戊土等藏干再檢查具體位置'],
    potential: ['單一藏干僅是線索，不能自動變成結論'],
    summary: '土可記為待核對的藏干線索；資料不足時，應保留而非忽略。',
  },
  金: {
    tone: 'border-slate-300 bg-slate-50 text-slate-800',
    chip: 'bg-slate-600',
    symbol: '庚',
    visible: ['本命例沒有金透於天干'],
    support: ['本命例未提供明確金的月令或根氣支持'],
    potential: ['沒有明確證據時，最適合標為「待驗證」'],
    summary: '金的可見證據不足；本課不把資料不足誤寫成「完全不存在」。',
  },
  水: {
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
    chip: 'bg-sky-700',
    symbol: '癸',
    visible: ['天干：癸水已透'],
    support: ['地支：亥提供水的根氣線索'],
    potential: ['仍須比較水與木、火之間的生剋及月令條件'],
    summary: '水有形也有根氣；是否成為主導仍要回到五氣全看。',
  },
};

const QUICK_CHECK = {
  prompt: '某五行沒有透天干，但在兩個地支藏干中出現，且與月令同類。最穩妥的描述是甚麼？',
  choices: [
    '它完全不存在，可以忽略。',
    '它一定是最強的力量。',
    '它可記為有蓄勢與支持，仍要連同透干、根氣與全局配合確認。',
    '它已經可以直接判定喜忌。',
  ],
  answer: '它可記為有蓄勢與支持，仍要連同透干、根氣與全局配合確認。',
} as const;

export const TiYongMomentumWorkbench: React.FC<TiYongMomentumWorkbenchProps> = ({ stepId }) => {
  const [selectedElement, setSelectedElement] = useState<ElementName>('木');
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const currentChapterIndex = Math.max(0, CHAPTERS.findIndex((chapter) => (chapter.steps as readonly number[]).includes(stepId)));
  const currentChapter = CHAPTERS[currentChapterIndex];
  const activeEvidence = ELEMENT_EVIDENCE[selectedElement];
  const shouldShowMap = stepId === 1 || [3, 8].includes(stepId);

  return (
    <div className="space-y-4">
      {stepId === 1 && (
        <section className="rounded-2xl border border-indigo-200 bg-[linear-gradient(135deg,#eef2ff_0%,#fffdf7_58%,#f4faf5_100%)] p-4 sm:p-5">
          <p className="text-xs font-bold tracking-[0.16em] text-indigo-700">本課任務・MOMENTUM WORKBENCH</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h3 className="font-serif text-xl font-black text-slate-900">把已學過的干支資料，整理成可檢查的形、氣、勢證據。</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">本課不以一個字定吉凶，也不以命盤判斷人生結果。你要完成的是：分開記錄可見力量、根氣支持與仍在蓄勢的線索，再用保留條件描述全局。</p>
            </div>
            <div className="rounded-xl border border-white/90 bg-white/75 p-3 shadow-sm">
              <p className="text-xs font-bold text-amber-700">完成條件</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">能為至少兩個五行列出「形、氣、勢」證據，並說出為何資料不足時不能下結論。</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">前置：日主、月令、十神、藏干與地支關係。</p>
            </div>
          </div>
        </section>
      )}

      {shouldShowMap && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4" aria-label="第 9 課學習地圖">
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
        <section className="grid gap-3 sm:grid-cols-2" aria-label="體用分組示意">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-bold tracking-[0.12em] text-indigo-700">體・承載與基礎</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">先以日主及支持日主的印、比劫作為閱讀群組。這是本課的整理方式，不等同固定的吉神或喜用神。</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold tracking-[0.12em] text-amber-700">用・功能與流向</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">先以食傷、財、官殺等外向功能作為另一群組。重點是觀察流通與配合，不是替任何一組判定好壞。</p>
          </div>
        </section>
      )}

      {stepId === 3 && (
        <section className="grid gap-2 sm:grid-cols-3" aria-label="形氣勢三層閱讀">
          {[
            ['形', '天干已透、可直接記錄的力量', 'border-indigo-200 bg-indigo-50 text-indigo-800'],
            ['氣', '月令、通根、同柱或組合帶來的支持', 'border-amber-200 bg-amber-50 text-amber-900'],
            ['勢', '未透但在藏干或地支關係中累積的線索', 'border-emerald-200 bg-emerald-50 text-emerald-800'],
          ].map(([label, description, tone]) => (
            <div key={label} className={`rounded-xl border p-3 ${tone}`}>
              <p className="font-serif text-xl font-black">{label}</p>
              <p className="mt-1 text-sm leading-6">{description}</p>
            </div>
          ))}
        </section>
      )}

      {[4, 5, 6, 7].includes(stepId) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-label="形氣勢證據次序">
          <p className="text-xs font-bold tracking-[0.12em] text-slate-500">證據次序</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {[
              ['1', '記形', '哪些五行已透天干？'],
              ['2', '找氣', '月令、根氣與組合是否支持？'],
              ['3', '記勢', '哪些未透力量仍有蓄勢？'],
              ['4', '看配合', '支持、制約或資料不足？'],
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

      {[8, 9].includes(stepId) && (
        <section className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#fffdf7_52%,#f0f9ff_100%)] p-4 sm:p-5" aria-label="五氣觀測台">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-amber-700">固定教學命例・不計分</p>
              <h3 className="mt-1 font-serif text-xl font-black text-slate-900">五氣觀測台</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">教學資料：天干見甲、丙、癸；地支見寅、卯、亥。點選五行，查看本課如何記錄形、氣與勢。</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-bold text-amber-800">只練證據，不判人生</span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {(Object.keys(ELEMENT_EVIDENCE) as ElementName[]).map((element) => {
              const evidence = ELEMENT_EVIDENCE[element];
              const isSelected = selectedElement === element;
              return (
                <button
                  key={element}
                  type="button"
                  onClick={() => setSelectedElement(element)}
                  className={`rounded-xl border px-2 py-3 text-center transition-all ${isSelected ? `${evidence.tone} shadow-sm ring-2 ring-white` : 'border-slate-200 bg-white/75 text-slate-600 hover:bg-white'}`}
                >
                  <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-black text-white ${isSelected ? evidence.chip : 'bg-slate-400'}`}>{element}</span>
                  <span className="mt-1 block text-sm font-black">{element}</span>
                </button>
              );
            })}
          </div>
          <div className={`mt-4 rounded-xl border p-4 ${activeEvidence.tone}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-full text-xl font-black text-white ${activeEvidence.chip}`}>{activeEvidence.symbol}</span>
              <div>
                <p className="font-bold">{selectedElement}的證據卡</p>
                <p className="text-sm leading-6">{activeEvidence.summary}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ['形', activeEvidence.visible],
                ['氣', activeEvidence.support],
                ['勢／保留', activeEvidence.potential],
              ].map(([label, items]) => (
                <div key={label as string} className="rounded-lg border border-white/80 bg-white/70 p-3">
                  <p className="text-xs font-black tracking-[0.12em] text-slate-600">{label}</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
                    {(items as string[]).map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {stepId === 9 && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-label="形氣勢自檢">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-emerald-700">30 秒自檢・不計分</p>
              <p className="mt-1 font-bold text-slate-900">{QUICK_CHECK.prompt}</p>
            </div>
            {selectedCheck && (
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${selectedCheck === QUICK_CHECK.answer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {selectedCheck === QUICK_CHECK.answer ? '描述穩妥' : '再回到形、氣、勢'}
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {QUICK_CHECK.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setSelectedCheck(choice)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${selectedCheck === choice ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-200 bg-white text-slate-700 hover:bg-emerald-100'}`}
              >
                {choice}
              </button>
            ))}
          </div>
          {selectedCheck && <p className={`mt-3 text-sm leading-6 ${selectedCheck === QUICK_CHECK.answer ? 'text-emerald-800' : 'text-rose-800'}`}>{selectedCheck === QUICK_CHECK.answer ? '正確：未透不等於不存在；有蓄勢也不等於可直接下喜忌結論。' : '提示：先分清「有沒有透出」與「有沒有支持」，再保留仍需要全局驗證的部分。'}</p>}
        </section>
      )}
    </div>
  );
};
