import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getLessonRoute, ROUTES, type GameMode } from '../routes';

const getModeFromPath = (pathname: string): GameMode => {
  if (pathname === ROUTES.elements) return 'elements';
  if (pathname === ROUTES.lessons || pathname.startsWith(`${ROUTES.lessons}/`)) return 'lessons';
  if (pathname === ROUTES.badges) return 'badges';
  if (pathname === ROUTES.stems) return 'stems';
  if (pathname === ROUTES.gods) return 'gods';
  if (pathname === ROUTES.totalQuiz) return 'total-quiz';
  return 'menu';
};

const parseLessonId = (lessonIdParam?: string): number | null => {
  if (!lessonIdParam) return null;
  const parsed = Number(lessonIdParam);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const useGameRouteMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lessonId: lessonIdParam } = useParams<{ lessonId?: string }>();

  const [currentMode, setCurrentMode] = React.useState<GameMode>(() => getModeFromPath(location.pathname));
  const [selectedLesson, setSelectedLesson] = React.useState<number | null>(() => {
    const initialMode = getModeFromPath(location.pathname);
    return initialMode === 'lessons' ? parseLessonId(lessonIdParam) : null;
  });

  const navigateToMode = React.useCallback(
    (mode: GameMode, lessonId?: number | null) => {
      if (mode === 'menu') {
        navigate(ROUTES.home);
        return;
      }
      if (mode === 'elements') {
        navigate(ROUTES.elements);
        return;
      }
      if (mode === 'lessons') {
        if (lessonId && Number.isFinite(lessonId)) {
          navigate(getLessonRoute(lessonId));
          return;
        }
        navigate(ROUTES.lessons);
        return;
      }
      if (mode === 'badges') {
        navigate(ROUTES.badges);
        return;
      }
      if (mode === 'stems' || mode === 'branches') {
        navigate(ROUTES.stems);
        return;
      }
      if (mode === 'gods') {
        navigate(ROUTES.gods);
        return;
      }
      if (mode === 'total-quiz') {
        navigate(ROUTES.totalQuiz);
        return;
      }

      navigate(ROUTES.home);
    },
    [navigate]
  );

  React.useEffect(() => {
    const nextMode = getModeFromPath(location.pathname);
    setCurrentMode(nextMode);

    if (nextMode === 'lessons') {
      setSelectedLesson(parseLessonId(lessonIdParam));
      return;
    }

    setSelectedLesson(null);
  }, [location.pathname, lessonIdParam]);

  return {
    currentMode,
    selectedLesson,
    navigateToMode,
  };
};
