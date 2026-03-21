export type QuizQuestionType = 'mcq' | 'truefalse' | 'match';

export interface QuizApiQuestion {
  id: string;
  lessonId: number;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  answer?: number | boolean;
  explanation: string;
  hint?: string | null;
  pairs?: Array<{ left: string; right: string }>;
}

export interface QuizSessionPolicy {
  totalCount: number;
  minGap?: number;
  lessonIds?: number[];
  typeTargets?: Partial<Record<QuizQuestionType, number>>;
}

export interface QuizSessionResponse {
  sessionId: string;
  questions: QuizApiQuestion[];
}

interface LoadQuizSessionRequest {
  userId: string;
  policy: QuizSessionPolicy;
}

interface QuizAttemptPayload {
  questionId: string;
  isCorrect: boolean;
  responseMs: number | null;
}

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Quiz API request failed (${response.status}): ${text || response.statusText}`);
  }

  return response.json() as Promise<T>;
};

export const loadQuizSessionQuestions = async ({
  userId,
  policy,
}: LoadQuizSessionRequest): Promise<QuizSessionResponse> => {
  return requestJson<QuizSessionResponse>('/api/quiz/sessions', {
    method: 'POST',
    body: JSON.stringify({ userId, policy }),
  });
};

export const submitQuizAttempts = async (
  sessionId: string,
  attempts: QuizAttemptPayload[]
): Promise<void> => {
  await requestJson(`/api/quiz/sessions/${encodeURIComponent(sessionId)}/attempts`, {
    method: 'POST',
    body: JSON.stringify({ attempts }),
  });
};
