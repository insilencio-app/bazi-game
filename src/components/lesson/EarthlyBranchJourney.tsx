/* Design reminder — 五行研習桌：以羊皮紙閱讀面、靛藍導引與五行色彩，把十二地支由名詞表轉成可跟隨的時間與季節地圖。 */
import React, { useMemo, useState } from 'react';
import { ELEMENT_STYLES, mockEarthlyBranches } from '../../data/mockData';
import { EarthlyBranchRing } from '../EarthlyBranchRing';

type JourneyStage = 1 | 2 | 3 | 4 | 5;

interface EarthlyBranchJourneyProps {
  stage: JourneyStage;
}

const SEASON_GROUPS = [
  { label: '春', note: '寅卯辰・木旺', branches: ['寅', '卯', '辰'], tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { label: '夏', note: '巳午未・火旺', branches: ['巳', '午', '未'], tone: 'border-rose-200 bg-rose-50 text-rose-800' },
  { label: '秋', note: '申酉戌・金旺', branches: ['申', '酉', '戌'], tone: 'border-slate-300 bg-slate-50 text-slate-700' },
  { label: '冬', note: '亥子丑・水旺', branches: ['亥', '子', '丑'], tone: 'border-sky-200 bg-sky-50 text-sky-800' },
] as const;

const QUICK_CHECK = {
  prompt: '上午 9:00 至 11:00，對應哪一個地支？',
  answer: '巳',
  choices: ['辰', '巳', '午', '未'],
} as const;

export const EarthlyBranchJourney: React.FC<EarthlyBranchJourneyProps> = ({ stage }) => {
  const [quickCheckAnswer, setQuickCheckAnswer] = useState<string | null>(null);
  const orderedBranches = useMemo(() => [...mockEarthlyBranches].sort((a, b) => a.branch_number - b.branch_number), []);

  const renderBranchChip = (branchName: string, showDetail = false) => {
    const branch = orderedBranches.find((item) => item.name_cn === branchName);
    if (!branch) return null;
    const tone = ELEMENT_STYLES[branch.element] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

    return (
      <div key={branch.name_cn} className={`rounded-xl border ${tone.border} ${tone.bg} px-3 py-2 text-center shadow-sm`}>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className={`text-2xl font-black ${tone.text}`}>{branch.name_cn}</span>
          <span className="text-sm font-semibold text-gray-700">{branch.zodiac_animal}</span>
        </div>
        {showDetail && <p className="mt-1 text-xs text-gray-600">{branch.hour_range}・{branch.yin_yang === 'yang' ? '陽' : '陰'}{branch.element}</p>}
      </div>
    );
  };

  if (stage === 1) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-indigo-900">地支不是另一組要硬背的字</p>
          <p className="mt-1 text-sm leading-6 text-indigo-800">它是一張把<strong>時間、季節與地上節律</strong>放在一起的十二格地圖。</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            ['先認順序', '子丑寅卯…是一個循環，不是一串孤立名詞。'],
            ['再連生肖與時辰', '生肖幫助記憶；時辰讓地支回到日常時間。'],
            ['最後看季節', '地支的力量與季節位置有關，後面課程會再深入。'],
          ].map(([title, description], index) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs font-bold tracking-[0.12em] text-amber-700">0{index + 1}</p>
              <p className="mt-1 font-bold text-slate-800">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-900">
          本課任務：看見一個地支時，能說出它在十二格循環中的位置與一個基本線索。
        </div>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          <span>由子開始，順時針走完十二格。</span>
          <span className="font-semibold text-indigo-700">生肖是記憶掛鉤</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {orderedBranches.map((branch) => renderBranchChip(branch.name_cn))}
        </div>
        <div className="hidden md:block">
          <EarthlyBranchRing title="十二地支循環圖：由子開始，走完一天與一年" showSeasons />
        </div>
        <p className="text-center text-sm text-gray-600 md:hidden">在手機先記住「子、卯、午、酉」四個方向點；下一步再把它們連到一天的時辰。</p>
      </div>
    );
  }

  if (stage === 3) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {orderedBranches.map((branch) => renderBranchChip(branch.name_cn, true))}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-amber-700">30 秒自檢・不計分</p>
              <p className="mt-1 font-bold text-slate-800">{QUICK_CHECK.prompt}</p>
            </div>
            {quickCheckAnswer && (
              <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${quickCheckAnswer === QUICK_CHECK.answer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {quickCheckAnswer === QUICK_CHECK.answer ? '答對了：巳時' : '再看一次時辰卡'}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_CHECK.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setQuickCheckAnswer(choice)}
                className={`rounded-lg border px-3 py-2 font-bold transition-colors ${quickCheckAnswer === choice ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-amber-200 bg-white text-slate-700 hover:bg-amber-100'}`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 4) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SEASON_GROUPS.map((season) => (
            <section key={season.label} className={`rounded-2xl border p-4 ${season.tone}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-black">{season.label}季</h3>
                <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold">{season.note}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {season.branches.map((branch) => renderBranchChip(branch))}
              </div>
            </section>
          ))}
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-900">
          這裡先建立季節位置感。第 4 課會再用節氣與月令判斷八字月份；第 6、7 課再回到藏干與地支關係。
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          ['年柱', '背景與世代環境', '先看它提供甚麼背景線索。'],
          ['月柱', '月令與季節位置', '後續判斷旺衰時特別重要。'],
          ['日柱', '日主所在的一柱', '日支會與日主共同構成核心座標。'],
          ['時柱', '行動與結果的時間面向', '時支也需要回到全局理解。'],
        ].map(([title, cue, note], index) => (
          <div key={title} className={`rounded-xl border p-3 ${['border-slate-200 bg-slate-50', 'border-indigo-200 bg-indigo-50', 'border-amber-200 bg-amber-50', 'border-emerald-200 bg-emerald-50'][index]}`}>
            <p className="text-xs font-bold tracking-[0.12em] text-gray-500">第 {index + 1} 柱</p>
            <p className="mt-1 text-lg font-black text-slate-800">{title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{cue}</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="font-bold text-slate-800">本課收束</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">看到地支時，先定位它在十二格中的位置，再看它對應的時辰、季節與五行。不要只把生肖當成結論；判盤時仍要回到整個命局。</p>
      </div>
    </div>
  );
};
