import React, { useState } from 'react';
import { mockElements, mockHeavenlySteams, mockEarthlyBranches, mockTenGods, mockLessons } from '../data/mockData';
import { ElementCard } from '../components/ElementCard';
import { ElementWheel } from '../components/ElementWheel';
import { LessonPage } from './LessonPage';
import { selectByNovelty } from '../utils/quizSelection';

type GameMode = 'menu' | 'elements' | 'lessons' | 'stems' | 'branches' | 'gods' | 'total-quiz';
type BadgeId =
  | 'first-step'
  | 'lesson-master'
  | 'quiz-starter'
  | 'ten-correct'
  | 'twenty-correct'
  | 'fifty-correct'
  | 'seventy-five-correct'
  | 'hundred-correct'
  | 'one-fifty-correct'
  | 'two-hundred-correct'
  | 'two-fifty-correct'
  | 'three-hundred-correct'
  | 'four-hundred-correct'
  | 'five-hundred-correct'
  | 'perfect-lesson'
  | 'total-quiz-80'
  | 'total-quiz-100'
  | 'streak-5'
  | 'streak-10'
  | 'speed-star'
  | 'wood-starter'
  | 'stems-master'
  | 'branches-master'
  | 'season-calc-pro'
  | 'gods-expert'
  | 'hidden-stems-master'
  | 'relations-master'
  | 'daily-3'
  | 'daily-7'
  | 'all-courses-80'
  | 'total-quiz-finisher'
  | 'total-quiz-finisher-5'
  | 'replay-3'
  | 'master-scholar'
  | 'perfect-combo'
  | 'late-bloomer'
  | 'rising-star'
  | 'ancient-sage'
  | 'knowledge-hoarder'
  | 'quiz-warrior';

type UserProgress = {
  totalScore: number;
  totalXp: number;
  correctAnswers: number;
  totalQuizMastered: number;
  totalQuizPerfect: number;
  totalQuizAttempts: number;
  bestStreak: number;
  fastCorrectAnswers: number;
  dailyStreak: number;
  lastPlayedDate: string | null;
  hintsUsed: number;
  lessonPerformance: Record<number, { attempts: number; correct: number }>;
  lessonRecentAnswers: Record<number, boolean[]>;
  lessonRecentWindowSize: Record<number, number>;
  lessonLatestPercent: Record<number, number>;
  totalQuizLatestPercent: number | null;
};

type PersistedProgress = {
  userProgress: UserProgress;
  completedLessonIds: number[];
  perfectLessonIds: number[];
  highScoreLessonIds: number[];
  lessonAttemptCounts: Record<string, number>;
  unlockedBadgeIds: BadgeId[];
};

const LEVEL_XP_BASE = 100;
const CORRECT_ANSWER_XP = 10;
const LESSON_COMPLETE_XP = 30;
const PERFECT_LESSON_BONUS_XP = 20;
const TOTAL_QUIZ_MASTERY_BONUS_XP = 40;
const TOTAL_QUIZ_PERFECT_BONUS_XP = 60;
const HINT_XP_COST = 50;
const PROGRESS_STORAGE_KEY = 'bazi-progression-v1';

const BADGE_DEFINITIONS: Record<BadgeId, { name: string; emoji: string; hintShort: string; hintLong: string }> = {
  'first-step': { name: '初學者', emoji: '👣', hintShort: '1課', hintLong: '完成任意 1 個課程' },
  'lesson-master': { name: '課程達人', emoji: '🎓', hintShort: '7課', hintLong: '完成 7 個課程' },
  'quiz-starter': { name: '測驗新手', emoji: '🧠', hintShort: '答對1', hintLong: '累計答對 1 題' },
  'ten-correct': { name: '十題達成', emoji: '🔟', hintShort: '答對10', hintLong: '累計答對 10 題' },
  'twenty-correct': { name: '二十題高手', emoji: '2️⃣0️⃣', hintShort: '答對20', hintLong: '累計答對 20 題' },
  'fifty-correct': { name: '五十題高手', emoji: '🏆', hintShort: '答對50', hintLong: '累計答對 50 題' },
  'seventy-five-correct': { name: '七十五題達成', emoji: '7️⃣5️⃣', hintShort: '答對75', hintLong: '累計答對 75 題' },
  'hundred-correct': { name: '百題達成', emoji: '💯', hintShort: '答對100', hintLong: '累計答對 100 題' },
  'one-fifty-correct': { name: '150題高手', emoji: '🎯', hintShort: '答對150', hintLong: '累計答對 150 題' },
  'two-hundred-correct': { name: '200題達成', emoji: '📈', hintShort: '答對200', hintLong: '累計答對 200 題' },
  'two-fifty-correct': { name: '250題里程碑', emoji: '🛤️', hintShort: '答對250', hintLong: '累計答對 250 題' },
  'three-hundred-correct': { name: '300題成就', emoji: '🔥', hintShort: '答對300', hintLong: '累計答對 300 題' },
  'four-hundred-correct': { name: '400題大師', emoji: '👑', hintShort: '答對400', hintLong: '累計答對 400 題' },
  'five-hundred-correct': { name: '500題先知', emoji: '🔮', hintShort: '答對500', hintLong: '累計答對 500 題' },
  'perfect-lesson': { name: '完美課程', emoji: '⭐', hintShort: '單課滿分', hintLong: '任一課程拿滿分' },
  'total-quiz-80': { name: '綜合80%', emoji: '🥈', hintShort: '總測80+', hintLong: '總測驗達到 80% 以上' },
  'total-quiz-100': { name: '綜合滿分', emoji: '🥇', hintShort: '總測100', hintLong: '總測驗 100% 滿分' },
  'streak-5': { name: '連勝王', emoji: '🔥', hintShort: '連對5', hintLong: '總測驗連續答對 5 題' },
  'streak-10': { name: '超連勝王', emoji: '🚀', hintShort: '連對10', hintLong: '總測驗連續答對 10 題' },
  'speed-star': { name: '速度之星', emoji: '⚡', hintShort: '30秒×10', hintLong: '30 秒內答對累計 10 題' },
  'wood-starter': { name: '五行新星', emoji: '🌳', hintShort: '完成五行', hintLong: '完成「五行基礎」' },
  'stems-master': { name: '天干達人', emoji: '☰', hintShort: '完成天干', hintLong: '完成「十天干」' },
  'branches-master': { name: '地支達人', emoji: '🐲', hintShort: '完成地支', hintLong: '完成「十二地支」' },
  'season-calc-pro': { name: '節氣高手', emoji: '🌱', hintShort: '完成節氣', hintLong: '完成「節氣與月份計算」' },
  'gods-expert': { name: '十神專家', emoji: '👥', hintShort: '完成十神', hintLong: '完成「十神詳解」' },
  'hidden-stems-master': { name: '藏干達人', emoji: '🌪️', hintShort: '完成藏干', hintLong: '完成「十二地支藏干」' },
  'relations-master': { name: '關係達人', emoji: '⚡', hintShort: '完成關係', hintLong: '完成「地支關係」' },
  'daily-3': { name: '每日簽到3天', emoji: '📅', hintShort: '連玩3天', hintLong: '連續遊玩 3 天' },
  'daily-7': { name: '每日簽到7天', emoji: '🗓️', hintShort: '連玩7天', hintLong: '連續遊玩 7 天' },
  'all-courses-80': { name: '全課通關', emoji: '🎖️', hintShort: '7課80+', hintLong: '7 個課程都達 80%+' },
  'total-quiz-finisher': { name: '總測完成者', emoji: '🏁', hintShort: '總測1次', hintLong: '完成總測驗 1 次' },
  'total-quiz-finisher-5': { name: '測驗不放棄', emoji: '🎯', hintShort: '總測5次', hintLong: '完成總測驗 5 次' },
  'replay-3': { name: '回鍋高手', emoji: '🔁', hintShort: '同課3次', hintLong: '同一課程累計遊玩 3 次' },
  'master-scholar': { name: '博學大師', emoji: '👨‍🎓', hintShort: '7課滿分', hintLong: '7 個課程都達 100%' },
  'perfect-combo': { name: '完美連鎖', emoji: '✨', hintShort: '三課滿分', hintLong: '達成 3 個課程滿分' },
  'late-bloomer': { name: '大器晚成', emoji: '🌸', hintShort: '7課完成', hintLong: '完成全部 7 個課程' },
  'rising-star': { name: '冉冉上升', emoji: '⭐', hintShort: 'Lv.10', hintLong: '達到等級 10' },
  'ancient-sage': { name: '遠古聖賢', emoji: '🏔️', hintShort: 'Lv.20', hintLong: '達到等級 20' },
  'knowledge-hoarder': { name: '知識囤積者', emoji: '💰', hintShort: '500XP', hintLong: '累計獲得 500 XP' },
  'quiz-warrior': { name: '測驗戰士', emoji: '⚔️', hintShort: '總測10次', hintLong: '完成總測驗 10 次' },
};

const defaultProgress: UserProgress = {
  totalScore: 0,
  totalXp: 0,
  correctAnswers: 0,
  totalQuizMastered: 0,
  totalQuizPerfect: 0,
  totalQuizAttempts: 0,
  bestStreak: 0,
  fastCorrectAnswers: 0,
  dailyStreak: 0,
  lastPlayedDate: null,
  hintsUsed: 0,
  lessonPerformance: {},
  lessonRecentAnswers: {},
  lessonRecentWindowSize: {},
  lessonLatestPercent: {},
  totalQuizLatestPercent: null,
};

const getLessonRecentWindowSize = (lessonId: number): number => {
  const lesson = mockLessons.find((item) => item.id === lessonId) as any;
  if (!lesson) return 10;

  const questionBankCount = Math.min(6, Array.isArray(lesson.questionBank) ? lesson.questionBank.length : 0);
  const trueFalseBankCount = Math.min(2, Array.isArray(lesson.trueFalseBank) ? lesson.trueFalseBank.length : 0);
  const matchBankCount = Math.min(2, Array.isArray(lesson.matchBank) ? lesson.matchBank.length : 0);
  const totalQuestionCount = questionBankCount + trueFalseBankCount + matchBankCount;

  return totalQuestionCount > 0 ? totalQuestionCount : 10;
};

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const applyDailyPlay = (progress: UserProgress): UserProgress => {
  const todayKey = getDateKey();
  if (progress.lastPlayedDate === todayKey) return progress;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);
  const nextStreak = progress.lastPlayedDate === yesterdayKey ? progress.dailyStreak + 1 : 1;

  return {
    ...progress,
    dailyStreak: nextStreak,
    lastPlayedDate: todayKey,
  };
};

const loadPersistedProgress = (): PersistedProgress => {
  if (typeof window === 'undefined') {
    return {
      userProgress: defaultProgress,
      completedLessonIds: [],
      perfectLessonIds: [],
      highScoreLessonIds: [],
      lessonAttemptCounts: {},
      unlockedBadgeIds: [],
    };
  }

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return {
        userProgress: defaultProgress,
        completedLessonIds: [],
        perfectLessonIds: [],
        highScoreLessonIds: [],
        lessonAttemptCounts: {},
        unlockedBadgeIds: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedProgress>;
    const mergedProgress: UserProgress = {
      ...defaultProgress,
      ...(parsed.userProgress ?? {}),
    };

    const migratedWindowSize: Record<number, number> = {
      ...(mergedProgress.lessonRecentWindowSize ?? {}),
    };

    const lessonIdsWithProgress = new Set<number>([
      ...Object.keys(mergedProgress.lessonPerformance ?? {}).map((key) => Number(key)),
      ...Object.keys(mergedProgress.lessonRecentAnswers ?? {}).map((key) => Number(key)),
      ...Object.keys(mergedProgress.lessonLatestPercent ?? {}).map((key) => Number(key)),
    ]);

    lessonIdsWithProgress.forEach((lessonId) => {
      if (!Number.isFinite(lessonId) || lessonId <= 0) return;
      migratedWindowSize[lessonId] = getLessonRecentWindowSize(lessonId);
    });

    return {
      userProgress: {
        ...mergedProgress,
        lessonRecentWindowSize: migratedWindowSize,
      },
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      perfectLessonIds: Array.isArray(parsed.perfectLessonIds) ? parsed.perfectLessonIds : [],
      highScoreLessonIds: Array.isArray(parsed.highScoreLessonIds) ? parsed.highScoreLessonIds : [],
      lessonAttemptCounts:
        parsed.lessonAttemptCounts && typeof parsed.lessonAttemptCounts === 'object' ? parsed.lessonAttemptCounts : {},
      unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds)
        ? (parsed.unlockedBadgeIds.filter((id): id is BadgeId => id in BADGE_DEFINITIONS))
        : [],
    };
  } catch {
    return {
      userProgress: defaultProgress,
      completedLessonIds: [],
      perfectLessonIds: [],
      highScoreLessonIds: [],
      lessonAttemptCounts: {},
      unlockedBadgeIds: [],
    };
  }
};

const getLevelTitle = (level: number): string => {
  if (level >= 30) return '陰陽宗師';
  if (level >= 25) return '天命者';
  if (level >= 21) return '八字聖人';
  if (level === 20) return '大師';
  if (level === 19) return '智者';
  if (level === 18) return '玄門高手';
  if (level === 17) return '命理宗師';
  if (level === 16) return '宗師';
  if (level === 15) return '博學士';
  if (level === 14) return '專家';
  if (level === 13) return '命理師';
  if (level === 12) return '玄學士';
  if (level === 11) return '術士';
  if (level === 10) return '精進者';
  if (level === 9) return '悟道士';
  if (level === 8) return '通者';
  if (level === 7) return '勤修士';
  if (level === 6) return '實踐者';
  if (level === 5) return '明理生';
  if (level === 4) return '求道者';
  if (level === 3) return '習者';
  if (level === 2) return '入門生';
  return '啟蒙者';
};

const calculateLevelProgress = (totalXp: number) => {
  let level = 1;
  let xpIntoCurrentLevel = totalXp;
  let xpToNextLevel = LEVEL_XP_BASE * level;

  while (xpIntoCurrentLevel >= xpToNextLevel) {
    xpIntoCurrentLevel -= xpToNextLevel;
    level += 1;
    xpToNextLevel = LEVEL_XP_BASE * level;
  }

  const progressPercent = xpToNextLevel > 0 ? (xpIntoCurrentLevel / xpToNextLevel) * 100 : 0;

  return {
    level,
    xpIntoCurrentLevel,
    xpToNextLevel,
    progressPercent,
  };
};

const getAchievedBadges = (
  progress: UserProgress,
  completedLessonIds: Set<number>,
  perfectLessonIds: Set<number>,
  highScoreLessonIds: Set<number>,
  lessonAttemptCounts: Record<number, number>
): BadgeId[] => {
  const achieved: BadgeId[] = [];

  if (completedLessonIds.size >= 1) achieved.push('first-step');
  if (completedLessonIds.size >= 7) achieved.push('lesson-master');
  if (progress.correctAnswers >= 1) achieved.push('quiz-starter');
  if (progress.correctAnswers >= 10) achieved.push('ten-correct');
  if (progress.correctAnswers >= 20) achieved.push('twenty-correct');
  if (progress.correctAnswers >= 50) achieved.push('fifty-correct');
  if (progress.correctAnswers >= 75) achieved.push('seventy-five-correct');
  if (progress.correctAnswers >= 100) achieved.push('hundred-correct');
  if (progress.correctAnswers >= 150) achieved.push('one-fifty-correct');
  if (progress.correctAnswers >= 200) achieved.push('two-hundred-correct');
  if (progress.correctAnswers >= 250) achieved.push('two-fifty-correct');
  if (progress.correctAnswers >= 300) achieved.push('three-hundred-correct');
  if (progress.correctAnswers >= 400) achieved.push('four-hundred-correct');
  if (progress.correctAnswers >= 500) achieved.push('five-hundred-correct');
  if (perfectLessonIds.size >= 1) achieved.push('perfect-lesson');
  if (progress.totalQuizMastered >= 1) achieved.push('total-quiz-80');
  if (progress.totalQuizPerfect >= 1) achieved.push('total-quiz-100');
  if (progress.bestStreak >= 5) achieved.push('streak-5');
  if (progress.bestStreak >= 10) achieved.push('streak-10');
  if (progress.fastCorrectAnswers >= 10) achieved.push('speed-star');
  if (completedLessonIds.has(1)) achieved.push('wood-starter');
  if (completedLessonIds.has(2)) achieved.push('stems-master');
  if (completedLessonIds.has(3)) achieved.push('branches-master');
  if (completedLessonIds.has(4)) achieved.push('season-calc-pro');
  if (completedLessonIds.has(5)) achieved.push('gods-expert');
  if (completedLessonIds.has(6)) achieved.push('hidden-stems-master');
  if (completedLessonIds.has(7)) achieved.push('relations-master');
  if (progress.dailyStreak >= 3) achieved.push('daily-3');
  if (progress.dailyStreak >= 7) achieved.push('daily-7');
  if (highScoreLessonIds.size >= 7) achieved.push('all-courses-80');
  if (progress.totalQuizAttempts >= 1) achieved.push('total-quiz-finisher');
  if (progress.totalQuizAttempts >= 5) achieved.push('total-quiz-finisher-5');
  if (Object.values(lessonAttemptCounts).some((count) => count >= 3)) achieved.push('replay-3');

  // New badges for learning milestones
  if (perfectLessonIds.size >= 7) achieved.push('master-scholar');
  if (perfectLessonIds.size >= 3) achieved.push('perfect-combo');
  if (completedLessonIds.size >= 7) achieved.push('late-bloomer');
  
  // Level-based badges
  const levelCalc = calculateLevelProgress(progress.totalXp);
  if (levelCalc.level >= 10) achieved.push('rising-star');
  if (levelCalc.level >= 20) achieved.push('ancient-sage');

  // Engagement badges
  if (progress.totalXp >= 500) achieved.push('knowledge-hoarder');
  if (progress.totalQuizAttempts >= 10) achieved.push('quiz-warrior');

  return achieved;
};

export const HomePage: React.FC = () => {
  const initialProgress = React.useMemo(() => loadPersistedProgress(), []);
  const [currentMode, setCurrentMode] = useState<GameMode>('menu');
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(() => new Set(initialProgress.completedLessonIds));
  const [perfectLessonIds, setPerfectLessonIds] = useState<Set<number>>(() => new Set(initialProgress.perfectLessonIds));
  const [highScoreLessonIds, setHighScoreLessonIds] = useState<Set<number>>(() => new Set(initialProgress.highScoreLessonIds));
  const [lessonAttemptCounts, setLessonAttemptCounts] = useState<Record<number, number>>(() => {
    const entries = Object.entries(initialProgress.lessonAttemptCounts ?? {}).map(([key, value]) => [Number(key), Number(value)]);
    return Object.fromEntries(entries) as Record<number, number>;
  });
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<BadgeId[]>(() => initialProgress.unlockedBadgeIds);
  const [userProgress, setUserProgress] = useState<UserProgress>(() => initialProgress.userProgress);
  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [randomQuestions, setRandomQuestions] = useState<any[]>([]);
  const [isTotalQuizRewardApplied, setIsTotalQuizRewardApplied] = useState(false);
  const [, setCurrentQuizStreak] = useState(0);
  const [maxQuizStreak, setMaxQuizStreak] = useState(0);
  const [fastCorrectInRun, setFastCorrectInRun] = useState(0);
  const [totalQuizAnswerHistory, setTotalQuizAnswerHistory] = useState<boolean[]>([]);
  const [questionStartAt, setQuestionStartAt] = useState<number | null>(null);
  const [isBadgeGalleryOpen, setIsBadgeGalleryOpen] = useState(false);
  const [isProgressChartsOpen, setIsProgressChartsOpen] = useState(false);
  const [levelUpNotice, setLevelUpNotice] = useState<number | null>(null);
  const [pendingBadgeNotices, setPendingBadgeNotices] = useState<BadgeId[]>([]);
  const [activeBadgeNotice, setActiveBadgeNotice] = useState<BadgeId | null>(null);
  const [showTotalQuizHint, setShowTotalQuizHint] = useState(false);

  const levelProgress = calculateLevelProgress(userProgress.totalXp);
  const allBadgeIds = Object.keys(BADGE_DEFINITIONS) as BadgeId[];
  const previousLevelRef = React.useRef(levelProgress.level);
  const previousUnlockedBadgeIdsRef = React.useRef<Set<BadgeId>>(new Set(unlockedBadgeIds));

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload: PersistedProgress = {
      userProgress,
      completedLessonIds: Array.from(completedLessonIds),
      perfectLessonIds: Array.from(perfectLessonIds),
      highScoreLessonIds: Array.from(highScoreLessonIds),
      lessonAttemptCounts: Object.fromEntries(Object.entries(lessonAttemptCounts).map(([key, value]) => [String(key), value])),
      unlockedBadgeIds,
    };

    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload));
  }, [userProgress, completedLessonIds, perfectLessonIds, highScoreLessonIds, lessonAttemptCounts, unlockedBadgeIds]);

  React.useEffect(() => {
    if (levelProgress.level > previousLevelRef.current) {
      setLevelUpNotice(levelProgress.level);
    }
    previousLevelRef.current = levelProgress.level;
  }, [levelProgress.level]);

  React.useEffect(() => {
    if (levelUpNotice === null) return;

    const timer = window.setTimeout(() => {
      setLevelUpNotice(null);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [levelUpNotice]);

  React.useEffect(() => {
    const prevUnlocked = previousUnlockedBadgeIdsRef.current;
    const newlyUnlocked = unlockedBadgeIds.filter((badgeId) => !prevUnlocked.has(badgeId));

    if (newlyUnlocked.length > 0) {
      setPendingBadgeNotices((prev) => [...prev, ...newlyUnlocked]);
    }

    previousUnlockedBadgeIdsRef.current = new Set(unlockedBadgeIds);
  }, [unlockedBadgeIds]);

  React.useEffect(() => {
    if (levelUpNotice !== null || activeBadgeNotice || pendingBadgeNotices.length === 0) return;

    const [nextBadgeId, ...rest] = pendingBadgeNotices;
    setActiveBadgeNotice(nextBadgeId);
    setPendingBadgeNotices(rest);
  }, [pendingBadgeNotices, activeBadgeNotice, levelUpNotice]);

  React.useEffect(() => {
    if (!activeBadgeNotice) return;

    const timer = window.setTimeout(() => {
      setActiveBadgeNotice(null);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [activeBadgeNotice]);

  // Generate random questions when in quiz mode
  React.useEffect(() => {
    if (currentMode === 'total-quiz' && randomQuestions.length === 0) {
      const allQuestions = mockLessons.flatMap((lesson) => 
        ((lesson as any)?.questionBank ?? []).map((q: any) => ({
          ...q,
          lessonId: lesson.id,
          lessonTitle: lesson.title_cn,
        }))
      );

      const selected = selectByNovelty(
        allQuestions,
        20,
        (q) => `lesson-${q.lessonId}-mcq-${q.id}`,
        'bazi-total-quiz-history-v1',
        30
      );

      setRandomQuestions(selected);
    }
  }, [currentMode]);

  // Reset quiz when leaving total-quiz mode
  React.useEffect(() => {
    if (currentMode !== 'total-quiz') {
      setRandomQuestions([]);
      setQuizIndex(0);
      setQuizScore(0);
      setSelectedAnswer(null);
      setAnswered(false);
      setIsQuizFinished(false);
      setIsTotalQuizRewardApplied(false);
      setCurrentQuizStreak(0);
      setMaxQuizStreak(0);
      setFastCorrectInRun(0);
      setTotalQuizAnswerHistory([]);
      setQuestionStartAt(null);
      setShowTotalQuizHint(false);
    }
  }, [currentMode]);

  React.useEffect(() => {
    if (currentMode === 'total-quiz' && randomQuestions.length > 0 && !isQuizFinished) {
      setQuestionStartAt(Date.now());
    }
  }, [currentMode, randomQuestions.length, quizIndex, isQuizFinished]);

  React.useEffect(() => {
    if (currentMode !== 'total-quiz' || !isQuizFinished || isTotalQuizRewardApplied || randomQuestions.length === 0) {
      return;
    }

    const percentage = Math.round((quizScore / randomQuestions.length) * 100);
    const earnedXp =
      quizScore * CORRECT_ANSWER_XP +
      (percentage >= 80 ? TOTAL_QUIZ_MASTERY_BONUS_XP : 0) +
      (percentage === 100 ? TOTAL_QUIZ_PERFECT_BONUS_XP : 0);

    const nextProgress: UserProgress = {
      ...applyDailyPlay(userProgress),
      totalXp: userProgress.totalXp + earnedXp,
      correctAnswers: userProgress.correctAnswers + quizScore,
      totalQuizMastered: userProgress.totalQuizMastered + (percentage >= 80 ? 1 : 0),
      totalQuizPerfect: userProgress.totalQuizPerfect + (percentage === 100 ? 1 : 0),
      totalQuizAttempts: userProgress.totalQuizAttempts + 1,
      bestStreak: Math.max(userProgress.bestStreak, maxQuizStreak),
      fastCorrectAnswers: userProgress.fastCorrectAnswers + fastCorrectInRun,
      totalQuizLatestPercent: percentage,
    };

    const achievedBadges = getAchievedBadges(
      nextProgress,
      completedLessonIds,
      perfectLessonIds,
      highScoreLessonIds,
      lessonAttemptCounts
    );
    const newBadges = achievedBadges.filter((id) => !unlockedBadgeIds.includes(id));

    setUserProgress(nextProgress);
    if (newBadges.length > 0) {
      setUnlockedBadgeIds((prev) => [...prev, ...newBadges]);
    }
    setIsTotalQuizRewardApplied(true);
  }, [
    currentMode,
    isQuizFinished,
    isTotalQuizRewardApplied,
    randomQuestions.length,
    quizScore,
    userProgress,
    maxQuizStreak,
    fastCorrectInRun,
    completedLessonIds,
    perfectLessonIds,
    highScoreLessonIds,
    lessonAttemptCounts,
    unlockedBadgeIds,
  ]);

  const handleElementClick = (element: string) => {
    const el = mockElements.find((e) => e.name_cn === element);
    setSelectedElement(el);
  };

  const handleLessonStart = (lessonId: number) => {
    setSelectedLesson(lessonId);
    setCurrentMode('lessons');
  };

  const handleLessonComplete = (lessonId: number, score: number, totalQuestions: number) => {
    const isNewCompletion = !completedLessonIds.has(lessonId);

    const nextCompletedLessonIds = new Set(completedLessonIds);
    if (isNewCompletion) {
      nextCompletedLessonIds.add(lessonId);
    }

    const isPerfectLesson = totalQuestions > 0 && score === totalQuestions;
    const nextPerfectLessonIds = new Set(perfectLessonIds);
    if (isPerfectLesson) {
      nextPerfectLessonIds.add(lessonId);
    }

    const lessonPercent = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const nextHighScoreLessonIds = new Set(highScoreLessonIds);
    if (lessonId <= 7 && lessonPercent >= 80) {
      nextHighScoreLessonIds.add(lessonId);
    }

    const nextLessonAttemptCounts: Record<number, number> = {
      ...lessonAttemptCounts,
      [lessonId]: (lessonAttemptCounts[lessonId] ?? 0) + 1,
    };

    const earnedXp =
      score * CORRECT_ANSWER_XP +
      (isNewCompletion ? LESSON_COMPLETE_XP : 0) +
      (isPerfectLesson && isNewCompletion ? PERFECT_LESSON_BONUS_XP : 0);

    const nextProgress: UserProgress = {
      ...applyDailyPlay(userProgress),
      totalScore: userProgress.totalScore + (isNewCompletion ? score : 0),
      totalXp: userProgress.totalXp + earnedXp,
      correctAnswers: userProgress.correctAnswers + score,
      lessonRecentWindowSize: {
        ...userProgress.lessonRecentWindowSize,
        [lessonId]: Math.max(1, totalQuestions),
      },
      lessonLatestPercent: {
        ...userProgress.lessonLatestPercent,
        [lessonId]: Math.round(lessonPercent),
      },
    };

    const achievedBadges = getAchievedBadges(
      nextProgress,
      nextCompletedLessonIds,
      nextPerfectLessonIds,
      nextHighScoreLessonIds,
      nextLessonAttemptCounts
    );
    const newBadges = achievedBadges.filter((id) => !unlockedBadgeIds.includes(id));

    setCompletedLessonIds(nextCompletedLessonIds);
    setPerfectLessonIds(nextPerfectLessonIds);
    setHighScoreLessonIds(nextHighScoreLessonIds);
    setLessonAttemptCounts(nextLessonAttemptCounts);
    setUserProgress(nextProgress);
    if (newBadges.length > 0) {
      setUnlockedBadgeIds((prev) => [...prev, ...newBadges]);
    }

    setCurrentMode('menu');
  };

  const handleUseHint = () => {
    setUserProgress((prev) => ({
      ...prev,
      totalXp: Math.max(0, prev.totalXp - HINT_XP_COST),
      hintsUsed: prev.hintsUsed + 1,
    }));
  };

  const handleQuestionAnswered = (lessonId: number, correct: boolean) => {
    setUserProgress((prev) => {
      const lessonStats = prev.lessonPerformance[lessonId] ?? { attempts: 0, correct: 0 };
      const recentWindowSize = Math.max(1, prev.lessonRecentWindowSize[lessonId] ?? 10);
      const recentAnswers = prev.lessonRecentAnswers[lessonId] ?? [];
      const nextRecentAnswers = [...recentAnswers, correct].slice(-recentWindowSize);

      return {
        ...prev,
        lessonPerformance: {
          ...prev.lessonPerformance,
          [lessonId]: {
            attempts: lessonStats.attempts + 1,
            correct: lessonStats.correct + (correct ? 1 : 0),
          },
        },
        lessonRecentAnswers: {
          ...prev.lessonRecentAnswers,
          [lessonId]: nextRecentAnswers,
        },
      };
    });
  };

  const pathSteps = [
    {
      id: 1,
      title: '五行基礎',
      subtitle: '木火土金水入門',
      emoji: '🌳',
      accent: 'from-green-500 to-emerald-400',
      chip: '初級',
      onClick: () => handleLessonStart(1),
    },
    {
      id: 2,
      title: '十天干',
      subtitle: '陰陽五行與天干',
      emoji: '☰',
      accent: 'from-blue-500 to-sky-400',
      chip: '初級',
      onClick: () => handleLessonStart(2),
    },
    {
      id: 3,
      title: '十二地支',
      subtitle: '地支、生肖與時辰',
      emoji: '🐲',
      accent: 'from-teal-500 to-cyan-400',
      chip: '初級',
      onClick: () => handleLessonStart(3),
    },
    {
      id: 4,
      title: '節氣與月份計算',
      subtitle: '太陽曆節氣與八字月份劃分',
      emoji: '🌱',
      accent: 'from-lime-500 to-green-400',
      chip: '初級',
      onClick: () => handleLessonStart(4),
    },
    {
      id: 5,
      title: '十神詳解',
      subtitle: '官殺財印食傷比劫',
      emoji: '👥',
      accent: 'from-rose-500 to-pink-400',
      chip: '中級',
      onClick: () => handleLessonStart(5),
    },
    {
      id: 6,
      title: '十二地支藏干',
      subtitle: '地支內的隱藏天干',
      emoji: '🌪️',
      accent: 'from-purple-500 to-indigo-400',
      chip: '中級',
      onClick: () => handleLessonStart(6),
    },
    {
      id: 7,
      title: '地支關係',
      subtitle: '三合六合刑沖破害',
      emoji: '⚡',
      accent: 'from-orange-500 to-red-400',
      chip: '高級',
      onClick: () => handleLessonStart(7),
    },
    {
      id: 8,
      title: '總測驗',
      subtitle: '所有課程的綜合測驗',
      emoji: '🎯',
      accent: 'from-amber-500 to-yellow-400',
      chip: '綜合',
      onClick: () => setCurrentMode('total-quiz'),
    },
  ];

  const rewardOverlay = (
    (levelUpNotice !== null || activeBadgeNotice) ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
        {levelUpNotice !== null && (
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-2xl px-6 py-8 text-center animate-in zoom-in-95 duration-300 pointer-events-auto">
            <p className="text-sm opacity-90">等級提升</p>
            <p className="text-4xl mt-2">🎉</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-2">升到 Lv.{levelUpNotice}</p>
            <p className="text-xl sm:text-2xl font-bold mt-2 opacity-95">{getLevelTitle(levelUpNotice)}</p>
            <button
              onClick={() => setLevelUpNotice(null)}
              className="mt-6 w-full rounded-xl bg-white/20 hover:bg-white/30 transition-colors py-2 font-semibold"
            >
              繼續
            </button>
          </div>
        )}

        {levelUpNotice === null && activeBadgeNotice && (
          <div className="w-full max-w-md rounded-3xl bg-white border border-amber-200 shadow-2xl px-6 py-8 text-center animate-pulse pointer-events-auto">
            <p className="text-sm text-amber-700 font-semibold">新徽章解鎖</p>
            <p className="text-5xl mt-3">{BADGE_DEFINITIONS[activeBadgeNotice].emoji}</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 mt-2">{BADGE_DEFINITIONS[activeBadgeNotice].name}</p>
            <p className="text-sm sm:text-base text-gray-500 mt-2">{BADGE_DEFINITIONS[activeBadgeNotice].hintLong}</p>
            <button
              onClick={() => setActiveBadgeNotice(null)}
              className="mt-6 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors py-2 font-semibold"
            >
              繼續
            </button>
          </div>
        )}
      </div>
    ) : null
  );

  // Main Menu
  if (currentMode === 'menu') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-8 shadow-lg">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-2">輕鬆學八字</h1>
            <p className="text-sm sm:text-lg lg:text-2xl opacity-90">Learn BaZi in an Interactive Way</p>
          </header>

          {/* User Stats */}
          <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
                <div className="flex items-baseline justify-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">Lv.{levelProgress.level}</span>
                  <span className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{getLevelTitle(levelProgress.level)}</span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">等級</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm sm:text-base text-gray-600">經驗值</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {levelProgress.xpIntoCurrentLevel}/{levelProgress.xpToNextLevel}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, levelProgress.progressPercent)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Badge Gallery & Progress Charts - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {/* Badge Gallery */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <button
                  onClick={() => setIsBadgeGalleryOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left mb-3"
                >
                  <div>
                    <p className="text-base sm:text-lg font-bold text-gray-800">徽章圖鑑</p>
                    <p className="text-xs sm:text-sm text-gray-500">{unlockedBadgeIds.length}/{allBadgeIds.length} 已解鎖</p>
                  </div>
                  <span className="text-sm sm:text-base text-blue-600 font-medium">
                    {isBadgeGalleryOpen ? '收起 ▲' : '查看全部 ▼'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {(isBadgeGalleryOpen ? allBadgeIds : allBadgeIds.slice(0, 6)).map((badgeId) => {
                    const badge = BADGE_DEFINITIONS[badgeId];
                    const unlocked = unlockedBadgeIds.includes(badgeId);

                    return (
                      <div
                        key={badgeId}
                        className={`rounded-lg border p-2 text-center transition-all ${
                          unlocked
                            ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
                            : 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-left">
                          <p className={`text-3xl shrink-0 ${unlocked ? '' : 'grayscale opacity-40'}`}>{badge.emoji}</p>
                          <div>
                            <p className={`text-sm sm:text-base leading-tight ${unlocked ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                              {badge.name}
                            </p>
                            <p className={`text-xs sm:text-sm leading-tight mt-0.5 ${unlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                              <span className="sm:hidden">{badge.hintShort}</span>
                              <span className="hidden sm:inline">{badge.hintLong}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Charts */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <button
                  onClick={() => setIsProgressChartsOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left mb-3"
                >
                  <div>
                    <p className="text-base sm:text-lg font-bold text-gray-800">學習進度統計</p>
                    <p className="text-xs sm:text-sm text-gray-500">累計表現與最近一次成績</p>
                  </div>
                  <span className="text-sm sm:text-base text-blue-600 font-medium">
                    {isProgressChartsOpen ? '收起 ▲' : '查看全部 ▼'}
                  </span>
                </button>

                <div className="space-y-2">
                {mockLessons.slice(0, isProgressChartsOpen ? 7 : 3).map((lesson) => {
                  const stats = userProgress.lessonPerformance[lesson.id];
                  const attempts = stats?.attempts ?? 0;
                  const correct = stats?.correct ?? 0;
                  const cumulativePercent = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
                  const recentWindowSize = Math.max(1, userProgress.lessonRecentWindowSize[lesson.id] ?? 10);
                  const latestPercent = userProgress.lessonLatestPercent[lesson.id];
                  const recentAnswerSource = (userProgress.lessonRecentAnswers[lesson.id] ?? []).filter(
                    (value): value is boolean => typeof value === 'boolean'
                  );
                  const recentAnswers = recentAnswerSource.slice(-recentWindowSize);
                  const recentAttempts = recentAnswers.length;
                  const recentCorrect = recentAnswers.filter(Boolean).length;
                  const displayPercent = typeof latestPercent === 'number' ? latestPercent : 0;
                  const displayBarPercent = Math.min(100, Math.max(0, displayPercent));
                  const hasDisplayPercent = typeof latestPercent === 'number';
                  
                  return (
                    <div key={lesson.id} className="border-b border-gray-100 pb-2 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">{lesson.title_cn}</p>
                          <p className="text-xs text-gray-500">
                            {attempts > 0 ? `累計 ${correct}/${attempts} • ${cumulativePercent}%` : '尚未開始'}
                          </p>
                          {typeof latestPercent === 'number' && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">最近一次：{latestPercent}%</p>
                          )}
                          {typeof latestPercent !== 'number' && recentAttempts > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">最近{recentWindowSize}題：{recentCorrect}/{recentAttempts}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">最新進度</p>
                          <div className={`text-xl sm:text-2xl font-bold ${
                          displayPercent >= 80 ? 'text-green-600' : displayPercent >= 60 ? 'text-yellow-600' : 'text-gray-400'
                          }`}>
                            {hasDisplayPercent ? `${displayPercent}%` : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            displayPercent >= 80 ? 'bg-green-600' : displayPercent >= 60 ? 'bg-yellow-600' : 'bg-blue-400'
                          }`}
                          style={{ width: `${displayBarPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                </div>

                {/* Total Quiz Summary */}
                {userProgress.totalQuizAttempts > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200 mb-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">總測驗</p>
                          <p className="text-xs text-gray-500">
                            {userProgress.totalQuizAttempts > 0
                              ? `累計 ${userProgress.totalQuizMastered + userProgress.totalQuizPerfect}/${userProgress.totalQuizAttempts} • ${Math.round(((userProgress.totalQuizMastered + userProgress.totalQuizPerfect) / userProgress.totalQuizAttempts) * 100)}%`
                              : '尚未開始'}
                          </p>
                          {typeof userProgress.totalQuizLatestPercent === 'number' && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">最近一次：{userProgress.totalQuizLatestPercent}%</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">最新進度</p>
                          <div className={`text-xl sm:text-2xl font-bold ${
                            typeof userProgress.totalQuizLatestPercent === 'number'
                              ? userProgress.totalQuizLatestPercent >= 80 ? 'text-green-600' : userProgress.totalQuizLatestPercent >= 60 ? 'text-yellow-600' : 'text-blue-600'
                              : 'text-gray-400'
                          }`}>
                            {typeof userProgress.totalQuizLatestPercent === 'number' ? `${userProgress.totalQuizLatestPercent}%` : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            typeof userProgress.totalQuizLatestPercent === 'number'
                              ? userProgress.totalQuizLatestPercent >= 80 ? 'bg-green-600' : userProgress.totalQuizLatestPercent >= 60 ? 'bg-yellow-600' : 'bg-blue-400'
                              : 'bg-gray-200'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, userProgress.totalQuizLatestPercent ?? 0))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Overall Stats */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{userProgress.correctAnswers}</p>
                      <p className="text-xs text-gray-600">累計答對</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">{userProgress.hintsUsed}</p>
                      <p className="text-xs text-gray-600">使用提示</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">{userProgress.bestStreak}</p>
                      <p className="text-xs text-gray-600">最佳連勝</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{levelProgress.level}</p>
                      <p className="text-xs text-gray-600">當前等級</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Path */}
            <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-8 mb-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 blur-2xl"></div>
              <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 blur-2xl"></div>

              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">學習路徑</h2>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">跟著路徑完成每個課程步驟</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-base text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>從這裡開始</span>
                  </div>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-2 rounded-full bg-gradient-to-b from-blue-200 via-indigo-200 to-emerald-200"></div>

                  <div className="space-y-10">
                    {pathSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} md:pr-8`}
                      >
                        <div className="absolute -left-1.5 top-4 h-6 w-6 rounded-full bg-white border-4 border-blue-400"></div>
                        <button
                          onClick={step.onClick}
                          className={`w-full md:w-[70%] text-left p-4 sm:p-6 rounded-2xl shadow-lg border border-white/60 bg-gradient-to-br ${step.accent} text-white hover:scale-[1.01] transition-transform`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-2xl sm:text-3xl lg:text-4xl">{step.emoji}</span>
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-white/20">{step.chip}</span>
                          </div>
                          <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mt-3">{step.title}</h3>
                          <p className="text-white/90 mt-1 text-xs sm:text-sm lg:text-base">{step.subtitle}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {rewardOverlay}
      </>
    );
  }

  // Elements View
  if (currentMode === 'elements') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">五行基礎</h1>
              <p className="text-xs sm:text-sm lg:text-base opacity-90 mt-1 sm:mt-2">Five Elements: Wood, Fire, Earth, Metal, Water</p>
            </div>
            <button
              onClick={() => setCurrentMode('menu')}
              className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
            >
              🏠 返回菜單
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
          {/* Element Wheel */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">五行循環圖</h2>
            <ElementWheel onElementClick={handleElementClick} />
          </div>

          {/* Element Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
            {mockElements.map((el) => (
              <ElementCard
                key={el.id}
                name={el.name_en}
                element={el.name_cn}
                color={el.color}
                emoji={el.symbol}
              />
            ))}
          </div>

          {/* Element Detail */}
          {selectedElement && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">
                {selectedElement.symbol} {selectedElement.name_cn} ({selectedElement.name_en})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">方向</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.direction}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">季節</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.season}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">情感</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.emotion}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">顏色</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.color}</p>
                </div>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700">{selectedElement.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lessons View
  if (currentMode === 'lessons') {
    if (selectedLesson) {
      return (
        <LessonPage
          lessonId={selectedLesson}
          onComplete={handleLessonComplete}
          onExit={() => setCurrentMode('menu')}
          userXp={userProgress.totalXp}
          onUseHint={handleUseHint}
          onQuestionAnswered={handleQuestionAnswered}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">課程與測驗</h1>
            <button
              onClick={() => setCurrentMode('menu')}
              className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
            >
              🏠 返回菜單
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid gap-6">
            {mockLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-lg shadow p-3 sm:p-6">
                <h3 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-2">{lesson.title_cn}</h3>
                <p className="text-xs sm:text-sm lg:text-lg text-gray-600 mb-4">{lesson.title_en}</p>
                <button
                  onClick={() => handleLessonStart(lesson.id)}
                  className="bg-blue-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded hover:bg-blue-700 font-semibold text-xs sm:text-base lg:text-lg"
                >
                  開始課程
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Stems View
  if (currentMode === 'stems') {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-3 sm:p-6 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">天干地支</h1>
            <button
              onClick={() => setCurrentMode('menu')}
              className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
            >
              🏠 返回菜單
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          {/* Heavenly Stems */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">十天干 (Heavenly Stems)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {mockHeavenlySteams.map((stem) => (
                <div
                  key={stem.id}
                  className="p-2 sm:p-4 bg-blue-100 rounded text-center cursor-pointer hover:bg-blue-200 transition-colors"
                >
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stem.name_cn}</p>
                  <p className="text-xs sm:text-sm text-gray-700 mt-1">{stem.name_en}</p>
                  <p className="text-xs sm:text-sm font-semibold text-blue-700 mt-1">{stem.element}</p>
                  <p className="text-xs text-gray-700 mt-1">{stem.yin_yang === 'yang' ? '陽' : '陰'}</p>
                  <p className="text-xs text-gray-600 mt-1">特質: {stem.personality_traits.join('、')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Earthly Branches */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">十二地支 (Earthly Branches)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {mockEarthlyBranches.map((branch) => (
                <div
                  key={branch.id}
                  className="p-2 sm:p-4 bg-green-100 rounded text-center cursor-pointer hover:bg-green-200 transition-colors"
                >
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{branch.name_cn}</p>
                  <p className="text-xs sm:text-sm text-gray-700 mt-1">{branch.zodiac_animal}</p>
                  <p className="text-xs sm:text-sm font-semibold text-green-700 mt-1">{branch.element}</p>
                  <p className="text-xs text-gray-700 mt-1">{branch.yin_yang === 'yang' ? '陽' : '陰'}</p>
                  <p className="text-xs text-gray-600 mt-1">時辰: {branch.hour_range}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Total Quiz View
  if (currentMode === 'total-quiz') {
    // Return loading if no questions yet
    if (randomQuestions.length === 0) {
      return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-bold text-gray-800">總測驗</h2>
          <p className="text-gray-600 mt-4">加載測驗中...</p>
        </div>
      );
    }

    const currentQuestion = randomQuestions[quizIndex];
    const progress = randomQuestions.length ? ((quizIndex + 1) / randomQuestions.length) * 100 : 0;
    const latestPercent = Math.round((quizScore / randomQuestions.length) * 100);
    const recentWindowSize = Math.max(1, randomQuestions.length);
    const recentAnswers = totalQuizAnswerHistory.slice(-recentWindowSize);
    const recentAttempts = recentAnswers.length;
    const recentCorrect = recentAnswers.filter(Boolean).length;
    const recentPercent = recentAttempts > 0 ? Math.round((recentCorrect / recentAttempts) * 100) : 0;
    const latestBarPercent = Math.min(100, Math.max(0, latestPercent));
    const currentAttemptedCount = quizIndex + (answered ? 1 : 0);
    const currentCorrectCount = quizScore + (answered && selectedAnswer === currentQuestion.correct ? 1 : 0);
    const currentAccuracy = currentAttemptedCount > 0 ? Math.round((currentCorrectCount / currentAttemptedCount) * 100) : 0;

    if (isQuizFinished) {
      return (
        <>
          <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-5xl font-bold mb-4">綜合測驗完成！</h2>
            <p className="text-xl text-gray-600 mb-6">你已完成綜合測驗。</p>
            <div className="mb-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 font-medium">總測驗進度（本次）</p>
                <p className="text-sm font-semibold text-blue-700">{latestPercent}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${latestBarPercent}%` }}></div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-8 mb-6">
              <p className="text-5xl font-bold text-blue-700 mb-2">{quizScore} / {randomQuestions.length}</p>
              <p className="text-xl text-gray-700">答對題數</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">本次成績：{latestPercent}%</p>
              <p className="text-base text-gray-600 mt-2">
                最近{recentWindowSize}題：{recentCorrect}/{recentAttempts} • {recentPercent}%
              </p>
            </div>
            <button
              onClick={() => setCurrentMode('menu')}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors text-xl"
            >
              返回主頁
            </button>
          </div>
          {rewardOverlay}
        </>
      );
    }

    const handleCheck = () => {
      if (selectedAnswer === null || answered) return;
      setAnswered(true);
      const isCorrect = selectedAnswer === currentQuestion.correct;
      
      if (isCorrect) {
        setQuizScore((prev) => prev + 1);
        setCurrentQuizStreak((prev) => {
          const next = prev + 1;
          setMaxQuizStreak((max) => Math.max(max, next));
          return next;
        });

        if (questionStartAt && Date.now() - questionStartAt <= 30000) {
          setFastCorrectInRun((prev) => prev + 1);
        }
      } else {
        setCurrentQuizStreak(0);
      }

      setTotalQuizAnswerHistory((prev) => [...prev, isCorrect]);
      
      // Track lesson performance
      handleQuestionAnswered(currentQuestion.lessonId, isCorrect);
    };

    const handleNext = () => {
      if (quizIndex < randomQuestions.length - 1) {
        setQuizIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
        setQuestionStartAt(Date.now());
        setShowTotalQuizHint(false);
      } else {
        setIsQuizFinished(true);
      }
    };

    const handleUseTotalQuizHint = () => {
      if (userProgress.totalXp >= HINT_XP_COST && !showTotalQuizHint) {
        setShowTotalQuizHint(true);
        handleUseHint();
      }
    };

    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">總測驗</h1>
            <button
              onClick={() => setCurrentMode('menu')}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold text-sm sm:text-base transition-colors"
              title="返回主頁"
            >
              返回主頁
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          <div className="text-base text-gray-500 mt-2">
            <span className="font-semibold">第 {quizIndex + 1}/{randomQuestions.length} 題</span>
            <span className="mx-2">•</span>
            <span className="font-semibold text-blue-700">目前正確率：{currentAccuracy}%</span>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">課程: {currentQuestion.lessonTitle}</p>
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">{currentQuestion.question}</h2>

          {/* Hint Section */}
          {currentQuestion.hint && !answered && (
            <div className="mb-4">
              {!showTotalQuizHint ? (
                <button
                  onClick={handleUseTotalQuizHint}
                  disabled={userProgress.totalXp < HINT_XP_COST}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm sm:text-base ${
                    userProgress.totalXp >= HINT_XP_COST
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-lg">💡</span>
                  <span>使用提示 (花費 5 XP)</span>
                  {userProgress.totalXp < HINT_XP_COST && <span className="text-xs">(XP不足)</span>}
                </button>
              ) : (
                <div className="p-3 sm:p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500">
                  <p className="font-semibold text-yellow-700 mb-1 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg">💡</span>
                    提示：
                  </p>
                  <p className="text-gray-700 text-sm sm:text-base">{currentQuestion.hint}</p>
                </div>
              )}
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedAnswer(idx)}
                disabled={answered}
                className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all text-sm sm:text-base ${
                  selectedAnswer === idx
                    ? idx === currentQuestion.correct
                      ? 'border-green-500 bg-green-50'
                      : answered
                      ? 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span> {option}
              </button>
            ))}
          </div>

          {answered && (
            <div className={`p-4 rounded-lg ${selectedAnswer === currentQuestion.correct ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
              <p className="font-semibold mb-2">
                {selectedAnswer === currentQuestion.correct ? '✓ 正確!' : '✗ 錯誤'}
              </p>
              <p className="text-gray-700">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!answered && (
          <button
            onClick={handleCheck}
            disabled={selectedAnswer === null}
            className={`w-full font-bold py-3 sm:py-4 rounded-lg transition-colors text-sm sm:text-lg ${
              selectedAnswer === null
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            檢查
          </button>
        )}

        {answered && (
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-lg"
          >
            {quizIndex === randomQuestions.length - 1 ? '完成' : '繼續'}
          </button>
        )}
      </div>
    );
  }

  // Ten Gods View
  if (currentMode === 'gods') {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-6 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">十神詳解</h1>
            <button
              onClick={() => setCurrentMode('menu')}
              className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
            >
              🏠 返回菜單
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mockTenGods.map((god) => (
              <div key={god.id} className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-500">
                <h3 className="text-3xl font-bold mb-2">{god.name_cn}</h3>
                <p className="text-lg text-gray-600 mb-4 font-semibold">{god.name_en}</p>
                <p className="text-gray-700 mb-6 text-base leading-relaxed">{god.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="font-bold text-green-700 text-lg mb-4">✓ 優點 (Strengths)</p>
                    <ul className="space-y-2 text-gray-700">
                      {god.positive_traits.map((t, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-600 mr-3 mt-1">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 p-6 rounded-lg">
                    <p className="font-bold text-red-700 text-lg mb-4">✗ 缺點 (Weaknesses)</p>
                    <ul className="space-y-2 text-gray-700">
                      {god.negative_traits.map((t, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-red-600 mr-3 mt-1">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
