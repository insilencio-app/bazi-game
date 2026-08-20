/**
 * Lesson 8 calculation contract: the app teaches a declared Zi Ping convention only.
 * It turns an anonymous teaching case's birth-to-Jie gap into an interval, then adds
 * that interval back to the birth datetime to obtain the first Luck Pillar start point.
 */

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];
export type DayunDirection = 'forward' | 'backward';
export type TeachingGender = 'male' | 'female';

export type Pillar = {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
};

export type JieGap = {
  wholeDays: number;
  shichen: number;
};

export type DayunInterval = {
  years: number;
  months: number;
  days: number;
};

export type DayunPeriod = {
  order: number;
  pillar: Pillar;
  startAt: Date;
  endAt: Date;
};

const YANG_YEAR_STEMS = new Set<HeavenlyStem>(['甲', '丙', '戊', '庚', '壬']);

export function isYangYearStem(yearStem: HeavenlyStem): boolean {
  return YANG_YEAR_STEMS.has(yearStem);
}

export function getDayunDirection(yearStem: HeavenlyStem, gender: TeachingGender): DayunDirection {
  const isSamePolarity = (isYangYearStem(yearStem) && gender === 'male') || (!isYangYearStem(yearStem) && gender === 'female');
  return isSamePolarity ? 'forward' : 'backward';
}

export function shiftPillar(monthPillar: Pillar, direction: DayunDirection, offset = 1): Pillar {
  const delta = direction === 'forward' ? offset : -offset;
  const stemIndex = (HEAVENLY_STEMS.indexOf(monthPillar.stem) + delta + HEAVENLY_STEMS.length) % HEAVENLY_STEMS.length;
  const branchIndex = (EARTHLY_BRANCHES.indexOf(monthPillar.branch) + delta + EARTHLY_BRANCHES.length) % EARTHLY_BRANCHES.length;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
  };
}

/**
 * Traditional teaching conversion used by Lesson 8: three days are one year,
 * one remaining day is four months, and one shichen is ten days.
 */
export function convertJieGapToInterval(gap: JieGap): DayunInterval {
  if (!Number.isInteger(gap.wholeDays) || gap.wholeDays < 0) {
    throw new Error('wholeDays must be a non-negative integer.');
  }

  if (!Number.isInteger(gap.shichen) || gap.shichen < 0 || gap.shichen > 11) {
    throw new Error('shichen must be an integer from 0 to 11.');
  }

  return {
    years: Math.floor(gap.wholeDays / 3),
    months: (gap.wholeDays % 3) * 4,
    days: gap.shichen * 10,
  };
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Adds calendar years, then months, then days while preserving the local clock time. */
export function addDayunInterval(birthAt: Date, interval: DayunInterval): Date {
  const result = new Date(birthAt.getTime());
  const originalDay = result.getDate();

  result.setDate(1);
  result.setFullYear(result.getFullYear() + interval.years);
  result.setMonth(result.getMonth() + interval.months);
  result.setDate(Math.min(originalDay, daysInMonth(result.getFullYear(), result.getMonth())));
  result.setDate(result.getDate() + interval.days);

  return result;
}

export function addCalendarYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  const originalDay = result.getDate();
  result.setDate(1);
  result.setFullYear(result.getFullYear() + years);
  result.setDate(Math.min(originalDay, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

export function buildDayunPeriods(monthPillar: Pillar, direction: DayunDirection, firstStartAt: Date, count = 6): DayunPeriod[] {
  return Array.from({ length: count }, (_, index) => {
    const startAt = addCalendarYears(firstStartAt, index * 10);
    return {
      order: index + 1,
      pillar: shiftPillar(monthPillar, direction, index + 1),
      startAt,
      endAt: addCalendarYears(firstStartAt, (index + 1) * 10),
    };
  });
}

export function formatDayunInterval(interval: DayunInterval): string {
  const parts = [`${interval.years} 年`, `${interval.months} 個月`];
  if (interval.days > 0) parts.push(`${interval.days} 日`);
  return parts.join(' ');
}

export function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
