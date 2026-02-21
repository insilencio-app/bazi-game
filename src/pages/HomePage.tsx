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
  | 'fifty-correct'
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
  | 'replay-3';

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
const PROGRESS_STORAGE_KEY = 'bazi-progression-v1';

const BADGE_DEFINITIONS: Record<BadgeId, { name: string; emoji: string; hintShort: string; hintLong: string }> = {
  'first-step': { name: '初學者', emoji: '👣', hintShort: '1課', hintLong: '完成任意 1 個課程' },
  'lesson-master': { name: '課程達人', emoji: '🎓', hintShort: '7課', hintLong: '完成 7 個課程' },
  'quiz-starter': { name: '測驗新手', emoji: '🧠', hintShort: '答對1', hintLong: '累計答對 1 題' },
  'ten-correct': { name: '十題達成', emoji: '🔟', hintShort: '答對10', hintLong: '累計答對 10 題' },
  'fifty-correct': { name: '五十題高手', emoji: '🏆', hintShort: '答對50', hintLong: '累計答對 50 題' },
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
  'total-quiz-finisher': { name: '綜測完成者', emoji: '🏁', hintShort: '總測1次', hintLong: '完成總測驗 1 次' },
  'total-quiz-finisher-5': { name: '測驗不放棄', emoji: '🎯', hintShort: '總測5次', hintLong: '完成總測驗 5 次' },
  'replay-3': { name: '回鍋高手', emoji: '🔁', hintShort: '同課3次', hintLong: '同一課程累計遊玩 3 次' },
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
    return {
      userProgress: {
        ...defaultProgress,
        ...(parsed.userProgress ?? {}),
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
  if (progress.correctAnswers >= 50) achieved.push('fifty-correct');
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
  const [questionStartAt, setQuestionStartAt] = useState<number | null>(null);
  const [isBadgeGalleryOpen, setIsBadgeGalleryOpen] = useState(true);

  const levelProgress = calculateLevelProgress(userProgress.totalXp);
  const allBadgeIds = Object.keys(BADGE_DEFINITIONS) as BadgeId[];

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
      setQuestionStartAt(null);
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

  // Main Menu
  if (currentMode === 'menu') {
    return (
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
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">Lv.{levelProgress.level}</div>
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

          {/* Badge Gallery */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-8">
            <button
              onClick={() => setIsBadgeGalleryOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <p className="text-sm sm:text-base text-gray-600">徽章圖鑑</p>
              <span className="text-sm sm:text-base text-blue-600 font-medium">
                {isBadgeGalleryOpen ? '收起 ▲' : '展開 ▼'}
              </span>
            </button>

            {isBadgeGalleryOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                {allBadgeIds.map((badgeId) => {
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
            )}
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

    if (isQuizFinished) {
      return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-5xl font-bold mb-4">綜合測驗完成！</h2>
          <p className="text-xl text-gray-600 mb-6">你已完成綜合測驗。</p>
          <div className="bg-blue-50 rounded-lg p-8 mb-6">
            <p className="text-5xl font-bold text-blue-700 mb-2">{quizScore} / {randomQuestions.length}</p>
            <p className="text-xl text-gray-700">答對題數</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">{Math.round((quizScore / randomQuestions.length) * 100)}%</p>
          </div>
          <button
            onClick={() => setCurrentMode('menu')}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors text-xl"
          >
            返回主頁
          </button>
        </div>
      );
    }

    const handleCheck = () => {
      if (selectedAnswer === null || answered) return;
      setAnswered(true);
      if (selectedAnswer === currentQuestion.correct) {
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
    };

    const handleNext = () => {
      if (quizIndex < randomQuestions.length - 1) {
        setQuizIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
        setQuestionStartAt(Date.now());
      } else {
        setIsQuizFinished(true);
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
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 transition-colors"
              title="返回主頁"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" />
              </svg>
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-base text-gray-500 mt-2">
            <span className="font-semibold">第 {quizIndex + 1}/{randomQuestions.length} 題</span>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">課程: {currentQuestion.lessonTitle}</p>
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">{currentQuestion.question}</h2>

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
