import React from 'react';
import type { LessonWithBanks } from '../../types/domain';

interface LessonTemplateProps {
  lesson: LessonWithBanks;
}

export const LessonTemplate: React.FC<LessonTemplateProps> = ({ lesson }) => {
  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">學習目標</h2>
        <p className="text-gray-700">{lesson.learning_objectives_cn ?? '（暫無學習目標）'}</p>
      </div>
    </div>
  );
};



export default LessonTemplate;
