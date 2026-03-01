import { apiBaseUrl } from '../config/env';

type QuestionType = 'mcq' | 'truefalse' | 'match';

export type QuizApiQuestion = {
  id: string;
  lessonId: number;
  type: QuestionType;
  prompt: string;
  explanation: string;
  hint: string | null;
  options?: string[];
  pairs?: { left: string; right: string }[];
  answer?: number | boolean;
};

export type CreateQuizSessionRequest = {
  userId: string;
  seed?: string;
  policy?: {
    totalCount?: number;
    minGap?: number;
    typeTargets?: Partial<Record<QuestionType, number>>;
  };
};

export type CreateQuizSessionResponse = {
  sessionId: string;
  userId: string;
  totalQuestions: number;
  selectedByType: Record<QuestionType, number>;
  questions: QuizApiQuestion[];
};

export type QuizSessionDetailResponse = {
  sessionId: string;
  questions: QuizApiQuestion[];
};

export type AnalyticsSummaryResponse = {
  ok: true;
  userId: string | null;
  summary: {
    sessions: number;
    attempts: number;
    correct: number;
    accuracyPercent: number;
    averageResponseMs: number | null;
  };
};

export type AnalyticsLessonsResponse = {
  ok: true;
  userId: string | null;
  lessons: Array<{
    lessonId: number;
    lessonTitle: string;
    attempts: number;
    correct: number;
    accuracyPercent: number;
    averageResponseMs: number | null;
  }>;
};

export type AnalyticsQuestionsResponse = {
  ok: true;
  userId: string | null;
  questions: Array<{
    questionId: string;
    lessonId: number;
    lessonTitle: string;
    questionType: QuestionType;
    prompt: string;
    attempts: number;
    correct: number;
    accuracyPercent: number;
    averageResponseMs: number | null;
    totalExposure: number;
  }>;
};

export type AnalyticsAlertsResponse = {
  ok: true;
  userId: string | null;
  thresholds: {
    weakAccuracyThreshold: number;
    weakAttemptsThreshold: number;
    overusedExposureThreshold: number;
  };
  alerts: Array<{
    category: 'weak-question' | 'overused-question';
    questionId: string;
    lessonId: number;
    lessonTitle: string;
    questionType: QuestionType;
    accuracyPercent: number;
    attempts: number;
    totalExposure: number;
  }>;
};

const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

export const createQuizSession = (payload: CreateQuizSessionRequest) =>
  requestJson<CreateQuizSessionResponse>(`${apiBaseUrl}/quiz/sessions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getQuizSession = (sessionId: string, includeAnswers = false) =>
  requestJson<QuizSessionDetailResponse>(
    `${apiBaseUrl}/quiz/sessions/${encodeURIComponent(sessionId)}?includeAnswers=${includeAnswers ? '1' : '0'}`
  );

export const submitQuizAttempts = (
  sessionId: string,
  attempts: Array<{ questionId: string; isCorrect: boolean; responseMs: number | null }>
) =>
  requestJson<{ savedAttempts: number; correctCount: number }>(
    `${apiBaseUrl}/quiz/sessions/${encodeURIComponent(sessionId)}/attempts`,
    {
      method: 'POST',
      body: JSON.stringify({ attempts }),
    }
  );

export const getAnalyticsSummary = (userId?: string) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson<AnalyticsSummaryResponse>(`${apiBaseUrl}/analytics/summary${query}`);
};

export const getAnalyticsLessons = (userId?: string) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson<AnalyticsLessonsResponse>(`${apiBaseUrl}/analytics/lessons${query}`);
};

export const getAnalyticsQuestions = (userId?: string) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson<AnalyticsQuestionsResponse>(`${apiBaseUrl}/analytics/questions${query}`);
};

export const getAnalyticsAlerts = (args?: {
  userId?: string;
  weakAccuracyThreshold?: number;
  weakAttemptsThreshold?: number;
  overusedExposureThreshold?: number;
}) => {
  const params = new URLSearchParams();

  if (args?.userId) params.set('userId', args.userId);
  if (typeof args?.weakAccuracyThreshold === 'number') {
    params.set('weakAccuracyThreshold', String(args.weakAccuracyThreshold));
  }
  if (typeof args?.weakAttemptsThreshold === 'number') {
    params.set('weakAttemptsThreshold', String(args.weakAttemptsThreshold));
  }
  if (typeof args?.overusedExposureThreshold === 'number') {
    params.set('overusedExposureThreshold', String(args.overusedExposureThreshold));
  }

  const query = params.toString();
  return requestJson<AnalyticsAlertsResponse>(`${apiBaseUrl}/analytics/alerts${query ? `?${query}` : ''}`);
};
