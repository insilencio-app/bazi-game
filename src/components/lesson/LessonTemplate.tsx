// Style: shared lesson objective card follows the 「五行研習桌」 parchment file treatment across every course.
/* Design reminder — 五行研習桌：課首只提供足夠的方向感；一般課以一行方向帶引路，核心課交由專屬任務簡報，工作台課則以完成條件銜接操作。 */
import React from 'react';
import type { LessonWithBanks } from '../../types/domain';
import LessonVisuals from './LessonVisuals';

interface LessonTemplateProps {
  lesson: LessonWithBanks;
}

const TASK_BRIEF_LESSON_IDS = new Set([5, 7]);

export const LessonTemplate: React.FC<LessonTemplateProps> = ({ lesson }) => {
  if (TASK_BRIEF_LESSON_IDS.has(lesson.id)) {
    return null;
  }

  const isWorkbenchLesson = lesson.id === 8;
  const objective = lesson.learning_objectives_cn ?? '（暫無學習方向）';

  return (
    <div className="lesson-template-shell mb-6">
      <section className={`lesson-orientation lesson-orientation--${isWorkbenchLesson ? 'workbench' : 'strip'}`} aria-label={isWorkbenchLesson ? '工作台完成條件' : '本課方向'}>
        <div className="lesson-orientation__label">
          <span>{isWorkbenchLesson ? 'WORKBENCH OUTCOME' : 'LESSON DIRECTION'}</span>
          <b>{isWorkbenchLesson ? '完成條件' : '本課方向'}</b>
        </div>
        <p className="lesson-orientation__copy">{objective}</p>
      </section>
      {isWorkbenchLesson && <LessonVisuals lesson={lesson} />}
    </div>
  );
};



export default LessonTemplate;
