/**
 * Style: 「五行研習桌」的時間卷宗工作台；羊皮紙欄位、深靛藍時間軸、金色步驟提示。
 * Privacy: this component uses anonymous, fixed teaching cases only and never accepts personal birth data.
 */
import React, { useMemo, useState } from 'react';
import {
  addDayunInterval,
  buildDayunPeriods,
  convertJieGapToInterval,
  formatDayunInterval,
  formatLocalDateTime,
  getDayunDirection,
  isYangYearStem,
  type HeavenlyStem,
  type Pillar,
  type TeachingGender,
} from '../../lib/dayun';

type TeachingCase = {
  id: string;
  label: string;
  yearStem: HeavenlyStem;
  gender: TeachingGender;
  monthPillar: Pillar;
  birthAt: Date;
  jieLabel: string;
  defaultDays: number;
  defaultShichen: number;
};

const TEACHING_CASES: TeachingCase[] = [
  {
    id: 'yang-male',
    label: '甲年男命｜順排示例',
    yearStem: '甲',
    gender: 'male',
    monthPillar: { stem: '丙', branch: '寅' },
    birthAt: new Date(2000, 0, 12, 9, 30),
    jieLabel: '下一個節（課堂示例）',
    defaultDays: 14,
    defaultShichen: 0,
  },
  {
    id: 'yin-female',
    label: '乙年女命｜順排示例',
    yearStem: '乙',
    gender: 'female',
    monthPillar: { stem: '庚', branch: '子' },
    birthAt: new Date(2000, 0, 12, 9, 30),
    jieLabel: '下一個節（課堂示例）',
    defaultDays: 14,
    defaultShichen: 0,
  },
  {
    id: 'yin-male',
    label: '乙年男命｜逆排示例',
    yearStem: '乙',
    gender: 'male',
    monthPillar: { stem: '庚', branch: '子' },
    birthAt: new Date(2000, 0, 12, 9, 30),
    jieLabel: '上一個節（課堂示例）',
    defaultDays: 9,
    defaultShichen: 0,
  },
];

const genderLabel: Record<TeachingGender, string> = { male: '男命', female: '女命' };

const DayunWorkbench: React.FC = () => {
  const [activeCaseId, setActiveCaseId] = useState(TEACHING_CASES[0].id);
  const activeCase = TEACHING_CASES.find((teachingCase) => teachingCase.id === activeCaseId) ?? TEACHING_CASES[0];
  const [days, setDays] = useState(activeCase.defaultDays);
  const [shichen, setShichen] = useState(activeCase.defaultShichen);

  const direction = useMemo(() => getDayunDirection(activeCase.yearStem, activeCase.gender), [activeCase]);
  const interval = useMemo(() => convertJieGapToInterval({ wholeDays: days, shichen }), [days, shichen]);
  const firstStartAt = useMemo(() => addDayunInterval(activeCase.birthAt, interval), [activeCase.birthAt, interval]);
  const periods = useMemo(
    () => buildDayunPeriods(activeCase.monthPillar, direction, firstStartAt),
    [activeCase.monthPillar, direction, firstStartAt]
  );

  const selectCase = (nextCase: TeachingCase) => {
    setActiveCaseId(nextCase.id);
    setDays(nextCase.defaultDays);
    setShichen(nextCase.defaultShichen);
  };

  const directionLabel = direction === 'forward' ? '順排' : '逆排';
  const polarityLabel = isYangYearStem(activeCase.yearStem) ? '陽年干' : '陰年干';

  return (
    <section className="dayun-workbench" aria-labelledby="dayun-workbench-title">
      <header className="dayun-workbench__header">
        <div>
          <p className="dayun-workbench__eyebrow">DA YUN WORKBENCH</p>
          <h3 id="dayun-workbench-title">排運研習桌</h3>
          <p>以匿名教學命例練習：先判順逆、再換算間隔，最後找到第一柱的實際起運時間。</p>
        </div>
        <span className="dayun-workbench__privacy">不收集出生資料</span>
      </header>

      <div className="dayun-case-picker" role="group" aria-label="選擇匿名教學命例">
        {TEACHING_CASES.map((teachingCase) => (
          <button
            key={teachingCase.id}
            type="button"
            className={teachingCase.id === activeCase.id ? 'dayun-case-picker__button is-active' : 'dayun-case-picker__button'}
            aria-pressed={teachingCase.id === activeCase.id}
            onClick={() => selectCase(teachingCase)}
          >
            {teachingCase.label}
          </button>
        ))}
      </div>

      <div className="dayun-workbench__grid">
        <article className="dayun-note-card">
          <p className="dayun-note-card__label">01｜判順逆</p>
          <div className="dayun-note-card__facts">
            <span>年干：<strong>{activeCase.yearStem}</strong>（{polarityLabel}）</span>
            <span>命例：<strong>{genderLabel[activeCase.gender]}</strong></span>
          </div>
          <p className="dayun-note-card__result">結果：<strong>{directionLabel}</strong></p>
          <small>陽男陰女順排；陰男陽女逆排。</small>
        </article>

        <article className="dayun-note-card">
          <p className="dayun-note-card__label">02｜月柱步進</p>
          <div className="dayun-pillar-pair">
            <span><small>月柱</small><strong>{activeCase.monthPillar.stem}{activeCase.monthPillar.branch}</strong></span>
            <i aria-hidden="true">{direction === 'forward' ? '→' : '←'}</i>
            <span><small>第一柱</small><strong>{periods[0].pillar.stem}{periods[0].pillar.branch}</strong></span>
          </div>
          <small>月柱只作起點；第一柱由干支同步移動一位得出。</small>
        </article>
      </div>

      <section className="dayun-interval-card" aria-labelledby="dayun-interval-title">
        <div className="dayun-interval-card__intro">
          <p className="dayun-note-card__label">03｜換算起運間隔</p>
          <h4 id="dayun-interval-title">由出生時刻至{activeCase.jieLabel}的距離</h4>
          <p>本課採三日作一年、一日作四個月、一個時辰作十日。你可調整日差，觀察起運日期如何改變。</p>
        </div>
        <label className="dayun-range-control">
          <span>日差：<strong>{days} 日</strong></span>
          <input type="range" min="0" max="30" value={days} onChange={(event) => setDays(Number(event.target.value))} />
        </label>
        <label className="dayun-range-control">
          <span>時辰：<strong>{shichen} 個</strong></span>
          <input type="range" min="0" max="11" value={shichen} onChange={(event) => setShichen(Number(event.target.value))} />
        </label>
        <div className="dayun-interval-card__result">
          <span>起運間隔</span>
          <strong>{formatDayunInterval(interval)}</strong>
          <small>出生時間 {formatLocalDateTime(activeCase.birthAt)} + 間隔</small>
          <strong className="dayun-interval-card__date">第一柱起運：{formatLocalDateTime(firstStartAt)}</strong>
        </div>
      </section>

      <section className="dayun-timeline" aria-labelledby="dayun-timeline-title">
        <div className="dayun-timeline__heading">
          <div>
            <p className="dayun-note-card__label">04｜十年大運時間軸</p>
            <h4 id="dayun-timeline-title">由第一柱實際起運點起，每十年一柱</h4>
          </div>
          <span>首六柱</span>
        </div>
        <div className="dayun-timeline__scroll">
          <ol>
            {periods.map((period) => (
              <li key={`${period.order}-${period.pillar.stem}${period.pillar.branch}`}>
                <span className="dayun-timeline__order">第 {period.order} 柱</span>
                <strong>{period.pillar.stem}{period.pillar.branch}</strong>
                <time>起運：{formatLocalDateTime(period.startAt)}</time>
                <small>交下一柱：{formatLocalDateTime(period.endAt)}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="dayun-method-note">
        <strong>本課口徑</strong>
        <span>陽男陰女順排；陰男陽女逆排；以「節」計起運；三日一歲。不同師承在交節時刻、真太陽時及取整上可能不同。</span>
      </aside>
    </section>
  );
};

export default DayunWorkbench;
