/**
 * Style: Lesson 8 inherits the 「五行研習桌」 system through the dedicated Da Yun workbench.
 * The workbench is intentionally limited to anonymous teaching cases and no personal data capture.
 */
import React from 'react';
import type { LessonWithBanks } from '../../types/domain';
import DayunWorkbench from './DayunWorkbench';

interface Props {
  lesson: LessonWithBanks;
}

const LessonVisuals: React.FC<Props> = ({ lesson }) => {
  if (lesson.id !== 8) return null;
  return <DayunWorkbench />;
};

export default LessonVisuals;
