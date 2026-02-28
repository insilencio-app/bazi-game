export const ROUTES = {
  home: '/',
  elements: '/elements',
  lessons: '/lessons',
  stems: '/stems',
  gods: '/gods',
  totalQuiz: '/total-quiz',
} as const;

export type GameMode = 'menu' | 'elements' | 'lessons' | 'stems' | 'branches' | 'gods' | 'total-quiz';

export const LESSON_ROUTE_PATTERN = '/lessons/:lessonId';

export const getLessonRoute = (lessonId: number) => `${ROUTES.lessons}/${lessonId}`;
