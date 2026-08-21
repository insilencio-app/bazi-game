/**
 * Style: 「五行研習桌」home — compact indigo study bar, parchment cards, gold wayfinding,
 * and one responsive, three-stage catalog for mobile and desktop.
 */
import React, { useState } from 'react';
import { mockLessons } from '../../data/mockData';
import { COURSE_CATALOG_SEGMENTS, getCourseDisplay, type CourseSegment } from '../../data/courseCatalog';

const getHomepageDisplayLessonTitle = (lessonId: number, title: string): string => getCourseDisplay(lessonId)?.title ?? title;

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

        <a href="/mailbox" className="mt-4 block border border-[#d9ccb6] bg-[#fbf7ee] p-4 shadow-[3px_3px_0_rgba(173,145,91,.16)] transition-colors hover:bg-[#fffdf7]">
          <span className="text-xs font-bold tracking-[0.14em] text-[#9b7330]">封緘研習信箱</span>
          <span className="mt-1 block font-['Noto_Serif_TC',serif] text-lg font-black text-[#102b48]">有問題，交給真人導師</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">匿名提問、秘密取件碼、一般七個工作天內盡量回覆。</span>
          <span className="mt-3 block text-sm font-bold text-[#765b2d]">寫一封私密信 →</span>
        </a>

        <section className="mt-6 border border-[#d9ccb6] bg-[#fbf7ee] p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.12em] text-[#9b7330]">主線進度</p><p className="mt-1 font-['Noto_Serif_TC',serif] text-xl font-black text-[#102b48]">已完成 {completedCount} / {requiredCount} 課</p></div><span className="font-['Noto_Serif_TC',serif] text-2xl font-black text-[#9b7330]">{Math.round((completedCount / requiredCount) * 100)}%</span></div>
          <div className="mt-3 h-1.5 overflow-hidden bg-[#e8ddc8]"><div className="h-full bg-[#d9ab58] transition-[width] duration-300" style={{ width: `${(completedCount / requiredCount) * 100}%` }} /></div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[0.15em] text-[#9b7330]">課程目錄</p><h2 className="mt-1 font-['Noto_Serif_TC',serif] text-2xl font-black text-[#102b48]">按階段研習</h2></div><p className="text-xs text-slate-500">點選階段展開</p></div>
          <div className="space-y-3">
            {COURSE_CATALOG_SEGMENTS.map((segment) => {
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
  const desktopHome = (
    <div className="desktop-atlas-home hidden min-h-screen md:block">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 flex items-center gap-4">
            <img src="/bazi_logo.jpg" alt="BaZi Game Logo" className="h-16 w-16 rounded-xl border border-white/30 object-cover shadow" />
            <h1 className="text-5xl font-bold lg:text-6xl">輕鬆學八字</h1>
          </div>
          <p className="text-lg opacity-90 lg:text-2xl">Learn BaZi in an Interactive Way</p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-white p-6 text-center shadow"><div className="flex items-baseline justify-center gap-3"><span className="text-4xl font-bold text-blue-600 lg:text-5xl">Lv.{levelProgress.level}</span><span className="text-xl font-semibold text-gray-800 lg:text-2xl">{getLevelTitle(levelProgress.level)}</span></div><p className="mt-2 text-base text-gray-600 lg:text-lg">等級</p></div>
            <div className="rounded-lg bg-white p-6 shadow"><div className="flex items-baseline justify-between gap-2"><p className="text-base text-gray-700">經驗值</p><p className="text-sm text-gray-600">{levelProgress.xpIntoCurrentLevel}/{levelProgress.xpToNextLevel}</p></div><div className="mt-3 h-3 w-full rounded-full bg-gray-200"><div className="h-3 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${Math.min(100, levelProgress.progressPercent)}%` }} /></div></div>
            <button onClick={onOpenBadgeGallery} className="rounded-lg bg-white p-6 text-center shadow transition-shadow hover:shadow-md"><p className="text-4xl font-bold text-amber-600 lg:text-5xl">{unlockedBadgeIds.length}</p><p className="mt-2 text-base text-gray-600 lg:text-lg">已解鎖徽章</p><p className="mt-1 text-sm font-medium text-amber-600">徽章圖鑑 →</p></button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 rounded-lg bg-white p-6 shadow"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xl font-bold text-gray-900">開始今天的學習</p><p className="mt-1 text-sm text-gray-600">{isAllLessonsCompleted ? '全部課程已完成，建議挑戰總測驗' : `下一步：${nextLessonStep?.title ?? '課程'}`}</p></div><p className="text-sm text-gray-600">快速開始，不中斷學習節奏</p></div><div className="grid grid-cols-2 gap-3"><button onClick={() => (isAllLessonsCompleted ? totalQuizStep?.onClick() : nextLessonStep?.onClick())} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700">{isAllLessonsCompleted ? '🎯 挑戰總測驗' : '▶ 繼續學習'}</button><button onClick={onOpenBadgeGallery} className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-semibold text-amber-800 transition-colors hover:bg-amber-100">查看學習檔案</button><a href="/mailbox" className="col-span-2 flex min-h-14 items-center justify-between gap-4 border border-[#b48a43] bg-[#f3e8cf] px-4 py-3 text-left text-[#765b2d] shadow-[3px_3px_0_rgba(180,138,67,.2)] transition-colors hover:bg-[#fff6df]"><span><span className="block text-xs font-bold tracking-[0.12em] text-[#9b7330]">封緘研習信箱</span><span className="mt-1 block font-serif text-lg font-black">真人導師 · 匿名提問 · 私密取件</span></span><span className="shrink-0 text-sm font-bold">寫一封私密信 →</span></a></div></div>
        <div className="mb-8"><div className="rounded-lg bg-white p-6 shadow"><button onClick={onToggleProgressCharts} className="mb-3 flex w-full items-center justify-between text-left"><div><p className="text-lg font-bold text-gray-800">學習進度統計</p><p className="text-sm text-gray-600">累計表現與最近一次成績</p></div><span className="text-base font-medium text-blue-600">{isProgressChartsOpen ? '收起 ▲' : '查看全部 ▼'}</span></button><div className="grid grid-cols-2 gap-2">{progressLessons.slice(0, isProgressChartsOpen ? progressLessons.length : 2).map((lesson) => { const stats = userProgress.lessonPerformance[lesson.id]; const attempts = stats?.attempts ?? 0; const correct = stats?.correct ?? 0; const cumulativePercent = attempts > 0 ? Math.round((correct / attempts) * 100) : 0; const recentWindowSize = Math.max(1, userProgress.lessonRecentWindowSize[lesson.id] ?? 10); const latestPercent = userProgress.lessonLatestPercent[lesson.id]; const recentAnswerSource = (userProgress.lessonRecentAnswers[lesson.id] ?? []).filter((value): value is boolean => typeof value === 'boolean'); const recentAnswers = recentAnswerSource.slice(-recentWindowSize); const recentAttempts = recentAnswers.length; const recentCorrect = recentAnswers.filter(Boolean).length; const displayPercent = typeof latestPercent === 'number' ? latestPercent : 0; const displayBarPercent = Math.min(100, Math.max(0, displayPercent)); const hasDisplayPercent = typeof latestPercent === 'number'; return <div key={lesson.id} className="rounded-lg border border-gray-100 p-3"><div className="mb-1 flex items-center justify-between"><div className="flex-1"><p className="text-sm font-medium text-gray-700">{getHomepageDisplayLessonTitle(lesson.id, lesson.title_cn)}</p><p className="text-xs text-gray-500">{attempts > 0 ? `累計 ${correct}/${attempts} • ${cumulativePercent}%` : '尚未開始'}</p>{typeof latestPercent === 'number' ? <p className="mt-0.5 text-xs font-medium text-blue-600">最近一次：{latestPercent}%</p> : recentAttempts > 0 ? <p className="mt-0.5 text-xs text-gray-400">最近{recentWindowSize}題：{recentCorrect}/{recentAttempts}</p> : null}</div><div className="text-right"><p className="mb-0.5 text-xs text-gray-500">最新進度</p><div className={`text-2xl font-bold ${displayPercent >= 80 ? 'text-green-600' : displayPercent >= 60 ? 'text-yellow-600' : 'text-gray-400'}`}>{hasDisplayPercent ? `${displayPercent}%` : '-'}</div></div></div><div className="h-1.5 w-full rounded-full bg-gray-200"><div className={`h-1.5 rounded-full transition-all duration-300 ${displayPercent >= 80 ? 'bg-green-600' : displayPercent >= 60 ? 'bg-yellow-600' : 'bg-blue-400'}`} style={{ width: `${displayBarPercent}%` }} /></div></div>; })}</div><div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-200 pt-3">{[[userProgress.correctAnswers, '累計答對', 'text-blue-600'], [userProgress.hintsUsed, '使用提示', 'text-purple-600'], [userProgress.bestStreak, '最佳連勝', 'text-orange-600'], [levelProgress.level, '當前等級', 'text-green-600'], [userProgress.dailyStreak, '連玩天數', 'text-pink-600'], [userProgress.totalXp, '累計經驗值', 'text-cyan-600']].map(([value, label, color]) => <div key={label as string} className="rounded-lg bg-gray-50 p-2 text-center"><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-xs text-gray-600">{label}</p></div>)}</div></div></div>
        <section className="desktop-atlas-catalog mb-8" aria-labelledby="desktop-catalog-title">
          <div className="desktop-atlas-catalog__header"><div><p>課程目錄</p><h2 id="desktop-catalog-title">按階段研習</h2><span>與手機版使用相同的學習地圖與完成規則。</span></div><p>點選課堂開始或繼續學習</p></div>
          <div className="desktop-atlas-catalog__grid">
            {COURSE_CATALOG_SEGMENTS.map((segment) => {
              const segmentSteps = segment.lessonIds.map((id) => allRequiredLessonSteps.find((step) => step.id === id)).filter((step): step is PathStep => Boolean(step));
              const segmentCompleted = segmentSteps.filter((step) => completedLessonIds.has(step.id)).length;
              return <section key={segment.id} className={`desktop-atlas-catalog__segment desktop-atlas-catalog__segment--${segment.id}`}>
                <header><span>{segment.order}</span><div><h3>{segment.title}</h3><p>{segment.subtitle}</p></div></header>
                <p className="desktop-atlas-catalog__segment-progress"><b>{segmentCompleted}</b> / {segmentSteps.length} 課完成</p>
                <div className="desktop-atlas-catalog__lesson-list">{segmentSteps.map((step) => {
                  const isNext = step.id === nextLessonStep?.id;
                  const status = getMobileLessonStatus(step, isNext, completedLessonIds);
                  const statusClass = completedLessonIds.has(step.id) ? 'is-complete' : isNext ? 'is-next' : 'is-pending';
                  return <button type="button" key={step.id} onClick={step.onClick} className="desktop-atlas-catalog__lesson"><span className={`desktop-atlas-catalog__lesson-marker ${statusClass}`} aria-hidden="true" /><span className="desktop-atlas-catalog__lesson-copy"><b>{step.title}</b><small>{step.subtitle}</small></span><span className={`desktop-atlas-catalog__lesson-status ${statusClass}`}>{status}</span></button>;
                })}</div>
              </section>;
            })}
          </div>
          {isAllLessonsCompleted && totalQuizStep && <button type="button" onClick={totalQuizStep.onClick} className="desktop-atlas-catalog__quiz"><span><small>所有課程已完成</small><b>總測驗</b></span><span aria-hidden="true">→</span></button>}
        </section>
      </div>
    </div>
  );

  return <>{<MobileHome levelProgress={levelProgress} getLevelTitle={getLevelTitle} completedLessonIds={completedLessonIds} unlockedBadgeIds={unlockedBadgeIds} onOpenBadgeGallery={onOpenBadgeGallery} userProgress={userProgress} allRequiredLessonSteps={allRequiredLessonSteps} nextLessonStep={nextLessonStep} totalQuizStep={totalQuizStep} isAllLessonsCompleted={isAllLessonsCompleted} />}{desktopHome}{rewardOverlay}</>;
};
