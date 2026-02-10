import React, { useState } from 'react';
import { mockElements, mockHeavenlySteams, mockEarthlyBranches, mockTenGods, mockLessons } from '../data/mockData';
import { ElementCard } from '../components/ElementCard';
import { ElementWheel } from '../components/ElementWheel';
import { LessonPage } from './LessonPage';

type GameMode = 'menu' | 'elements' | 'lessons' | 'stems' | 'branches' | 'gods';

export const HomePage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<GameMode>('menu');
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [userProgress, setUserProgress] = useState({
    lessonsCompleted: 0,
    quizzesCompleted: 0,
    totalScore: 0,
  });

  const handleElementClick = (element: string) => {
    const el = mockElements.find((e) => e.name_cn === element);
    setSelectedElement(el);
  };

  const handleLessonStart = (lessonId: number) => {
    setSelectedLesson(lessonId);
    setCurrentMode('lessons');
  };

  const handleLessonComplete = (_lessonId: number, score: number, totalQuestions: number) => {
    setUserProgress({
      ...userProgress,
      lessonsCompleted: userProgress.lessonsCompleted + 1,
      quizzesCompleted: totalQuestions > 0 ? userProgress.quizzesCompleted + 1 : userProgress.quizzesCompleted,
      totalScore: userProgress.totalScore + score,
    });
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
      title: '十神詳解',
      subtitle: '官殺財印食傷比劫',
      emoji: '👥',
      accent: 'from-rose-500 to-pink-400',
      chip: '中級',
      onClick: () => handleLessonStart(4),
    },
    {
      id: 5,
      title: '十二地支藏干',
      subtitle: '地支內的隱藏天干',
      emoji: '🌪️',
      accent: 'from-purple-500 to-indigo-400',
      chip: '中級',
      onClick: () => handleLessonStart(5),
    },
    {
      id: 6,
      title: '地支關係',
      subtitle: '三合六合刑沖破害',
      emoji: '⚡',
      accent: 'from-orange-500 to-red-400',
      chip: '高級',
      onClick: () => handleLessonStart(6),
    },
    {
      id: 7,
      title: '全部課程',
      subtitle: '查看完整課程清單',
      emoji: '📚',
      accent: 'from-amber-500 to-yellow-400',
      chip: '導航',
      onClick: () => setCurrentMode('lessons'),
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">{userProgress.lessonsCompleted}</div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">已完成課程</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600">{userProgress.quizzesCompleted}</div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">已完成測驗</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600">{userProgress.totalScore}</div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">總分</p>
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
