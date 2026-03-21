import React from 'react';
import { mockLessons } from '../../data/mockData';

const ensureLessonTitlePrefix = (lessonId: number, title: string): string => {
  if (new RegExp(`^第${lessonId}課`).test(title)) return title;
  return `第${lessonId}課：${title}`;
};

interface LessonsViewProps {
  onLessonStart: (lessonId: number) => void;
  onBack: () => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({ onLessonStart, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">課程與測驗</h1>
          <button
            onClick={onBack}
            className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
          >
            🏠 返回菜單
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {mockLessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                {ensureLessonTitlePrefix(lesson.id, lesson.title_cn)}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-700 mb-4">{lesson.title_en}</p>
              <button
                onClick={() => onLessonStart(lesson.id)}
                className="w-full md:w-auto bg-blue-600 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded hover:bg-blue-700 font-semibold text-sm sm:text-base"
              >
                開始課程
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
