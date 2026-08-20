import cors from 'cors';
import express from 'express';
import {
  applyExposureForSelection,
  createExposureState,
  createSeededRng,
  selectQuestionSession,
  type SelectionPolicy,
} from '../src/db/selector/sessionSelector';
import {
  buildSessionQuestionPayload,
  createDatabase,
  insertAttempts,
  insertSession,
  insertSessionQuestions,
  loadAnalyticsAlerts,
  loadAnalyticsSummary,
  loadLessonAnalytics,
  loadQuestionAnalytics,
  loadActiveQuestions,
  loadExposureRows,
  loadSessionQuestionIds,
  upsertExposureRows,
} from './db';
import {
  createMailboxService,
  loadMailboxConfig,
  MailboxConfigurationError,
  MailboxRateLimitError,
  MailboxValidationError,
  REQUIRED_REPLY_DISCLOSURE,
  type DeclineReason,
  type InquiryStatus,
} from './mailbox';

const app = express();
const db = createDatabase();
const API_PORT = Number(process.env.API_PORT ?? 8787);
const API_HOST = process.env.API_HOST ?? '127.0.0.1';
const corsOriginRaw = process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173';
const trustProxyRaw = process.env.TRUST_PROXY;
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
const securityStatusEnabled = (process.env.SECURITY_STATUS_ENABLED ?? 'true').toLowerCase() === 'true';
const analyticsCacheTtlMs = Math.max(0, Number(process.env.ANALYTICS_CACHE_TTL_MS ?? 15_000));
const allowedOrigins = corsOriginRaw
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const trustProxyValue =
  trustProxyRaw === undefined
    ? false
    : trustProxyRaw === 'true'
    ? true
    : Number.isFinite(Number(trustProxyRaw))
    ? Number(trustProxyRaw)
    : trustProxyRaw;

app.set('trust proxy', trustProxyValue);

type RequestCounter = {
  count: number;
  resetAt: number;
};

const requestCounters = new Map<string, RequestCounter>();

type AnalyticsCacheEntry = {
  value: unknown;
  expiresAt: number;
};

const analyticsCache = new Map<string, AnalyticsCacheEntry>();

const getCachedAnalytics = <T,>(key: string): T | null => {
  if (analyticsCacheTtlMs <= 0) return null;

  const entry = analyticsCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    analyticsCache.delete(key);
    return null;
  }

  return entry.value as T;
};

const setCachedAnalytics = (key: string, value: unknown) => {
  if (analyticsCacheTtlMs <= 0) return;

  analyticsCache.set(key, {
    value,
    expiresAt: Date.now() + analyticsCacheTtlMs,
  });
};

const clearAnalyticsCache = () => {
  analyticsCache.clear();
};

const getMailboxService = (response: express.Response) => {
  try {
    return createMailboxService(db, loadMailboxConfig());
  } catch (error) {
    if (error instanceof MailboxConfigurationError) {
      response.status(503).json({ message: 'Private mailbox is not configured' });
      return null;
    }

    response.status(500).json({ message: 'Private mailbox is unavailable' });
    return null;
  }
};

const sendMailboxError = (response: express.Response, error: unknown) => {
  if (error instanceof MailboxValidationError) {
    response.status(400).json({ message: error.message });
    return;
  }
  if (error instanceof MailboxRateLimitError) {
    response.status(429).json({ message: 'Too many private mailbox submissions. Please try again later.' });
    return;
  }
  if (error instanceof MailboxConfigurationError) {
    response.status(503).json({ message: 'Private mailbox is not configured' });
    return;
  }

  console.error('[private-mailbox] request failed');
  response.status(500).json({ message: 'Private mailbox request failed' });
};

const getHeaderToken = (request: express.Request, headerName: string) => {
  const value = request.header(headerName);
  return value ? value.trim() : '';
};

const isInquiryStatus = (value: unknown): value is InquiryStatus =>
  value === 'received' || value === 'reviewing' || value === 'replied' || value === 'declined';

const isDeclineReason = (value: unknown): value is DeclineReason =>
  value === 'sensitive_data' || value === 'out_of_scope' || value === 'safety' || value === 'capacity';

const rateLimiter: express.RequestHandler = (request, response, next) => {
  const now = Date.now();
  const key = request.ip || 'unknown';
  const existing = requestCounters.get(key);

  if (!existing || existing.resetAt <= now) {
    requestCounters.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    next();
    return;
  }

  if (existing.count >= rateLimitMaxRequests) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    response.setHeader('Retry-After', String(retryAfter));
    response.status(429).json({ message: 'Too many requests' });
    return;
  }

  existing.count += 1;
  requestCounters.set(key, existing);
  next();
};

setInterval(() => {
  const now = Date.now();
  requestCounters.forEach((counter, key) => {
    if (counter.resetAt <= now) {
      requestCounters.delete(key);
    }
  });
}, Math.max(30_000, Math.floor(rateLimitWindowMs))).unref();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS blocked')); 
    },
  })
);
app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizePolicy = (raw: unknown): SelectionPolicy => {
  const object = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const typeTargetsRaw =
    object.typeTargets && typeof object.typeTargets === 'object'
      ? (object.typeTargets as Record<string, unknown>)
      : {};
  const lessonIds = Array.isArray(object.lessonIds)
    ? Array.from(
        new Set(
          object.lessonIds
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 0)
        )
      )
    : undefined;

  return {
    totalCount: clamp(Number(object.totalCount ?? 20), 1, 100),
    minGap: clamp(Number(object.minGap ?? 30), 0, 10_000),
    typeTargets: {
      mcq: Number(typeTargetsRaw.mcq ?? 12),
      truefalse: Number(typeTargetsRaw.truefalse ?? 4),
      match: Number(typeTargetsRaw.match ?? 4),
    },
    lessonIds: lessonIds && lessonIds.length > 0 ? lessonIds : undefined,
  };
};

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'bazi-quiz-api' });
});

app.post('/api/inquiries', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;

  const body = request.body ?? {};
  const inquiryType = body.inquiryType === 'personal_case' ? 'personal_case' : body.inquiryType === 'concept' ? 'concept' : 'invalid';

  try {
    const result = mailbox.submit({
      inquiryType: inquiryType as 'concept' | 'personal_case',
      category: typeof body.category === 'string' ? body.category : '',
      body: typeof body.body === 'string' ? body.body : '',
      personalCase: body.personalCase,
      disclosureAccepted: body.disclosureAccepted === true,
      personalCaseConsentAccepted: body.personalCaseConsentAccepted === true,
      clientFingerprint: request.ip || 'unknown',
    });

    response.status(201).json({
      ok: true,
      publicId: result.publicId,
      accessCode: result.accessCode,
      replyDueAt: result.replyDueAt,
      expiresAt: result.expiresAt,
      createdAt: result.createdAt,
    });
  } catch (error) {
    sendMailboxError(response, error);
  }
});

app.post('/api/inquiries/:publicId/access', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  const accessCode = typeof request.body?.accessCode === 'string' ? request.body.accessCode : '';

  try {
    const inquiry = mailbox.getByAccessCode(request.params.publicId, accessCode);
    if (!inquiry) {
      response.status(404).json({ message: 'This link is invalid or has expired.' });
      return;
    }

    response.json({ ok: true, inquiry, requiredReplyDisclosure: REQUIRED_REPLY_DISCLOSURE });
  } catch (error) {
    sendMailboxError(response, error);
  }
});

app.post('/api/inquiries/:publicId/delete', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  const accessCode = typeof request.body?.accessCode === 'string' ? request.body.accessCode : '';

  try {
    const deleted = mailbox.deleteByAccessCode(request.params.publicId, accessCode);
    if (!deleted) {
      response.status(404).json({ message: 'This link is invalid or has expired.' });
      return;
    }

    response.status(204).send();
  } catch (error) {
    sendMailboxError(response, error);
  }
});

app.get('/api/admin/inquiries', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  if (!mailbox.verifyAdminToken(getHeaderToken(request, 'x-mailbox-admin-token'))) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const statusValue = typeof request.query.status === 'string' ? request.query.status : undefined;
  if (statusValue && !isInquiryStatus(statusValue)) {
    response.status(400).json({ message: 'Invalid inquiry status' });
    return;
  }

  const status: InquiryStatus | undefined = statusValue && isInquiryStatus(statusValue) ? statusValue : undefined;
  response.json({ ok: true, inquiries: mailbox.listAdmin(status) });
});

app.get('/api/admin/inquiries/:id', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  if (!mailbox.verifyAdminToken(getHeaderToken(request, 'x-mailbox-admin-token'))) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const inquiry = mailbox.getAdminInquiry(request.params.id);
  if (!inquiry) {
    response.status(404).json({ message: 'Not found' });
    return;
  }
  response.json({ ok: true, inquiry, requiredReplyDisclosure: REQUIRED_REPLY_DISCLOSURE });
});

app.post('/api/admin/inquiries/:id/review', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  if (!mailbox.verifyAdminToken(getHeaderToken(request, 'x-mailbox-admin-token'))) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const inquiry = mailbox.markReviewing(request.params.id);
  if (!inquiry) {
    response.status(404).json({ message: 'Not found' });
    return;
  }
  response.json({ ok: true, inquiry });
});

app.post('/api/admin/inquiries/:id/reply', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  if (!mailbox.verifyAdminToken(getHeaderToken(request, 'x-mailbox-admin-token'))) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const inquiry = mailbox.reply(request.params.id, typeof request.body?.body === 'string' ? request.body.body : '');
    if (!inquiry) {
      response.status(404).json({ message: 'Not found' });
      return;
    }
    response.json({ ok: true, inquiry, requiredReplyDisclosure: REQUIRED_REPLY_DISCLOSURE });
  } catch (error) {
    sendMailboxError(response, error);
  }
});

app.post('/api/admin/inquiries/:id/decline', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  if (!mailbox.verifyAdminToken(getHeaderToken(request, 'x-mailbox-admin-token'))) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const reason = request.body?.reason;
  if (!isDeclineReason(reason)) {
    response.status(400).json({ message: 'Invalid decline reason' });
    return;
  }

  try {
    const inquiry = mailbox.decline(request.params.id, reason);
    if (!inquiry) {
      response.status(404).json({ message: 'Not found' });
      return;
    }
    response.json({ ok: true, inquiry });
  } catch (error) {
    sendMailboxError(response, error);
  }
});

app.post('/api/internal/mailbox/maintenance', (request, response) => {
  const mailbox = getMailboxService(response);
  if (!mailbox) return;
  if (!mailbox.verifyMaintenanceToken(getHeaderToken(request, 'x-mailbox-maintenance-token'))) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  response.json({ ok: true, maintenance: mailbox.runMaintenance() });
});

app.get('/api/security-status', (_request, response) => {
  if (!securityStatusEnabled) {
    response.status(404).json({ message: 'Not found' });
    return;
  }

  response.json({
    ok: true,
    security: {
      apiHost: API_HOST,
      trustProxy: trustProxyValue,
      corsOriginsCount: allowedOrigins.length,
      rateLimitWindowMs,
      rateLimitMaxRequests,
      securityStatusEnabled,
    },
  });
});

app.get('/api/analytics/summary', (request, response) => {
  const userIdQuery = typeof request.query.userId === 'string' ? request.query.userId.trim() : '';
  const userId = userIdQuery.length > 0 ? userIdQuery : undefined;
  const cacheKey = `summary::${userId ?? 'all'}`;
  const cached = getCachedAnalytics<{ ok: true; userId: string | null; summary: ReturnType<typeof loadAnalyticsSummary> }>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  const payload = {
    ok: true as const,
    userId: userId ?? null,
    summary: loadAnalyticsSummary(db, userId),
  };

  setCachedAnalytics(cacheKey, payload);

  response.json(payload);
});

app.get('/api/analytics/lessons', (request, response) => {
  const userIdQuery = typeof request.query.userId === 'string' ? request.query.userId.trim() : '';
  const userId = userIdQuery.length > 0 ? userIdQuery : undefined;
  const cacheKey = `lessons::${userId ?? 'all'}`;
  const cached = getCachedAnalytics<{ ok: true; userId: string | null; lessons: ReturnType<typeof loadLessonAnalytics> }>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  const payload = {
    ok: true as const,
    userId: userId ?? null,
    lessons: loadLessonAnalytics(db, userId),
  };

  setCachedAnalytics(cacheKey, payload);

  response.json(payload);
});

app.get('/api/analytics/questions', (request, response) => {
  const userIdQuery = typeof request.query.userId === 'string' ? request.query.userId.trim() : '';
  const userId = userIdQuery.length > 0 ? userIdQuery : undefined;
  const cacheKey = `questions::${userId ?? 'all'}`;
  const cached = getCachedAnalytics<{ ok: true; userId: string | null; questions: ReturnType<typeof loadQuestionAnalytics> }>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  const payload = {
    ok: true as const,
    userId: userId ?? null,
    questions: loadQuestionAnalytics(db, userId),
  };

  setCachedAnalytics(cacheKey, payload);

  response.json(payload);
});

app.get('/api/analytics/alerts', (request, response) => {
  const userIdQuery = typeof request.query.userId === 'string' ? request.query.userId.trim() : '';
  const userId = userIdQuery.length > 0 ? userIdQuery : undefined;
  const weakAccuracyThreshold = clamp(Number(request.query.weakAccuracyThreshold ?? 60), 0, 100);
  const weakAttemptsThreshold = clamp(Number(request.query.weakAttemptsThreshold ?? 8), 1, 10_000);
  const overusedExposureThreshold = clamp(Number(request.query.overusedExposureThreshold ?? 40), 1, 1_000_000);
  const cacheKey = `alerts::${userId ?? 'all'}::${weakAccuracyThreshold}::${weakAttemptsThreshold}::${overusedExposureThreshold}`;
  const cached = getCachedAnalytics<{
    ok: true;
    userId: string | null;
    thresholds: {
      weakAccuracyThreshold: number;
      weakAttemptsThreshold: number;
      overusedExposureThreshold: number;
    };
    alerts: ReturnType<typeof loadAnalyticsAlerts>;
  }>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  const payload = {
    ok: true as const,
    userId: userId ?? null,
    thresholds: {
      weakAccuracyThreshold,
      weakAttemptsThreshold,
      overusedExposureThreshold,
    },
    alerts: loadAnalyticsAlerts(db, {
      userId,
      weakAccuracyThreshold,
      weakAttemptsThreshold,
      overusedExposureThreshold,
    }),
  };

  setCachedAnalytics(cacheKey, payload);

  response.json(payload);
});

app.post('/api/quiz/sessions', (request, response) => {
  const userId = typeof request.body?.userId === 'string' && request.body.userId.trim()
    ? request.body.userId.trim()
    : 'guest';
  const policy = normalizePolicy(request.body?.policy);
  const seed =
    typeof request.body?.seed === 'string' && request.body.seed.trim()
      ? request.body.seed.trim()
      : `${Date.now()}-${Math.random()}`;

  const questions = loadActiveQuestions(db)
    .filter((row) => !policy.lessonIds || policy.lessonIds.includes(row.lesson_id))
    .map((row) => ({
    id: row.id,
    lessonId: row.lesson_id,
    type: row.type,
    difficulty: row.difficulty,
    status: row.status,
    }));

  const exposures = loadExposureRows(db, userId);
  const cursor = exposures.reduce((maxCursor, row) => Math.max(maxCursor, row.lastSeenCursor), 0);
  const exposureState = createExposureState(exposures, cursor);

  const session = selectQuestionSession({
    questions,
    exposureState,
    policy,
    rng: createSeededRng(seed),
  });

  const nextExposure = applyExposureForSelection({
    exposureState,
    selectedQuestionIds: session.selectedQuestionIds,
  });

  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  insertSession(db, {
    sessionId,
    userId,
    seed,
    policyVersion: 'v1',
    createdAt,
  });
  insertSessionQuestions(db, sessionId, session.selectedQuestionIds);
  upsertExposureRows(db, userId, Object.values(nextExposure.exposures));
  clearAnalyticsCache();

  const questionsPayload = buildSessionQuestionPayload(db, session.selectedQuestionIds, false);

  response.status(201).json({
    sessionId,
    userId,
    policy,
    selectedByType: session.selectedByType,
    totalQuestions: questionsPayload.length,
    questions: questionsPayload,
    createdAt,
  });
});

app.get('/api/quiz/sessions/:sessionId', (request, response) => {
  const sessionId = request.params.sessionId;
  const includeAnswers = request.query.includeAnswers === '1';
  const questionIds = loadSessionQuestionIds(db, sessionId);

  if (questionIds.length === 0) {
    response.status(404).json({ message: 'Session not found' });
    return;
  }

  response.json({
    sessionId,
    questions: buildSessionQuestionPayload(db, questionIds, includeAnswers),
  });
});

app.post('/api/quiz/sessions/:sessionId/attempts', (request, response) => {
  const sessionId = request.params.sessionId;
  const attemptsRaw: unknown[] = Array.isArray(request.body?.attempts) ? request.body.attempts : [];

  if (attemptsRaw.length === 0) {
    response.status(400).json({ message: 'attempts is required' });
    return;
  }

  const attempts = attemptsRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const typed = item as Record<string, unknown>;
      if (typeof typed.questionId !== 'string') return null;
      if (typeof typed.isCorrect !== 'boolean') return null;

      const responseMs =
        typeof typed.responseMs === 'number' && Number.isFinite(typed.responseMs)
          ? Math.max(0, Math.round(typed.responseMs))
          : null;

      return {
        questionId: typed.questionId,
        isCorrect: typed.isCorrect,
        responseMs,
      };
    })
    .filter((item): item is { questionId: string; isCorrect: boolean; responseMs: number | null } => item !== null);

  if (attempts.length === 0) {
    response.status(400).json({ message: 'No valid attempts provided' });
    return;
  }

  insertAttempts(db, {
    sessionId,
    attempts,
    answeredAt: new Date().toISOString(),
  });
  clearAnalyticsCache();

  response.status(201).json({
    sessionId,
    savedAttempts: attempts.length,
    correctCount: attempts.filter((attempt) => attempt.isCorrect).length,
  });
});

app.listen(API_PORT, API_HOST, () => {
  console.log(`[bazi-quiz-api] listening on http://${API_HOST}:${API_PORT}`);
});
