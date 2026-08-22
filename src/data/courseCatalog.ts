/**
 * Course catalog contract: the single display source for the 「八字圖譜」 learning path.
 * Keep stable lesson IDs for XP and completion compatibility; only presentation metadata lives here.
 */

export type CourseDisplay = {
  title: string;
  subtitle: string;
  kind: 'guide' | 'lesson' | 'practice' | 'supplement';
};

export type CourseSegment = {
  id: 'foundation' | 'core' | 'advanced';
  order: string;
  title: string;
  subtitle: string;
  lessonIds: number[];
};

export const COURSE_DISPLAY_BY_ID: Record<number, CourseDisplay> = {
  0: { title: '導讀：四柱與日主', subtitle: '先建立判讀地圖與日主中心', kind: 'guide' },
  1: { title: '第1課：五行基礎', subtitle: '生剋、方向、季節與象意', kind: 'lesson' },
  2: { title: '第2課：十天干', subtitle: '陰陽、五行與天干角色', kind: 'lesson' },
  3: { title: '第3課：十二地支', subtitle: '地支、生肖與時辰', kind: 'lesson' },
  4: { title: '第4課：節氣與月令', subtitle: '八字月份與月令邊界', kind: 'lesson' },
  5: { title: '第5課：十神判讀', subtitle: '五行關係、正偏與十神流程', kind: 'lesson' },
  55: { title: '第5課練習：十神速查', subtitle: '以雙向速查鞏固十神', kind: 'practice' },
  6: { title: '第6課：地支藏干', subtitle: '本氣、中氣、餘氣與透干', kind: 'lesson' },
  65: { title: '第6課練習：藏干十神速查', subtitle: '把藏干轉換為十神', kind: 'practice' },
  7: { title: '第7課：地支關係', subtitle: '三合、六合、刑、沖、破、害', kind: 'lesson' },
  8: { title: '第8課：大運排法', subtitle: '月柱順逆與起運時間', kind: 'lesson' },
  9: { title: '第9課：八字體用與干支氣勢', subtitle: '形、氣、勢與五氣全局', kind: 'lesson' },
  10: { title: '第10課：大運的升降浮沉', subtitle: '原局、運干、運支與氣勢變化', kind: 'lesson' },
  11: { title: '第11課：取用與實踐', subtitle: '整合原局、格局與時間座標', kind: 'lesson' },
};

export const COURSE_CATALOG_SEGMENTS: CourseSegment[] = [
  {
    id: 'foundation',
    order: '01',
    title: '基礎建構',
    subtitle: '導讀至第4課・四柱、五行、干支與月令',
    lessonIds: [0, 1, 2, 3, 4],
  },
  {
    id: 'core',
    order: '02',
    title: '核心推演',
    subtitle: '第5–7課及練習・十神、藏干與地支關係',
    lessonIds: [5, 55, 6, 65, 7],
  },
  {
    id: 'advanced',
    order: '03',
    title: '進階應用',
    subtitle: '第8–11課・排運、氣勢與應用',
    lessonIds: [8, 9, 10, 11],
  },
];

export const getCourseDisplay = (lessonId: number): CourseDisplay | undefined => COURSE_DISPLAY_BY_ID[lessonId];
