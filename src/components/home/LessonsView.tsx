import React from 'react';
import { mockLessons } from '../../data/mockData';
import { getCourseDisplay } from '../../data/courseCatalog';

interface LessonsViewProps {
  onLessonStart: (lessonId: number) => void;
  onBack: () => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({ onLessonStart, onBack }) => {
  return (
    <div className="bazi-home-shell min-h-screen">
      <header className="bazi-home-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <img
                src="/bazi_logo.jpg"
                alt="BaZi Game Logo"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover border border-[#e8d7ac] shadow-[0_8px_20px_rgba(16,46,76,0.18)]"
              />
              <h1 className="bazi-home-title text-3xl sm:text-4xl lg:text-5xl">課程與測驗</h1>
            </div>
            <button
              onClick={onBack}
              className="bazi-home-cta bazi-home-cta-secondary max-w-max px-5 sm:px-6"
            >
              🏠 返回菜單
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {mockLessons.map((lesson) => (
            <div key={lesson.id} className="bazi-lesson-card">
              <h3 className="bazi-lesson-card-title">
                {getCourseDisplay(lesson.id)?.title ?? lesson.title_cn}
              </h3>
              <p className="bazi-lesson-card-subtitle">{lesson.title_en}</p>
              <button
                onClick={() => onLessonStart(lesson.id)}
                className="bazi-home-cta bazi-home-cta-primary mt-4 md:w-auto"
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
