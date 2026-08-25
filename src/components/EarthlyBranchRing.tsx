import React from 'react';
/* 五行研習桌設計提醒：完整十二地支環保留給平板與桌面；手機先以本步聚焦支位的摘要卡閱讀，避免固定環圖壓過課堂文字。 */
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

  const getStemForBranch = (branchNumber: number) => branchToStemMap[branchNumber] || '?';
  const isHighlighted = (branchName: string) => highlightedBranches.length === 0 || highlightedBranches.includes(branchName);
  const mobileBranches = highlightedBranches.length > 0
    ? mockEarthlyBranches.filter((branch) => highlightedBranches.includes(branch.name_cn))
    : mockEarthlyBranches;

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

  return (
    <div className={title ? 'rounded-2xl border border-indigo-200 bg-indigo-50 p-3 sm:p-4' : ''}>
      {title && <p className="text-xs sm:text-sm font-semibold text-indigo-800 mb-2">{title}</p>}
      {compactOnMobile && (
        <section className="sm:hidden" aria-label="手機版地支摘要">
          <p className="mb-2 text-xs font-semibold leading-5 text-indigo-700">手機先看本步聚焦支位；完整環圖會在平板與桌面顯示。</p>
          <div className={`grid gap-2 ${mobileBranches.length > 8 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {mobileBranches.map((branch) => {
              const style = ELEMENT_STYLES[branch.element] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
              return (
                <div key={`mobile-${branch.id}`} className={`rounded-xl border ${style.border} ${style.bg} px-2.5 py-2 text-center`}>
                  <span className={`font-serif text-2xl font-black ${style.text}`}>{branch.name_cn}</span>
                  <p className={`mt-0.5 text-xs font-bold ${style.text}`}>本氣・{getStemForBranch(branch.branch_number)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">{branch.yin_yang === 'yang' ? '陽' : '陰'}・{branch.element}</p>
                </div>
              );
            })}
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
