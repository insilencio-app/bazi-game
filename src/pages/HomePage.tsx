import React, { useState } from 'react';
import { mockElements, mockLessons } from '../data/mockData';
import { ElementsView } from '../components/home/ElementsView';
import { LessonsView } from '../components/home/LessonsView';
import { StemsView } from '../components/home/StemsView';
import { GodsView } from '../components/home/GodsView';
import { MenuView } from '../components/home/MenuView';
import { TotalQuizView } from '../components/home/TotalQuizView';
import { BadgesView } from '../components/home/BadgesView';
import { LessonPage } from './LessonPage';
import { useGameRouteMode } from '../hooks/useGameRouteMode';
import { useTotalQuizSession } from '../hooks/useTotalQuizSession';
import { useRewardNotices } from '../hooks/useRewardNotices';
import { useProgressionStore, type UserProgress } from '../hooks/useProgressionStore';
import type { ElementItem, LessonWithBanks } from '../types/domain';

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

const LEVEL_XP_BASE = 100;
const CORRECT_ANSWER_XP = 10;
const LESSON_COMPLETE_XP = 30;
const PERFECT_LESSON_BONUS_XP = 20;
const TOTAL_QUIZ_MASTERY_BONUS_XP = 40;
const TOTAL_QUIZ_PERFECT_BONUS_XP = 60;
const HINT_XP_COST = 50;
const PROGRESS_STORAGE_KEY = 'bazi-progression-v1';
const MAIN_PATH_LESSON_IDS = [0, 1, 2, 3, 4, 5, 55, 6, 65, 7, 8, 9, 11] as const;
const MAIN_PATH_LESSON_COUNT = MAIN_PATH_LESSON_IDS.length;
const LESSON_TITLE_PREFIX_PATTERN = /^第.+課/;

const BADGE_DEFINITIONS: Record<BadgeId, { name: string; emoji: string; hintShort: string; hintLong: string }> = {
  'first-step': { name: '初學者', emoji: '👣', hintShort: '1課', hintLong: '完成任意 1 個課程' },
  'lesson-master': { name: '課程達人', emoji: '🎓', hintShort: `${MAIN_PATH_LESSON_COUNT}課`, hintLong: `完成主線 ${MAIN_PATH_LESSON_COUNT} 個課程` },
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
  'all-courses-80': { name: '全課通關', emoji: '🎖️', hintShort: `${MAIN_PATH_LESSON_COUNT}課80+`, hintLong: `主線 ${MAIN_PATH_LESSON_COUNT} 個課程都達 80%+` },
  'total-quiz-finisher': { name: '總測完成者', emoji: '🏁', hintShort: '總測1次', hintLong: '完成總測驗 1 次' },
  'total-quiz-finisher-5': { name: '測驗不放棄', emoji: '🎯', hintShort: '總測5次', hintLong: '完成總測驗 5 次' },
  'replay-3': { name: '回鍋高手', emoji: '🔁', hintShort: '同課3次', hintLong: '同一課程累計遊玩 3 次' },
  'master-scholar': { name: '博學大師', emoji: '👨‍🎓', hintShort: `${MAIN_PATH_LESSON_COUNT}課滿分`, hintLong: `主線 ${MAIN_PATH_LESSON_COUNT} 個課程都達 100%` },
  'perfect-combo': { name: '完美連鎖', emoji: '✨', hintShort: '三課滿分', hintLong: '達成 3 個課程滿分' },
  'late-bloomer': { name: '大器晚成', emoji: '🌸', hintShort: `${MAIN_PATH_LESSON_COUNT}課完成`, hintLong: `完成主線全部 ${MAIN_PATH_LESSON_COUNT} 個課程` },
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
  const lesson = mockLessons.find((item) => item.id === lessonId) as LessonWithBanks | undefined;
  if (!lesson) return 10;

  const questionBankCount = Math.min(6, Array.isArray(lesson.questionBank) ? lesson.questionBank.length : 0);
  const trueFalseBankCount = Math.min(2, Array.isArray(lesson.trueFalseBank) ? lesson.trueFalseBank.length : 0);
  const matchBankCount = Math.min(2, Array.isArray(lesson.matchBank) ? lesson.matchBank.length : 0);
  const totalQuestionCount = questionBankCount + trueFalseBankCount + matchBankCount;

  return totalQuestionCount > 0 ? totalQuestionCount : 10;
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
  const completedMainPathCount = MAIN_PATH_LESSON_IDS.filter((lessonId) => completedLessonIds.has(lessonId)).length;
  const highScoreMainPathCount = MAIN_PATH_LESSON_IDS.filter((lessonId) => highScoreLessonIds.has(lessonId)).length;
  const perfectMainPathCount = MAIN_PATH_LESSON_IDS.filter((lessonId) => perfectLessonIds.has(lessonId)).length;

  if (completedLessonIds.size >= 1) achieved.push('first-step');
  if (completedMainPathCount >= MAIN_PATH_LESSON_IDS.length) achieved.push('lesson-master');
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
  if (highScoreMainPathCount >= MAIN_PATH_LESSON_IDS.length) achieved.push('all-courses-80');
  if (progress.totalQuizAttempts >= 1) achieved.push('total-quiz-finisher');
  if (progress.totalQuizAttempts >= 5) achieved.push('total-quiz-finisher-5');
  if (Object.values(lessonAttemptCounts).some((count) => count >= 3)) achieved.push('replay-3');

  // New badges for learning milestones
  if (perfectMainPathCount >= MAIN_PATH_LESSON_IDS.length) achieved.push('master-scholar');
  if (perfectLessonIds.size >= 3) achieved.push('perfect-combo');
  if (completedMainPathCount >= MAIN_PATH_LESSON_IDS.length) achieved.push('late-bloomer');
  
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
  const { currentMode, selectedLesson, navigateToMode } = useGameRouteMode();
  const [selectedElement, setSelectedElement] = useState<ElementItem | null>(null);
  const [isProgressChartsOpen, setIsProgressChartsOpen] = useState(false);
  const allBadgeIds = React.useMemo(() => Object.keys(BADGE_DEFINITIONS) as BadgeId[], []);

  const {
    userProgress,
    unlockedBadgeIds,
    completedLessonIds,
    spendHint,
    recordQuestionAnswer,
    completeLesson,
    applyTotalQuizCompletion,
  } = useProgressionStore<BadgeId>({
    storageKey: PROGRESS_STORAGE_KEY,
    defaultProgress,
    validBadgeIds: allBadgeIds,
    getLessonRecentWindowSize,
    getAchievedBadges,
    xpConfig: {
      correctAnswerXp: CORRECT_ANSWER_XP,
      lessonCompleteXp: LESSON_COMPLETE_XP,
      perfectLessonBonusXp: PERFECT_LESSON_BONUS_XP,
      totalQuizMasteryBonusXp: TOTAL_QUIZ_MASTERY_BONUS_XP,
      totalQuizPerfectBonusXp: TOTAL_QUIZ_PERFECT_BONUS_XP,
      hintXpCost: HINT_XP_COST,
    },
  });

  const levelProgress = calculateLevelProgress(userProgress.totalXp);
  const { levelUpNotice, activeBadgeNotice, dismissLevelUpNotice, dismissActiveBadgeNotice } = useRewardNotices<BadgeId>({
    currentLevel: levelProgress.level,
    unlockedBadgeIds,
  });

  const {
    quizIndex,
    quizScore,
    selectedAnswer,
    answered,
    isQuizFinished,
    randomQuestions,
    isTotalQuizRewardApplied,
    maxQuizStreak,
    fastCorrectInRun,
    recentWindowSize,
    recentCorrect,
    recentAttempts,
    recentPercent,
    showTotalQuizHint,
    autoAdvanceOnCorrect,
    setSelectedAnswer,
    setIsTotalQuizRewardApplied,
    setAutoAdvanceOnCorrect,
    loadError,
    isLoading,
    currentQuestion,
    totalQuestions,
    progress,
    latestPercent,
    latestBarPercent,
    currentAccuracy,
    handleCheck,
    handleNext,
    handleUseTotalQuizHint,
  } = useTotalQuizSession({
    currentMode,
    userXp: userProgress.totalXp,
    hintXpCost: HINT_XP_COST,
    onQuestionAnswered: recordQuestionAnswer,
    onUseHint: spendHint,
  });

  React.useEffect(() => {
    if (currentMode !== 'total-quiz' || !isQuizFinished || isTotalQuizRewardApplied || randomQuestions.length === 0) {
      return;
    }

    applyTotalQuizCompletion(quizScore, randomQuestions.length, maxQuizStreak, fastCorrectInRun);
    setIsTotalQuizRewardApplied(true);
  }, [
    currentMode,
    isQuizFinished,
    isTotalQuizRewardApplied,
    randomQuestions.length,
    quizScore,
    maxQuizStreak,
    fastCorrectInRun,
    applyTotalQuizCompletion,
  ]);

  const handleElementClick = (element: string) => {
    const el = mockElements.find((e) => e.name_cn === element);
    setSelectedElement(el ?? null);
  };

  const handleLessonStart = (lessonId: number) => {
    navigateToMode('lessons', lessonId);
  };

  const handleLessonComplete = (lessonId: number, score: number, totalQuestions: number) => {
    completeLesson(lessonId, score, totalQuestions);

    navigateToMode('menu');
  };

  const lessonTitleMap = new Map(mockLessons.map(l => [l.id, l.title_cn]));
  const getPathLessonTitle = (lessonId: number, fallbackTitle: string) => {
    const title = lessonTitleMap.get(lessonId) ?? fallbackTitle;
    return LESSON_TITLE_PREFIX_PATTERN.test(title) ? title : `第${lessonId}課：${title}`;
  };
  const pathSteps = [
    {
      id: 0,
      title: getPathLessonTitle(0, '第0課'),
      subtitle: '先懂四柱與日主再學五行',
      emoji: '🧭',
      accent: 'from-indigo-500 to-violet-400',
      chip: '必修',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(0),
    },
    {
      id: 1,
      title: getPathLessonTitle(1, '第1課'),
      subtitle: '木火土金水入門',
      emoji: '🌳',
      accent: 'from-green-500 to-emerald-400',
      chip: '初級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(1),
    },
    {
      id: 2,
      title: getPathLessonTitle(2, '第2課'),
      subtitle: '陰陽五行與天干',
      emoji: '☰',
      accent: 'from-blue-500 to-sky-400',
      chip: '初級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(2),
    },
    {
      id: 3,
      title: getPathLessonTitle(3, '第3課'),
      subtitle: '地支、生肖與時辰',
      emoji: '🐲',
      accent: 'from-teal-500 to-cyan-400',
      chip: '初級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(3),
    },
    {
      id: 4,
      title: getPathLessonTitle(4, '第4課'),
      subtitle: '太陽曆節氣與八字月份劃分',
      emoji: '🌱',
      accent: 'from-lime-500 to-green-400',
      chip: '初級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(4),
    },
    {
      id: 5,
      title: getPathLessonTitle(5, '第5課'),
      subtitle: '十神作為關係系統，不作固定標籤',
      emoji: '👥',
      accent: 'from-rose-500 to-pink-400',
      chip: '中級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(5),
    },
    {
      id: 55,
      title: getPathLessonTitle(55, '第5.5課'),
      subtitle: '十神關係速查雙向練習',
      emoji: '🧩',
      accent: 'from-amber-500 to-orange-400',
      chip: '練習',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(55),
    },
    {
      id: 6,
      title: getPathLessonTitle(6, '第6課'),
      subtitle: '地支內的隱藏天干',
      emoji: '🌪️',
      accent: 'from-purple-500 to-indigo-400',
      chip: '中級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(6),
    },
    {
      id: 65,
      title: getPathLessonTitle(65, '第6.5課'),
      subtitle: '用本氣把地支快速換成十神',
      emoji: '🪄',
      accent: 'from-fuchsia-500 to-pink-400',
      chip: '練習',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(65),
    },
    {
      id: 7,
      title: getPathLessonTitle(7, '第7課'),
      subtitle: '三合六合刑沖破害',
      emoji: '⚡',
      accent: 'from-orange-500 to-red-400',
      chip: '高級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(7),
    },
    {
      id: 8,
      title: getPathLessonTitle(8, '第8課'),
      subtitle: '月柱順逆與起運時間',
      emoji: '🏔️',
      accent: 'from-slate-500 to-gray-400',
      chip: '高級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(8),
    },
    {
      id: 9,
      title: getPathLessonTitle(9, '第9課'),
      subtitle: '月令定格與古典用神判法',
      emoji: '🧱',
      accent: 'from-fuchsia-500 to-purple-400',
      chip: '高級',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(9),
    },
    {
      id: 11,
      title: '第10課：趨吉避凶實踐',
      subtitle: '把喜忌、制化與行為策略連起來',
      emoji: '🛡️',
      accent: 'from-emerald-500 to-teal-400',
      chip: '實戰',
      isLesson: true,
      isMainPath: true,
      onClick: () => handleLessonStart(11),
    },
    {
      id: 12,
      title: '總測驗',
      subtitle: '所有課程的綜合測驗',
      emoji: '🎯',
      accent: 'from-amber-500 to-yellow-400',
      chip: '綜合',
      isLesson: false,
      isMainPath: false,
      onClick: () => navigateToMode('total-quiz'),
    },
    {
      id: 10,
      title: '補充課：體用觀的特定師承解法',
      subtitle: '流派補充：體用觀的特定師承解法',
      emoji: '📚',
      accent: 'from-stone-500 to-zinc-400',
      chip: '補充',
      isLesson: true,
      isMainPath: false,
      onClick: () => handleLessonStart(10),
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
              onClick={dismissLevelUpNotice}
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
              onClick={dismissActiveBadgeNotice}
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
      <MenuView
        levelProgress={levelProgress}
        getLevelTitle={getLevelTitle}
        completedLessonIds={completedLessonIds}
        unlockedBadgeIds={unlockedBadgeIds}
        onOpenBadgeGallery={() => navigateToMode('badges')}
        isProgressChartsOpen={isProgressChartsOpen}
        onToggleProgressCharts={() => setIsProgressChartsOpen((prev) => !prev)}
        userProgress={userProgress}
        pathSteps={pathSteps}
        rewardOverlay={rewardOverlay}
      />
    );
  }

  if (currentMode === 'badges') {
    return (
      <BadgesView
        unlockedBadgeIds={unlockedBadgeIds}
        allBadgeIds={allBadgeIds}
        badgeDefinitions={BADGE_DEFINITIONS}
        onBack={() => navigateToMode('menu')}
      />
    );
  }

  // Elements View
  if (currentMode === 'elements') {
    return (
      <ElementsView
        selectedElement={selectedElement}
        onElementClick={handleElementClick}
        onBack={() => navigateToMode('menu')}
      />
    );
  }

  // Lessons View
  if (currentMode === 'lessons') {
    if (selectedLesson !== null) {
      return (
        <LessonPage
          lessonId={selectedLesson}
          onComplete={handleLessonComplete}
          onExit={() => navigateToMode('menu')}
          userXp={userProgress.totalXp}
          onUseHint={spendHint}
          onQuestionAnswered={recordQuestionAnswer}
        />
      );
    }

    return (
      <LessonsView onLessonStart={handleLessonStart} onBack={() => navigateToMode('menu')} />
    );
  }

  // Stems View
  if (currentMode === 'stems') {
    return (
      <StemsView onBack={() => navigateToMode('menu')} />
    );
  }

  // Total Quiz View
  if (currentMode === 'total-quiz') {
    return (
      <TotalQuizView
        isLoading={isLoading}
        loadError={loadError}
        isQuizFinished={isQuizFinished}
        quizIndex={quizIndex}
        totalQuestions={totalQuestions}
        progress={progress}
        currentAccuracy={currentAccuracy}
        latestPercent={latestPercent}
        latestBarPercent={latestBarPercent}
        recentWindowSize={recentWindowSize}
        recentCorrect={recentCorrect}
        recentAttempts={recentAttempts}
        recentPercent={recentPercent}
        quizScore={quizScore}
        currentQuestion={currentQuestion}
        selectedAnswer={selectedAnswer}
        answered={answered}
        showTotalQuizHint={showTotalQuizHint}
        autoAdvanceOnCorrect={autoAdvanceOnCorrect}
        userXp={userProgress.totalXp}
        hintXpCost={HINT_XP_COST}
        onBack={() => navigateToMode('menu')}
        onUseHint={handleUseTotalQuizHint}
        onToggleAutoAdvance={() => setAutoAdvanceOnCorrect((prev) => !prev)}
        onSelectAnswer={setSelectedAnswer}
        onCheck={handleCheck}
        onNext={handleNext}
        rewardOverlay={rewardOverlay}
      />
    );
  }

  // Ten Gods View
  if (currentMode === 'gods') {
    return (
      <GodsView onBack={() => navigateToMode('menu')} />
    );
  }

  return null;
};
