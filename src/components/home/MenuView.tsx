import React from 'react';
import { mockLessons } from '../../data/mockData';

const ensureLessonTitlePrefix = (lessonId: number, title: string): string => {
  if (/^第.+課/.test(title)) return title;
  if (new RegExp(`^第${lessonId}課`).test(title)) return title;
  return `第${lessonId}課：${title}`;
};

const getHomepageDisplayLessonTitle = (lessonId: number, title: string): string => {
  if (lessonId === 11) return '第10課：趨吉避凶實踐';
  return ensureLessonTitlePrefix(lessonId, title);
};

type LevelProgress = {
  level: number;
  xpIntoCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
};

type UserProgressView = {
  correctAnswers: number;
  hintsUsed: number;
  bestStreak: number;
  dailyStreak: number;
  totalXp: number;
  lessonPerformance: Record<number, { attempts: number; correct: number }>;
  lessonRecentAnswers: Record<number, boolean[]>;
  lessonRecentWindowSize: Record<number, number>;
  lessonLatestPercent: Record<number, number>;
  totalQuizAttempts: number;
  totalQuizMastered: number;
  totalQuizPerfect: number;
  totalQuizLatestPercent: number | null;
};

type PathStep = {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  chip: string;
  isLesson: boolean;
  isMainPath: boolean;
  onClick: () => void;
};

interface MenuViewProps {
  levelProgress: LevelProgress;
  getLevelTitle: (level: number) => string;
  completedLessonIds: Set<number>;
  unlockedBadgeIds: string[];
  onOpenBadgeGallery: () => void;
  isProgressChartsOpen: boolean;
  onToggleProgressCharts: () => void;
  userProgress: UserProgressView;
  pathSteps: PathStep[];
  rewardOverlay: React.ReactNode;
}

export const MenuView: React.FC<MenuViewProps> = ({
  levelProgress,
  getLevelTitle,
  completedLessonIds,
  unlockedBadgeIds,
  onOpenBadgeGallery,
  isProgressChartsOpen,
  onToggleProgressCharts,
  userProgress,
  pathSteps,
  rewardOverlay,
}) => {
  const lessonSteps = pathSteps.filter((step) => step.isLesson && step.isMainPath);
  const progressLessons = lessonSteps
    .map((step) => mockLessons.find((lesson) => lesson.id === step.id))
    .filter((lesson): lesson is (typeof mockLessons)[number] => lesson !== undefined);
  const totalQuizStep = pathSteps.find((step) => step.id === 12);
  const nextLessonStep = lessonSteps.find((step) => !completedLessonIds.has(step.id)) ?? lessonSteps[0];
  const isAllLessonsCompleted = lessonSteps.every((step) => completedLessonIds.has(step.id));

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-8 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <img
                src="/bazi_logo.jpg"
                alt="BaZi Game Logo"
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover border border-white/30 shadow"
              />
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold">輕鬆學八字</h1>
            </div>
            <p className="text-sm sm:text-lg lg:text-2xl opacity-90">Learn BaZi in an Interactive Way</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 sm:mt-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
                <div className="flex items-baseline justify-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">Lv.{levelProgress.level}</span>
                  <span className="text-lg sm:text-xl lg:text-2xl text-gray-800 font-semibold">{getLevelTitle(levelProgress.level)}</span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">等級</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm sm:text-base text-gray-700">經驗值</p>
                  <p className="text-xs sm:text-sm text-gray-600">
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
              <button
                onClick={onOpenBadgeGallery}
                className="bg-white p-4 sm:p-6 rounded-lg shadow text-center hover:shadow-md transition-shadow"
              >
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-600">{unlockedBadgeIds.length}</p>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">已解鎖徽章</p>
                <p className="text-xs sm:text-sm text-amber-600 mt-1 font-medium">徽章圖鑑 →</p>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">開始今天的學習</p>
                <p className="text-sm text-gray-600 mt-1">
                  {isAllLessonsCompleted ? '全部課程已完成，建議挑戰總測驗' : `下一步：${nextLessonStep?.title ?? '課程'}`}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">快速開始，不中斷學習節奏</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => (isAllLessonsCompleted ? totalQuizStep?.onClick() : nextLessonStep?.onClick())}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 transition-colors"
              >
                {isAllLessonsCompleted ? '🎯 挑戰總測驗' : '▶ 繼續學習'}
              </button>
              <button
                onClick={() => (isAllLessonsCompleted ? lessonSteps[0]?.onClick() : totalQuizStep?.onClick())}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold py-3 px-4 transition-colors"
              >
                {isAllLessonsCompleted ? '📘 重溫第一課' : '🎯 快速測驗'}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <button
                onClick={onToggleProgressCharts}
                className="w-full flex items-center justify-between text-left mb-3"
              >
                <div>
                  <p className="text-base sm:text-lg font-bold text-gray-800">學習進度統計</p>
                  <p className="text-xs sm:text-sm text-gray-600">累計表現與最近一次成績</p>
                </div>
                <span className="text-sm sm:text-base text-blue-600 font-medium">
                  {isProgressChartsOpen ? '收起 ▲' : '查看全部 ▼'}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {progressLessons.slice(0, isProgressChartsOpen ? progressLessons.length : 2).map((lesson) => {
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
                    <div key={lesson.id} className="border border-gray-100 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">
                            {getHomepageDisplayLessonTitle(lesson.id, lesson.title_cn)}
                          </p>
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

              {userProgress.totalQuizAttempts > 0 && (
                <div className="mt-2">
                  <div className="border border-gray-100 rounded-lg p-2 sm:p-3">
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

              <div className="mt-3 pt-3 border-t border-gray-200">
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
                  <div className="text-center p-2 bg-pink-50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-pink-600">{userProgress.dailyStreak}</p>
                    <p className="text-xs text-gray-600">連玩天數</p>
                  </div>
                  <div className="text-center p-2 bg-cyan-50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-cyan-600">{userProgress.totalXp}</p>
                    <p className="text-xs text-gray-600">累計經驗值</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                        className={`group w-full md:w-[70%] text-left p-4 sm:p-6 rounded-2xl shadow-lg border border-white/60 bg-gradient-to-br ${step.accent} text-white hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-sm group-hover:bg-white/25 transition-colors">
                            <span className="text-base sm:text-lg">{step.emoji}</span>
                          </div>
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-white/20">{step.chip}</span>
                        </div>
                        <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mt-3">
                          {step.title}
                        </h3>
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
};
