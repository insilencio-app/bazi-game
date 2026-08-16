import React from 'react';
import type { LessonWithBanks } from '../../types/domain';
import LessonVisuals from './LessonVisuals';

interface LessonTemplateProps {
  lesson: LessonWithBanks;
}

export const LessonTemplate: React.FC<LessonTemplateProps> = ({ lesson }) => {
  return (
    <div className="lesson-template-shell">
      <div className="lesson-template-panel">
        <h2 className="lesson-template-title">學習目標</h2>
        <p className="lesson-template-copy">{lesson.learning_objectives_cn ?? '（暫無學習目標）'}</p>
      </div>
      {lesson.id === 8 && <LessonVisuals lesson={lesson} />}
    </div>
  );
};



export default LessonTemplate;
