// Style: shared lesson objective card follows the 「五行研習桌」 parchment file treatment across every course.
import React from 'react';
import type { LessonWithBanks } from '../../types/domain';
import LessonVisuals from './LessonVisuals';

interface LessonTemplateProps {
  lesson: LessonWithBanks;
}

export const LessonTemplate: React.FC<LessonTemplateProps> = ({ lesson }) => {
  return (
    <div className="mb-6">
      <div className="lesson-atlas-objective">
        <p className="lesson-atlas-objective-kicker">LEARNING OBJECTIVE</p>
        <h2>學習目標</h2>
        <p>{lesson.learning_objectives_cn ?? '（暫無學習目標）'}</p>
      </div>
      {lesson.id === 8 && <LessonVisuals lesson={lesson} />}
    </div>
  );
};



export default LessonTemplate;
