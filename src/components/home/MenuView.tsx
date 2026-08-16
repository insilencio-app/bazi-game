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
      <div className="bazi-home-shell min-h-screen">
        <header className="bazi-home-header">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="flex items-center gap-3 sm:gap-4 mb-3">
              <img
                src="/bazi_logo.jpg"
                alt="BaZi Game Logo"
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl object-cover border border-[#e8d7ac] shadow-[0_8px_20px_rgba(16,46,76,0.18)]"
              />
              <div>
                <h1 className="bazi-home-title">輕鬆學八字</h1>
                <p className="bazi-home-subtitle">Learn BaZi in an Interactive Way</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bazi-home-panel bazi-home-stat-panel text-center">
                <div className="flex items-baseline justify-center gap-2 sm:gap-3">
                  <span className="bazi-home-level">Lv.{levelProgress.level}</span>
                  <span className="bazi-home-level-name">{getLevelTitle(levelProgress.level)}</span>
                </div>
                <p className="bazi-home-muted-label mt-2">等級</p>
              </div>

              <div className="bazi-home-panel bazi-home-stat-panel">
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <p className="bazi-home-muted-label">經驗值</p>
                  <p className="bazi-home-score-caption">{levelProgress.xpIntoCurrentLevel}/{levelProgress.xpToNextLevel}</p>
                </div>
                <div className="bazi-home-progress-track">
                  <div
                    className="bazi-home-progress-bar"
                    style={{ width: `${Math.min(100, levelProgress.progressPercent)}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={onOpenBadgeGallery}
                className="bazi-home-panel bazi-home-stat-panel bazi-home-badge-button"
              >
                <p className="bazi-home-badge-count">{unlockedBadgeIds.length}</p>
                <p className="bazi-home-muted-label mt-2">已解鎖徽章</p>
                <p className="bazi-home-badge-link">徽章圖鑑 →</p>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-6">
          <section className="bazi-home-panel mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="bazi-home-section-title">開始今天的學習</p>
                <p className="bazi-home-section-copy mt-1">
                  {isAllLessonsCompleted ? '全部課程已完成，建議挑戰總測驗' : `下一步：${nextLessonStep?.title ?? '課程'}`}
                </p>
              </div>
              <p className="bazi-home-section-copy">快速開始，不中斷學習節奏</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => (isAllLessonsCompleted ? totalQuizStep?.onClick() : nextLessonStep?.onClick())}
                className="bazi-home-cta bazi-home-cta-primary"
              >
                {isAllLessonsCompleted ? '🎯 挑戰總測驗' : '▶ 繼續學習'}
              </button>
              <button
                onClick={() => (isAllLessonsCompleted ? lessonSteps[0]?.onClick() : totalQuizStep?.onClick())}
                className="bazi-home-cta bazi-home-cta-secondary"
              >
                {isAllLessonsCompleted ? '📘 重溫第一課' : '🎯 快速測驗'}
              </button>
            </div>
          </section>

          <section className="bazi-home-panel mb-8">
            <button
              onClick={onToggleProgressCharts}
              className="w-full flex items-center justify-between text-left mb-4"
            >
              <div>
                <p className="bazi-home-section-title-sm">學習進度統計</p>
                <p className="bazi-home-section-copy">累計表現與最近一次成績</p>
              </div>
              <span className="bazi-home-toggle-link">
                {isProgressChartsOpen ? '收起 ▲' : '查看全部 ▼'}
              </span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div key={lesson.id} className="bazi-home-progress-card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="bazi-home-progress-title">
                          {getHomepageDisplayLessonTitle(lesson.id, lesson.title_cn)}
                        </p>
                        <p className="bazi-home-progress-meta">
                          {attempts > 0 ? `累計 ${correct}/${attempts} • ${cumulativePercent}%` : '尚未開始'}
                        </p>
                        {typeof latestPercent === 'number' && (
                          <p className="bazi-home-progress-meta bazi-home-progress-meta-highlight">最近一次：{latestPercent}%</p>
                        )}
                        {typeof latestPercent !== 'number' && recentAttempts > 0 && (
                          <p className="bazi-home-progress-meta">最近{recentWindowSize}題：{recentCorrect}/{recentAttempts}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="bazi-home-mini-label">最新進度</p>
                        <div className={`bazi-home-progress-value ${displayPercent >= 80 ? 'bazi-home-progress-value-good' : displayPercent >= 60 ? 'bazi-home-progress-value-mid' : 'bazi-home-progress-value-neutral'}`}>
                          {hasDisplayPercent ? `${displayPercent}%` : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="bazi-home-progress-track small">
                      <div
                        className={`bazi-home-progress-bar ${displayPercent >= 80 ? 'good' : displayPercent >= 60 ? 'mid' : 'neutral'}`}
                        style={{ width: `${displayBarPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {userProgress.totalQuizAttempts > 0 && (
              <div className="mt-3">
                <div className="bazi-home-progress-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="bazi-home-progress-title">總測驗</p>
                      <p className="bazi-home-progress-meta">
                        {userProgress.totalQuizAttempts > 0
                          ? `累計 ${userProgress.totalQuizMastered + userProgress.totalQuizPerfect}/${userProgress.totalQuizAttempts} • ${Math.round(((userProgress.totalQuizMastered + userProgress.totalQuizPerfect) / userProgress.totalQuizAttempts) * 100)}%`
                          : '尚未開始'}
                      </p>
                      {typeof userProgress.totalQuizLatestPercent === 'number' && (
                        <p className="bazi-home-progress-meta bazi-home-progress-meta-highlight">最近一次：{userProgress.totalQuizLatestPercent}%</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="bazi-home-mini-label">最新進度</p>
                      <div className={`bazi-home-progress-value ${typeof userProgress.totalQuizLatestPercent === 'number' ? userProgress.totalQuizLatestPercent >= 80 ? 'bazi-home-progress-value-good' : userProgress.totalQuizLatestPercent >= 60 ? 'bazi-home-progress-value-mid' : 'bazi-home-progress-value-neutral' : 'bazi-home-progress-value-neutral'}`}>
                        {typeof userProgress.totalQuizLatestPercent === 'number' ? `${userProgress.totalQuizLatestPercent}%` : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="bazi-home-progress-track small">
                    <div
                      className={`bazi-home-progress-bar ${typeof userProgress.totalQuizLatestPercent === 'number' ? userProgress.totalQuizLatestPercent >= 80 ? 'good' : userProgress.totalQuizLatestPercent >= 60 ? 'mid' : 'neutral' : 'neutral'}`}
                      style={{ width: `${Math.min(100, Math.max(0, userProgress.totalQuizLatestPercent ?? 0))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[#eadfc4]">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bazi-home-metric-tile blue">
                  <p className="bazi-home-metric-value">{userProgress.correctAnswers}</p>
                  <p className="bazi-home-metric-label">累計答對</p>
                </div>
                <div className="bazi-home-metric-tile purple">
                  <p className="bazi-home-metric-value">{userProgress.hintsUsed}</p>
                  <p className="bazi-home-metric-label">使用提示</p>
                </div>
                <div className="bazi-home-metric-tile amber">
                  <p className="bazi-home-metric-value">{userProgress.bestStreak}</p>
                  <p className="bazi-home-metric-label">最佳連勝</p>
                </div>
                <div className="bazi-home-metric-tile green">
                  <p className="bazi-home-metric-value">{levelProgress.level}</p>
                  <p className="bazi-home-metric-label">當前等級</p>
                </div>
                <div className="bazi-home-metric-tile rose">
                  <p className="bazi-home-metric-value">{userProgress.dailyStreak}</p>
                  <p className="bazi-home-metric-label">連玩天數</p>
                </div>
                <div className="bazi-home-metric-tile cyan">
                  <p className="bazi-home-metric-value">{userProgress.totalXp}</p>
                  <p className="bazi-home-metric-label">累計經驗值</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bazi-home-panel bazi-home-lesson-panel mb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="bazi-home-section-heading">學習路徑</h2>
                <p className="bazi-home-section-copy mt-1">跟著路徑完成每個課程步驟</p>
              </div>
              <div className="hidden md:flex items-center gap-2 bazi-home-timeline-tag">
                <span className="h-2 w-2 rounded-full bg-[#6da26d]"></span>
                <span>從這裡開始</span>
              </div>
            </div>

            <div className="relative pl-7 sm:pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-1.5 rounded-full bg-gradient-to-b from-[#d3b06d] via-[#d9d0b7] to-[#a8c3b1]"></div>

              <div className="space-y-6 sm:space-y-8">
                {pathSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} md:pr-4`}
                  >
                    <div className="absolute -left-0.5 top-6 h-5 w-5 rounded-full border-[3px] border-[#fffdf8] bg-[#102E4C] shadow-[0_0_0_4px_rgba(16,46,76,0.12)]"></div>
                    <button
                      onClick={step.onClick}
                      className="bazi-home-path-card"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#f3e7c9] border border-[#eadfb6] flex items-center justify-center shadow-sm">
                          <span className="text-base sm:text-lg">{step.emoji}</span>
                        </div>
                        <span className="bazi-home-chip">{step.chip}</span>
                      </div>
                      <h3 className="bazi-home-path-title">{step.title}</h3>
                      <p className="bazi-home-path-subtitle">{step.subtitle}</p>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
      {rewardOverlay}
    </>
  );
};
