/* 五行研習桌設計提醒：手機仍保留完整十二地支時鐘以建立循環定位；環內只顯示支字與四季方位，藏干證據由點選後的單一卡片承載。 */
import React, { useEffect, useState } from 'react';
import { mockEarthlyBranches, ELEMENT_STYLES } from '../data/mockData';

interface EarthlyBranchRingProps {
  showStems?: boolean;
  highlightedBranches?: string[];
  showSeasons?: boolean;
  showTrinityLines?: boolean;
  showTrinityLegend?: boolean;
  compactOnMobile?: boolean;
  title?: string;
}

export const EarthlyBranchRing: React.FC<EarthlyBranchRingProps> = ({
  showStems = false,
  highlightedBranches = [],
  showSeasons = true,
  showTrinityLines = false,
  showTrinityLegend = false,
  compactOnMobile = false,
  title,
}) => {
  const SIZE = 380;
  const RADIUS = 140;
  const CARD = 64;
  const TRINITY_DOT_RADIUS = 96;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const SEASON_RING_RADIUS = 180;
  const SEASON_RING_STROKE = 16;
  const SEASON_LABEL_RADIUS = SEASON_RING_RADIUS - 2;

  const fmtTime = (r: string) => r.replace(/:00/g, '').replace('-', '–');

  // Map branch_number to its primary heavenly stem (十天干)
  const branchToStemMap: Record<number, string> = {
    1: '癸', // 子
    2: '己', // 丑 (本氣)
    3: '甲', // 寅
    4: '乙', // 卯
    5: '戊', // 辰
    6: '丙', // 巳
    7: '丁', // 午
    8: '己', // 未
    9: '庚', // 申
    10: '辛', // 酉
    11: '戊', // 戌
    12: '壬', // 亥
  };
  const hiddenStemsByBranch: Record<string, [string, string?, string?]> = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'], 辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'], 未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
  };

  const getStemForBranch = (branchNumber: number) => branchToStemMap[branchNumber] || '?';
  const isHighlighted = (branchName: string) => highlightedBranches.length === 0 || highlightedBranches.includes(branchName);
  const initialMobileBranch = highlightedBranches[0] ?? mockEarthlyBranches[0]?.name_cn ?? '子';
  const highlightedKey = highlightedBranches.join('|');
  const [mobileSelectedBranch, setMobileSelectedBranch] = useState(initialMobileBranch);

  useEffect(() => {
    setMobileSelectedBranch(highlightedBranches[0] ?? mockEarthlyBranches[0]?.name_cn ?? '子');
  }, [highlightedKey]);

  const seasonArcs = [
    { name: '春', branches: '寅卯辰', elementNote: '木旺', color: '#22c55e', startDeg: -45, endDeg: 45, labelDeg: 0 },
    { name: '夏', branches: '巳午未', elementNote: '火旺', color: '#ef4444', startDeg: 45, endDeg: 135, labelDeg: 90 },
    { name: '秋', branches: '申酉戌', elementNote: '金旺', color: '#64748b', startDeg: 135, endDeg: 225, labelDeg: 180 },
    { name: '冬', branches: '亥子丑', elementNote: '水旺', color: '#3b82f6', startDeg: 225, endDeg: 315, labelDeg: 270 },
  ];

  const trinityGroups = [
    { label: '寅午戌火局', branches: ['寅', '午', '戌'], color: '#ef4444' },
    { label: '申子辰水局', branches: ['申', '子', '辰'], color: '#3b82f6' },
    { label: '亥卯未木局', branches: ['亥', '卯', '未'], color: '#22c55e' },
    { label: '巳酉丑金局', branches: ['巳', '酉', '丑'], color: '#64748b' },
  ];

  const polar = (radius: number, degree: number) => {
    const rad = (degree * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (radius: number, startDeg: number, endDeg: number) => {
    const normalizedEnd = endDeg < startDeg ? endDeg + 360 : endDeg;
    const start = polar(radius, startDeg);
    const end = polar(radius, normalizedEnd);
    const largeArc = normalizedEnd - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const getBranchDotPoint = (branchName: string) => {
    const idx = mockEarthlyBranches.findIndex((b) => b.name_cn === branchName);
    if (idx < 0) return null;
    const angleRad = ((idx * 30 - 90) * Math.PI) / 180;
    return {
      x: Math.round(cx + TRINITY_DOT_RADIUS * Math.cos(angleRad)),
      y: Math.round(cy + TRINITY_DOT_RADIUS * Math.sin(angleRad)),
    };
  };

  const trinityColorByBranch: Record<string, string> = {};
  trinityGroups.forEach((group) => {
    group.branches.forEach((b) => {
      trinityColorByBranch[b] = group.color;
    });
  });

  const mobileSelected = mockEarthlyBranches.find((branch) => branch.name_cn === mobileSelectedBranch) ?? mockEarthlyBranches[0];
  const mobileSelectedStyle = mobileSelected
    ? ELEMENT_STYLES[mobileSelected.element] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
    : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  const MOBILE_SIZE = 280;
  const MOBILE_RADIUS = 100;
  const MOBILE_NODE = 38;
  const mobileCenter = MOBILE_SIZE / 2;

  const getMobilePoint = (index: number) => {
    const angleRad = ((index * 30 - 90) * Math.PI) / 180;
    return {
      left: ((mobileCenter + MOBILE_RADIUS * Math.cos(angleRad)) / MOBILE_SIZE) * 100,
      top: ((mobileCenter + MOBILE_RADIUS * Math.sin(angleRad)) / MOBILE_SIZE) * 100,
    };
  };
  const describeMobileArc = (radius: number, startDeg: number, endDeg: number) => {
    const normalizedEnd = endDeg < startDeg ? endDeg + 360 : endDeg;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (normalizedEnd * Math.PI) / 180;
    const startX = mobileCenter + radius * Math.cos(startRad);
    const startY = mobileCenter + radius * Math.sin(startRad);
    const endX = mobileCenter + radius * Math.cos(endRad);
    const endY = mobileCenter + radius * Math.sin(endRad);
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${normalizedEnd - startDeg > 180 ? 1 : 0} 1 ${endX} ${endY}`;
  };
  const mobileHiddenStems = hiddenStemsByBranch[mobileSelected?.name_cn ?? '子'] ?? [getStemForBranch(mobileSelected?.branch_number ?? 1)];

  return (
    <div className={title ? 'rounded-2xl border border-indigo-200 bg-indigo-50 p-3 sm:p-4' : ''}>
      {title && <p className="text-xs sm:text-sm font-semibold text-indigo-800 mb-2">{title}</p>}
      {compactOnMobile && mobileSelected && (
        <section className="sm:hidden" aria-label="手機版十二地支互動聚焦環">
          <p className="mb-2 text-xs font-semibold leading-5 text-indigo-700">順時針由子讀到亥；點選一支，再查看它的藏干線索。</p>
          <div className="relative mx-auto aspect-square w-full max-w-[280px]" aria-label="十二地支時鐘">
            <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox={`0 0 ${MOBILE_SIZE} ${MOBILE_SIZE}`}>
              {showSeasons && seasonArcs.map((season) => (
                <path
                  key={`mobile-${season.name}`}
                  d={describeMobileArc(MOBILE_SIZE / 2 - 14, season.startDeg, season.endDeg)}
                  fill="none"
                  stroke={season.color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.22"
                />
              ))}
              {showSeasons && seasonArcs.map((season) => {
                const degree = (season.labelDeg * Math.PI) / 180;
                const labelRadius = MOBILE_SIZE / 2 - 6;
                return (
                  <text
                    key={`mobile-label-${season.name}`}
                    x={mobileCenter + labelRadius * Math.cos(degree)}
                    y={mobileCenter + labelRadius * Math.sin(degree)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    fontWeight="700"
                    fill={season.color}
                  >
                    {season.name}
                  </text>
                );
              })}
            </svg>
            <div className="absolute left-1/2 top-1/2 z-0 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-indigo-200 bg-white/90 text-center shadow-sm">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-indigo-600">地支循環</span>
              <span className="mt-0.5 text-xs text-slate-500">子 → 亥</span>
            </div>
            {mockEarthlyBranches.map((branch, index) => {
              const style = ELEMENT_STYLES[branch.element] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
              const point = getMobilePoint(index);
              const highlighted = isHighlighted(branch.name_cn);
              const isSelected = mobileSelectedBranch === branch.name_cn;
              return (
                <button
                  key={`mobile-ring-${branch.id}`}
                  type="button"
                  onClick={() => setMobileSelectedBranch(branch.name_cn)}
                  aria-pressed={isSelected}
                  aria-label={`查看${branch.name_cn}的藏干`}
                  className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-lg font-black transition-all ${style.border} ${isSelected ? `${style.bg} ${style.text} scale-110 shadow-md ring-2 ring-white` : highlighted ? `bg-white ${style.text} shadow-sm` : 'border-slate-200 bg-white/80 text-slate-400 opacity-55'}`}
                  style={{ left: `${point.left}%`, top: `${point.top}%`, width: MOBILE_NODE, height: MOBILE_NODE }}
                >
                  {branch.name_cn}
                </button>
              );
            })}
          </div>
          <div className={`mt-3 rounded-xl border ${mobileSelectedStyle.border} ${mobileSelectedStyle.bg} p-3`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 font-serif text-2xl font-black ${mobileSelectedStyle.text}`}>{mobileSelected.name_cn}</span>
                <div><p className={`text-sm font-black ${mobileSelectedStyle.text}`}>{mobileSelected.name_cn}・藏干證據</p><p className="text-xs text-slate-600">{mobileSelected.yin_yang === 'yang' ? '陽' : '陰'}・{mobileSelected.element}</p></div>
              </div>
              {!isHighlighted(mobileSelected.name_cn) && <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-500">延伸定位</span>}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="rounded-lg border border-white/80 bg-white/80 px-1.5 py-2"><p className="text-[10px] text-slate-500">本氣</p><p className={`mt-0.5 text-base font-black ${mobileSelectedStyle.text}`}>{mobileHiddenStems[0]}</p></div>
              <div className="rounded-lg border border-white/80 bg-white/80 px-1.5 py-2"><p className="text-[10px] text-slate-500">中氣</p><p className={`mt-0.5 text-base font-black ${mobileSelectedStyle.text}`}>{mobileHiddenStems[1] ?? '—'}</p></div>
              <div className="rounded-lg border border-white/80 bg-white/80 px-1.5 py-2"><p className="text-[10px] text-slate-500">餘氣</p><p className={`mt-0.5 text-base font-black ${mobileSelectedStyle.text}`}>{mobileHiddenStems[2] ?? '—'}</p></div>
              <div className="rounded-lg border border-white/80 bg-white/80 px-1.5 py-2"><p className="text-[10px] text-slate-500">本步位置</p><p className={`mt-0.5 text-sm font-black ${mobileSelectedStyle.text}`}>{isHighlighted(mobileSelected.name_cn) ? '重點支位' : '循環定位'}</p></div>
            </div>
          </div>
        </section>
      )}
      <div className={compactOnMobile ? 'hidden sm:block' : ''}>
        <div className="overflow-x-auto">
        <div className={showTrinityLegend ? 'flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2' : ''}>
          <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
            {showTrinityLines && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 ${SIZE} ${SIZE}`}>
                {trinityGroups.map((group) => {
                  const points = group.branches
                    .map((name) => getBranchDotPoint(name))
                    .filter((p): p is { x: number; y: number } => p !== null);

                  if (points.length !== 3) return null;

                  const d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} Z`;
                  return (
                    <path
                      key={group.label}
                      d={d}
                      fill="none"
                      stroke={group.color}
                      strokeWidth={2.5}
                      opacity={0.42}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}

                {mockEarthlyBranches.map((branch) => {
                  const p = getBranchDotPoint(branch.name_cn);
                  if (!p) return null;
                  return (
                    <circle
                      key={`trinity-dot-${branch.id}`}
                      cx={p.x}
                      cy={p.y}
                      r={3.5}
                      fill={trinityColorByBranch[branch.name_cn] || '#9ca3af'}
                      opacity={0.85}
                    />
                  );
                })}
              </svg>
            )}

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {showSeasons && seasonArcs.map((season) => (
              <path
                key={season.name}
                d={describeArc(SEASON_RING_RADIUS, season.startDeg, season.endDeg)}
                fill="none"
                stroke={season.color}
                strokeWidth={SEASON_RING_STROKE}
                strokeLinecap="round"
                opacity={0.22}
              />
            ))}
            {showSeasons && seasonArcs.map((season) => {
              const labelPoint = polar(SEASON_LABEL_RADIUS, season.labelDeg);
              return (
                <text
                  key={`${season.name}-label`}
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="15"
                  fontWeight="700"
                  fill={season.color}
                  style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 1.5 }}
                >
                  {season.name}
                </text>
              );
            })}
            </svg>

            {/* Clock centre */}
            {showStems ? null : (
              <div
                className="absolute rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center z-10"
                style={{ width: 52, height: 52, left: cx - 26, top: cy - 26 }}
              >
                <span className="text-[10px] text-gray-400 text-center leading-tight">時辰<br/>環</span>
              </div>
            )}

            {mockEarthlyBranches.map((branch, idx) => {
              const angleRad = ((idx * 30 - 90) * Math.PI) / 180;
              const x = Math.round(cx + RADIUS * Math.cos(angleRad) - CARD / 2);
              const y = Math.round(cy + RADIUS * Math.sin(angleRad) - CARD / 2);
              const style = ELEMENT_STYLES[branch.element] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
              const highlighted = isHighlighted(branch.name_cn);
              const opacity = highlighted ? 1 : 0.2;

              return (
                <div
                  key={branch.id}
                  className={`absolute z-10 rounded-2xl border ${style.border} ${style.bg} px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 shadow-sm transition-opacity`}
                  style={{ left: x, top: y, width: CARD, height: CARD, opacity }}
                >
                  <div className="flex items-end gap-1 leading-none">
                    <span className={`text-[30px] font-bold ${style.text}`}>{branch.name_cn}</span>
                    <span className="text-sm font-medium text-gray-700">{branch.zodiac_animal}</span>
                  </div>
                  <span className={`text-[11px] leading-none ${style.text} sm:hidden`}>
                    {branch.yin_yang === 'yang' ? '陽' : '陰'}{branch.element}
                  </span>
                  <div className="hidden sm:flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/80 border ${style.border} ${style.text}`}>
                      {branch.yin_yang === 'yang' ? '陽' : '陰'}{branch.element}
                    </span>
                    <span className="text-[10px] text-gray-600 font-medium px-1.5 py-0.5 rounded-full bg-white/80 border border-gray-200">
                      {showStems ? getStemForBranch(branch.branch_number) : fmtTime(branch.hour_range)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {showTrinityLegend && (
            <div className="flex flex-wrap sm:flex-col items-center sm:items-start justify-center gap-2 text-xs sm:text-sm font-semibold">
              {trinityGroups.map((group) => (
                <span key={`${group.label}-legend`} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                  {group.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {showSeasons && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
            {seasonArcs.map((season) => (
              <div key={`${season.name}-legend`} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center">
                <p className="font-bold" style={{ color: season.color }}>{season.name}季({season.elementNote})</p>
                <p className="text-gray-700">{season.branches}</p>
              </div>
            ))}
          </div>
        )}

        </div>
      </div>
    </div>
  );
};
