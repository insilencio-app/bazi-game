/**
 * Style: 「五行研習桌」mobile-first home — a compact indigo study bar, parchment next-step card,
 * and progressively disclosed course catalog. Desktop keeps the established learning-path dashboard.
 */
import React, { useState } from 'react';
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

type CourseSegment = { id: 'foundation' | 'core' | 'advanced'; order: string; title: string; subtitle: string; lessonIds: number[] };

const MOBILE_COURSE_SEGMENTS: CourseSegment[] = [
  { id: 'foundation', order: '01', title: '入門基礎', subtitle: '第 0–4 課・先建立四柱、五行與天干地支概念', lessonIds: [0, 1, 2, 3, 4] },
  { id: 'core', order: '02', title: '核心推演', subtitle: '第 5–7 課・十神、藏干與地支關係', lessonIds: [5, 55, 6, 65, 7] },
  { id: 'advanced', order: '03', title: '進階實戰', subtitle: '第 8–10 課及補充課・強弱、格局與實踐', lessonIds: [8, 9, 11, 10] },
];

function getMobileLessonStatus(step: PathStep, isNext: boolean, completedLessonIds: Set<number>) {
  if (completedLessonIds.has(step.id)) return '已完成';
  if (isNext) return '繼續學習';
  return '未開始';
}

function MobileHome({
  levelProgress,
  getLevelTitle,
  completedLessonIds,
  unlockedBadgeIds,
  onOpenBadgeGallery,
  userProgress,
  allRequiredLessonSteps,
  nextLessonStep,
  totalQuizStep,
  isAllLessonsCompleted,
}: {
  levelProgress: LevelProgress;
  getLevelTitle: (level: number) => string;
  completedLessonIds: Set<number>;
  unlockedBadgeIds: string[];
  onOpenBadgeGallery: () => void;
  userProgress: UserProgressView;
  allRequiredLessonSteps: PathStep[];
  nextLessonStep: PathStep | undefined;
  totalQuizStep: PathStep | undefined;
  isAllLessonsCompleted: boolean;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openSegment, setOpenSegment] = useState<CourseSegment['id'] | null>('foundation');
  const requiredCount = allRequiredLessonSteps.length;
  const completedCount = allRequiredLessonSteps.filter((step) => completedLessonIds.has(step.id)).length;
  const learningAction = isAllLessonsCompleted ? totalQuizStep?.onClick : nextLessonStep?.onClick;
  const learningTitle = isAllLessonsCompleted ? '挑戰總測驗' : `繼續${nextLessonStep?.title ?? '下一課'}`;
  const learningDescription = isAllLessonsCompleted
    ? '所有課程已完成，現在可整合所學並接受檢驗。'
    : nextLessonStep?.subtitle ?? '由第一課開始建立八字學習基礎。';

  return (
    <main className="min-h-screen bg-[#f7f1e5] font-['Noto_Sans_TC',system-ui,sans-serif] text-[#153756] md:hidden">
      <header className="sticky top-0 z-30 border-b border-[#1b4162] bg-[#0d2a4a] px-4 py-3 text-[#fffdf7] shadow-[0_6px_18px_rgba(13,42,74,.18)]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src="/bazi_logo.jpg" alt="輕鬆學八字" className="h-9 w-9 shrink-0 rounded-lg border border-white/30 object-cover" />
            <div className="min-w-0">
              <p className="truncate font-['Noto_Serif_TC',serif] text-lg font-bold leading-none">輕鬆學八字</p>
              <p className="mt-1 text-[10px] font-bold tracking-[0.15em] text-[#e1c178]">BAZI LEARNING ATLAS</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsProfileOpen(true)} className="shrink-0 border border-[#d9ab58] bg-[#fffdf7] px-2.5 py-1.5 text-left text-[#153756] shadow-[2px_2px_0_#d9ab58]">
            <span className="block text-[10px] font-bold text-[#765b2d]">學習檔案</span>
            <span className="block font-['Noto_Serif_TC',serif] text-sm font-black">Lv.{levelProgress.level}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pb-10 pt-5">
        <section className="border-t-[3px] border-[#0d2a4a] bg-[#fffdf7] p-5 shadow-[7px_7px_0_rgba(173,145,91,.2)]">
          <p className="text-xs font-bold tracking-[0.16em] text-[#9b7330]">今日下一步</p>
          <h1 className="mt-2 font-['Noto_Serif_TC',serif] text-[1.7rem] font-black leading-tight text-[#102b48]">{learningTitle}</h1>
          <p className="mt-2 text-[15px] leading-6 text-slate-600">{learningDescription}</p>
          {!isAllLessonsCompleted && nextLessonStep && <p className="mt-4 border-y border-[#e2d7c5] py-2 text-sm font-bold text-[#765b2d]">課程進度：第 {completedCount + 1} / {requiredCount} 課</p>}
          <button type="button" onClick={learningAction} className="mt-4 flex min-h-12 w-full items-center justify-between bg-[#0d2a4a] px-4 text-left font-bold text-white shadow-[3px_3px_0_#d9ab58] transition-transform active:translate-y-0.5">
            <span>{isAllLessonsCompleted ? '開始總測驗' : '從這裡繼續'}</span><span aria-hidden="true">→</span>
          </button>
          <button type="button" onClick={() => setIsProfileOpen(true)} className="mt-3 w-full py-1 text-sm font-bold text-[#765b2d] underline decoration-[#d9ab58] underline-offset-4">查看學習檔案與完整紀錄</button>
        </section>

        <section className="mt-6 border border-[#d9ccb6] bg-[#fbf7ee] p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.12em] text-[#9b7330]">主線進度</p><p className="mt-1 font-['Noto_Serif_TC',serif] text-xl font-black text-[#102b48]">已完成 {completedCount} / {requiredCount} 課</p></div><span className="font-['Noto_Serif_TC',serif] text-2xl font-black text-[#9b7330]">{Math.round((completedCount / requiredCount) * 100)}%</span></div>
          <div className="mt-3 h-1.5 overflow-hidden bg-[#e8ddc8]"><div className="h-full bg-[#d9ab58] transition-[width] duration-300" style={{ width: `${(completedCount / requiredCount) * 100}%` }} /></div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[0.15em] text-[#9b7330]">課程目錄</p><h2 className="mt-1 font-['Noto_Serif_TC',serif] text-2xl font-black text-[#102b48]">按階段研習</h2></div><p className="text-xs text-slate-500">點選階段展開</p></div>
          <div className="space-y-3">
            {MOBILE_COURSE_SEGMENTS.map((segment) => {
              const segmentSteps = segment.lessonIds.map((id) => allRequiredLessonSteps.find((step) => step.id === id)).filter((step): step is PathStep => Boolean(step));
              const segmentCompleted = segmentSteps.filter((step) => completedLessonIds.has(step.id)).length;
              const isOpen = openSegment === segment.id;
              return <section key={segment.id} className="border border-[#d9ccb6] bg-[#fffdf7]">
                <button type="button" onClick={() => setOpenSegment(isOpen ? null : segment.id)} aria-expanded={isOpen} className="flex min-h-16 w-full items-center gap-3 px-4 text-left">
                  <span className="font-['Noto_Serif_TC',serif] text-sm font-black text-[#a77e34]">{segment.order}</span>
                  <span className="min-w-0 flex-1"><span className="block font-['Noto_Serif_TC',serif] text-lg font-black text-[#102b48]">{segment.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{segmentCompleted}/{segmentSteps.length} 課完成・{segment.subtitle}</span></span>
                  <span className="text-[#9b7330]" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <div className="border-t border-[#e5d9c3] px-3 py-2">{segmentSteps.map((step) => {
                  const isNext = step.id === nextLessonStep?.id;
                  const status = getMobileLessonStatus(step, isNext, completedLessonIds);
                  return <button type="button" key={step.id} onClick={step.onClick} className="flex min-h-14 w-full items-center gap-3 border-b border-[#eee5d6] px-1 py-2 text-left last:border-b-0">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${completedLessonIds.has(step.id) ? 'bg-emerald-600' : isNext ? 'bg-[#d9ab58]' : 'bg-[#d7cec0]'}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-5 text-[#153756]">{step.title}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{step.subtitle}</span></span>
                    <span className={`shrink-0 text-[11px] font-bold ${isNext ? 'text-[#9b7330]' : 'text-slate-400'}`}>{status}</span>
                  </button>;
                })}</div>}
              </section>;
            })}
            {isAllLessonsCompleted && totalQuizStep && <button type="button" onClick={totalQuizStep.onClick} className="flex min-h-16 w-full items-center justify-between border border-[#b48a43] bg-[#f3e8cf] px-4 text-left text-[#765b2d] shadow-[3px_3px_0_rgba(180,138,67,.25)]"><span><span className="block text-xs font-bold tracking-[0.12em]">所有課程已完成</span><span className="mt-1 block font-['Noto_Serif_TC',serif] text-lg font-black">總測驗</span></span><span className="text-xl" aria-hidden="true">→</span></button>}
          </div>
        </section>
      </div>

      {isProfileOpen && <div className="fixed inset-0 z-50 flex items-end bg-[#0d2a4a]/45" role="dialog" aria-modal="true" aria-label="學習檔案">
        <button type="button" aria-label="關閉學習檔案" className="absolute inset-0" onClick={() => setIsProfileOpen(false)} />
        <section className="relative max-h-[86vh] w-full overflow-y-auto border-t-[3px] border-[#d9ab58] bg-[#fffdf7] px-5 pb-8 pt-5 shadow-[0_-10px_30px_rgba(13,42,74,.25)]">
          <div className="mx-auto max-w-md"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.16em] text-[#9b7330]">LEARNING PROFILE</p><h2 className="mt-1 font-['Noto_Serif_TC',serif] text-2xl font-black text-[#102b48]">學習檔案</h2></div><button type="button" onClick={() => setIsProfileOpen(false)} className="border border-[#d9ccb6] px-3 py-1.5 text-sm font-bold text-[#153756]">關閉</button></div>
          <div className="mt-5 border-y border-[#e2d7c5] py-4"><div className="flex items-end justify-between"><div><p className="font-['Noto_Serif_TC',serif] text-3xl font-black text-[#102b48]">Lv.{levelProgress.level}</p><p className="mt-1 text-sm font-bold text-[#765b2d]">{getLevelTitle(levelProgress.level)}</p></div><p className="text-right text-sm text-slate-600">經驗值<br /><b className="text-[#102b48]">{levelProgress.xpIntoCurrentLevel}/{levelProgress.xpToNextLevel}</b></p></div><div className="mt-3 h-2 bg-[#e8ddc8]"><div className="h-full bg-[#d9ab58]" style={{ width: `${levelProgress.progressPercent}%` }} /></div></div>
          <div className="mt-4 grid grid-cols-2 gap-px border border-[#e2d7c5] bg-[#e2d7c5]">{[[userProgress.correctAnswers, '累計答對'], [userProgress.bestStreak, '最佳連勝'], [userProgress.dailyStreak, '連玩天數'], [userProgress.totalXp, '累計經驗值']].map(([value, label]) => <div key={label as string} className="bg-[#fffdf7] px-3 py-3"><p className="font-['Noto_Serif_TC',serif] text-2xl font-black text-[#102b48]">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div>
          <button type="button" onClick={onOpenBadgeGallery} className="mt-4 flex min-h-12 w-full items-center justify-between border border-[#b48a43] bg-[#fbf7ee] px-4 text-left font-bold text-[#765b2d]"><span>已解鎖徽章 <b className="ml-1 font-['Noto_Serif_TC',serif] text-xl">{unlockedBadgeIds.length}</b></span><span aria-hidden="true">查看圖鑑 →</span></button></div>
        </section>
      </div>}
    </main>
  );
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
  const mainLessonSteps = pathSteps.filter((step) => step.isLesson && step.isMainPath);
  const allRequiredLessonSteps = pathSteps.filter((step) => step.isLesson);
  const progressLessons = mainLessonSteps
    .map((step) => mockLessons.find((lesson) => lesson.id === step.id))
    .filter((lesson): lesson is (typeof mockLessons)[number] => lesson !== undefined);
  const totalQuizStep = pathSteps.find((step) => step.id === 12);
  const nextLessonStep = allRequiredLessonSteps.find((step) => !completedLessonIds.has(step.id)) ?? allRequiredLessonSteps[0];
  const isAllLessonsCompleted = allRequiredLessonSteps.every((step) => completedLessonIds.has(step.id));
  const desktopPathSteps = [...allRequiredLessonSteps, ...(isAllLessonsCompleted && totalQuizStep ? [totalQuizStep] : [])];

  const desktopHome = (
    <div className="hidden min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 md:block">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <div className="mx-auto max-w-6xl"><div className="mb-2 flex items-center gap-4"><img src="/bazi_logo.jpg" alt="BaZi Game Logo" className="h-16 w-16 rounded-xl border border-white/30 object-cover shadow" /><h1 className="text-5xl font-bold lg:text-6xl">輕鬆學八字</h1></div><p className="text-lg opacity-90 lg:text-2xl">Learn BaZi in an Interactive Way</p>
          <div className="mt-6 grid grid-cols-3 gap-4"><div className="rounded-lg bg-white p-6 text-center shadow"><div className="flex items-baseline justify-center gap-3"><span className="text-4xl font-bold text-blue-600 lg:text-5xl">Lv.{levelProgress.level}</span><span className="text-xl font-semibold text-gray-800 lg:text-2xl">{getLevelTitle(levelProgress.level)}</span></div><p className="mt-2 text-base text-gray-600 lg:text-lg">等級</p></div><div className="rounded-lg bg-white p-6 shadow"><div className="flex items-baseline justify-between gap-2"><p className="text-base text-gray-700">經驗值</p><p className="text-sm text-gray-600">{levelProgress.xpIntoCurrentLevel}/{levelProgress.xpToNextLevel}</p></div><div className="mt-3 h-3 w-full rounded-full bg-gray-200"><div className="h-3 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${Math.min(100, levelProgress.progressPercent)}%` }} /></div></div><button onClick={onOpenBadgeGallery} className="rounded-lg bg-white p-6 text-center shadow transition-shadow hover:shadow-md"><p className="text-4xl font-bold text-amber-600 lg:text-5xl">{unlockedBadgeIds.length}</p><p className="mt-2 text-base text-gray-600 lg:text-lg">已解鎖徽章</p><p className="mt-1 text-sm font-medium text-amber-600">徽章圖鑑 →</p></button></div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-6"><div className="mb-6 rounded-lg bg-white p-6 shadow"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xl font-bold text-gray-900">開始今天的學習</p><p className="mt-1 text-sm text-gray-600">{isAllLessonsCompleted ? '全部課程已完成，建議挑戰總測驗' : `下一步：${nextLessonStep?.title ?? '課程'}`}</p></div><p className="text-sm text-gray-600">快速開始，不中斷學習節奏</p></div><div className="grid grid-cols-2 gap-3"><button onClick={() => (isAllLessonsCompleted ? totalQuizStep?.onClick() : nextLessonStep?.onClick())} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700">{isAllLessonsCompleted ? '🎯 挑戰總測驗' : '▶ 繼續學習'}</button><button onClick={onOpenBadgeGallery} className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-semibold text-amber-800 transition-colors hover:bg-amber-100">查看學習檔案</button></div></div>
        <div className="mb-8"><div className="rounded-lg bg-white p-6 shadow"><button onClick={onToggleProgressCharts} className="mb-3 flex w-full items-center justify-between text-left"><div><p className="text-lg font-bold text-gray-800">學習進度統計</p><p className="text-sm text-gray-600">累計表現與最近一次成績</p></div><span className="text-base font-medium text-blue-600">{isProgressChartsOpen ? '收起 ▲' : '查看全部 ▼'}</span></button><div className="grid grid-cols-2 gap-2">{progressLessons.slice(0, isProgressChartsOpen ? progressLessons.length : 2).map((lesson) => { const stats = userProgress.lessonPerformance[lesson.id]; const attempts = stats?.attempts ?? 0; const correct = stats?.correct ?? 0; const cumulativePercent = attempts > 0 ? Math.round((correct / attempts) * 100) : 0; const recentWindowSize = Math.max(1, userProgress.lessonRecentWindowSize[lesson.id] ?? 10); const latestPercent = userProgress.lessonLatestPercent[lesson.id]; const recentAnswerSource = (userProgress.lessonRecentAnswers[lesson.id] ?? []).filter((value): value is boolean => typeof value === 'boolean'); const recentAnswers = recentAnswerSource.slice(-recentWindowSize); const recentAttempts = recentAnswers.length; const recentCorrect = recentAnswers.filter(Boolean).length; const displayPercent = typeof latestPercent === 'number' ? latestPercent : 0; const displayBarPercent = Math.min(100, Math.max(0, displayPercent)); const hasDisplayPercent = typeof latestPercent === 'number'; return <div key={lesson.id} className="rounded-lg border border-gray-100 p-3"><div className="mb-1 flex items-center justify-between"><div className="flex-1"><p className="text-sm font-medium text-gray-700">{getHomepageDisplayLessonTitle(lesson.id, lesson.title_cn)}</p><p className="text-xs text-gray-500">{attempts > 0 ? `累計 ${correct}/${attempts} • ${cumulativePercent}%` : '尚未開始'}</p>{typeof latestPercent === 'number' ? <p className="mt-0.5 text-xs font-medium text-blue-600">最近一次：{latestPercent}%</p> : recentAttempts > 0 ? <p className="mt-0.5 text-xs text-gray-400">最近{recentWindowSize}題：{recentCorrect}/{recentAttempts}</p> : null}</div><div className="text-right"><p className="mb-0.5 text-xs text-gray-500">最新進度</p><div className={`text-2xl font-bold ${displayPercent >= 80 ? 'text-green-600' : displayPercent >= 60 ? 'text-yellow-600' : 'text-gray-400'}`}>{hasDisplayPercent ? `${displayPercent}%` : '-'}</div></div></div><div className="h-1.5 w-full rounded-full bg-gray-200"><div className={`h-1.5 rounded-full transition-all duration-300 ${displayPercent >= 80 ? 'bg-green-600' : displayPercent >= 60 ? 'bg-yellow-600' : 'bg-blue-400'}`} style={{ width: `${displayBarPercent}%` }} /></div></div>; })}</div><div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-200 pt-3">{[[userProgress.correctAnswers, '累計答對', 'text-blue-600'], [userProgress.hintsUsed, '使用提示', 'text-purple-600'], [userProgress.bestStreak, '最佳連勝', 'text-orange-600'], [levelProgress.level, '當前等級', 'text-green-600'], [userProgress.dailyStreak, '連玩天數', 'text-pink-600'], [userProgress.totalXp, '累計經驗值', 'text-cyan-600']].map(([value, label, color]) => <div key={label as string} className="rounded-lg bg-gray-50 p-2 text-center"><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-xs text-gray-600">{label}</p></div>)}</div></div></div>
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-white p-8 shadow-xl"><div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 blur-2xl" /><div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 blur-2xl" /><div className="relative"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">學習路徑</h2><p className="mt-1 text-sm text-gray-600 lg:text-base">跟著路徑完成每個課程步驟</p></div><div className="flex items-center gap-2 text-base text-gray-500"><span className="h-2 w-2 rounded-full bg-green-500" />從這裡開始</div></div><div className="relative pl-8"><div className="absolute bottom-0 left-3 top-0 w-2 rounded-full bg-gradient-to-b from-blue-200 via-indigo-200 to-emerald-200" /><div className="space-y-10">{desktopPathSteps.map((step, index) => <div key={step.id} className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} pr-8`}><div className="absolute -left-1.5 top-4 h-6 w-6 rounded-full border-4 border-blue-400 bg-white" /><button onClick={step.onClick} className={`group w-[70%] rounded-2xl border border-white/60 bg-gradient-to-br ${step.accent} p-6 text-left text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}><div className="flex items-center justify-between gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-sm transition-colors group-hover:bg-white/25"><span className="text-lg">{step.emoji}</span></div><span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">{step.chip}</span></div><h3 className="mt-3 text-2xl font-bold lg:text-3xl">{step.title}</h3><p className="mt-1 text-sm text-white/90 lg:text-base">{step.subtitle}</p></button></div>)}</div></div></div></div>
      </div>
    </div>
  );

  return <>{<MobileHome levelProgress={levelProgress} getLevelTitle={getLevelTitle} completedLessonIds={completedLessonIds} unlockedBadgeIds={unlockedBadgeIds} onOpenBadgeGallery={onOpenBadgeGallery} userProgress={userProgress} allRequiredLessonSteps={allRequiredLessonSteps} nextLessonStep={nextLessonStep} totalQuizStep={totalQuizStep} isAllLessonsCompleted={isAllLessonsCompleted} />}{desktopHome}{rewardOverlay}</>;
};
