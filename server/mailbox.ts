/**
 * Style: Private mailbox backend for the 「封緘研習信箱」 UI.
 * Stores no name or contact field, hashes access codes, and encrypts personal-case data.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import type Database from 'better-sqlite3';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERSONAL_CASE_EXPIRY_DAYS = 14;
const PERSONAL_CASE_ANSWER_EXPIRY_DAYS = 30;
const CONCEPT_EXPIRY_DAYS = 30;
const CONCEPT_ANSWER_EXPIRY_DAYS = 90;
const DISCLOSURE_VERSION = 'mailbox-disclosure-v1';

export type InquiryType = 'concept' | 'personal_case';
export type InquiryStatus = 'received' | 'reviewing' | 'replied' | 'declined';
export type DeclineReason = 'sensitive_data' | 'out_of_scope' | 'safety' | 'capacity';

export type PersonalCase = {
  calendar: 'solar' | 'lunar';
  birthDate: string;
  birthTime: string | null;
  timeUncertain: boolean;
  timezone: string;
  calculationSex: 'male' | 'female' | null;
};

export type MailboxConfig = {
  accessCodePepper: string;
  encryptionSecret: string;
  adminToken: string;
  maintenanceToken: string;
  submissionWindowMs: number;
  submissionMax: number;
};

export class MailboxValidationError extends Error {}
export class MailboxRateLimitError extends Error {}
export class MailboxConfigurationError extends Error {}

type InquiryRow = {
  id: string;
  public_id: string;
  access_code_hash: string;
  inquiry_type: InquiryType;
  category: string;
  body: string;
  personal_case_ciphertext: string | null;
  consent_version: string;
  status: InquiryStatus;
  decline_reason: DeclineReason | null;
  reply_due_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  answered_at: string | null;
  read_at: string | null;
  answer_body: string | null;
  answer_created_at: string | null;
};

type InquiryPreviewRow = Pick<
  InquiryRow,
  'id' | 'public_id' | 'inquiry_type' | 'category' | 'status' | 'reply_due_at' | 'expires_at' | 'created_at' | 'read_at'
> & { body_preview: string };

export type SubmitInquiryInput = {
  inquiryType: InquiryType;
  category: string;
  body: string;
  personalCase?: unknown;
  disclosureAccepted: boolean;
  personalCaseConsentAccepted?: boolean;
  clientFingerprint: string;
  now?: Date;
};

export type MailboxInquiry = {
  publicId: string;
  inquiryType: InquiryType;
  category: string;
  body: string;
  personalCase: PersonalCase | null;
  status: InquiryStatus;
  statusMessage: string;
  replyDueAt: string;
  expiresAt: string;
  createdAt: string;
  answeredAt: string | null;
  readAt: string | null;
  answer: string | null;
  answerCreatedAt: string | null;
  isOverdue: boolean;
};

const MAILBOX_SCHEMA = `
CREATE TABLE IF NOT EXISTS mailbox_inquiries (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  access_code_hash TEXT NOT NULL UNIQUE,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('concept', 'personal_case')),
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  personal_case_ciphertext TEXT,
  consent_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('received', 'reviewing', 'replied', 'declined')),
  decline_reason TEXT,
  reply_due_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  answered_at TEXT,
  read_at TEXT
);
CREATE TABLE IF NOT EXISTS mailbox_answers (
  inquiry_id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  answered_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (inquiry_id) REFERENCES mailbox_inquiries (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS mailbox_audit_events (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (inquiry_id) REFERENCES mailbox_inquiries (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS mailbox_rate_limits (
  key_hash TEXT PRIMARY KEY,
  window_started_at TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mailbox_inquiries_status_due ON mailbox_inquiries (status, reply_due_at);
CREATE INDEX IF NOT EXISTS idx_mailbox_inquiries_expiry ON mailbox_inquiries (expires_at);
CREATE INDEX IF NOT EXISTS idx_mailbox_rate_limits_expiry ON mailbox_rate_limits (expires_at);
`;

const DECLINE_MESSAGES: Record<DeclineReason, string> = {
  sensitive_data: '請移除可識別資料後，以一般化方式重新提交。',
  out_of_scope: '此信箱只處理八字學習與個人命例的判讀思路，未能處理本次問題。',
  safety: '此問題需要更合適的即時或專業支援，因此未能以命理解答處理。',
  capacity: '目前未能在服務時限內妥善處理本次問題，敬請見諒。',
};

const STATUS_MESSAGES: Record<InquiryStatus, string> = {
  received: '問題已安全收件，等待真人審核。',
  reviewing: '真人正在整理回覆。',
  replied: '真人回覆已準備好。',
  declined: '此問題目前未能處理。',
};

export const REQUIRED_REPLY_DISCLOSURE =
  '免責聲明：八字及其他玄學屬傳統文化與詮釋性觀點，並非精密科學，也不能保證預測結果。本回覆由真人按你提供的有限資料作出，只供學習及參考。請勿過份迷信，亦不要把它作為醫療、心理健康、法律、投資、婚姻、職業、教育或其他重大人生決定的唯一或主要依據；需要時請向合資格專業人士尋求協助。';

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const addCalendarDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

export const addBusinessDays = (date: Date, days: number) => {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setUTCDate(result.getUTCDate() + 1);
    const weekday = result.getUTCDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return result;
};

const safeEquals = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
};

const normalizeAccessCode = (value: string) => value.trim().replace(/\s+/g, '');

const deriveEncryptionKey = (secret: string) => createHash('sha256').update(secret, 'utf8').digest();

const encryptPersonalCase = (personalCase: PersonalCase, secret: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(personalCase), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');
};

const decryptPersonalCase = (ciphertext: string, secret: string): PersonalCase => {
  const [ivRaw, tagRaw, encryptedRaw] = ciphertext.split('.');
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new MailboxConfigurationError('Invalid personal-case ciphertext');
  const decipher = createDecipheriv('aes-256-gcm', deriveEncryptionKey(secret), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8');
  const parsed = JSON.parse(plaintext) as unknown;
  return parsePersonalCase(parsed);
};

const parsePersonalCase = (value: unknown): PersonalCase => {
  if (!isRecord(value)) throw new MailboxValidationError('Personal case details are required');

  const calendar = value.calendar;
  const birthDate = typeof value.birthDate === 'string' ? value.birthDate.trim() : '';
  const birthTime = typeof value.birthTime === 'string' && value.birthTime.trim() ? value.birthTime.trim() : null;
  const timeUncertain = value.timeUncertain === true;
  const timezone = typeof value.timezone === 'string' ? value.timezone.trim() : '';
  const calculationSex = value.calculationSex === 'male' || value.calculationSex === 'female' ? value.calculationSex : null;

  if (calendar !== 'solar' && calendar !== 'lunar') throw new MailboxValidationError('Invalid calendar');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new MailboxValidationError('Invalid birth date');
  if (birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) throw new MailboxValidationError('Invalid birth time');
  if (!timezone || timezone.length > 64 || !/^[A-Za-z_+\-/0-9]+$/.test(timezone)) throw new MailboxValidationError('Invalid timezone');

  return { calendar, birthDate, birthTime, timeUncertain, timezone, calculationSex };
};

const validateInput = (input: SubmitInquiryInput) => {
  if (input.inquiryType !== 'concept' && input.inquiryType !== 'personal_case') throw new MailboxValidationError('Invalid inquiry type');
  const category = input.category.trim();
  const body = input.body.trim();
  if (!['course', 'calculation', 'personal_case', 'other'].includes(category)) throw new MailboxValidationError('Invalid category');
  if (body.length < 8 || body.length > 1200) throw new MailboxValidationError('Question must be between 8 and 1200 characters');
  if (!input.disclosureAccepted) throw new MailboxValidationError('Disclosure acceptance is required');
  if (!input.clientFingerprint.trim()) throw new MailboxValidationError('Missing submission identifier');

  if (input.inquiryType === 'personal_case') {
    if (!input.personalCaseConsentAccepted) throw new MailboxValidationError('Personal-case consent is required');
    return { category, body, personalCase: parsePersonalCase(input.personalCase) };
  }

  return { category, body, personalCase: null };
};

const mapInquiry = (row: InquiryRow, config: MailboxConfig, now: Date): MailboxInquiry => ({
  publicId: row.public_id,
  inquiryType: row.inquiry_type,
  category: row.category,
  body: row.body,
  personalCase: row.personal_case_ciphertext ? decryptPersonalCase(row.personal_case_ciphertext, config.encryptionSecret) : null,
  status: row.status,
  statusMessage: row.status === 'declined' && row.decline_reason ? DECLINE_MESSAGES[row.decline_reason] : STATUS_MESSAGES[row.status],
  replyDueAt: row.reply_due_at,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  answeredAt: row.answered_at,
  readAt: row.read_at,
  answer: row.answer_body,
  answerCreatedAt: row.answer_created_at,
  isOverdue: ['received', 'reviewing'].includes(row.status) && new Date(row.reply_due_at).getTime() < now.getTime(),
});

const selectInquiryBy = (db: Database.Database, clause: 'public_id' | 'access_code_hash' | 'id', value: string) =>
  db
    .prepare(
      `SELECT i.*, a.body AS answer_body, a.created_at AS answer_created_at
       FROM mailbox_inquiries i
       LEFT JOIN mailbox_answers a ON a.inquiry_id = i.id
       WHERE i.${clause} = ?`
    )
    .get(value) as InquiryRow | undefined;

const createPublicId = (db: Database.Database) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const publicId = `Q-${randomBytes(4).toString('hex').toUpperCase()}`;
    const existing = db.prepare('SELECT 1 FROM mailbox_inquiries WHERE public_id = ?').get(publicId);
    if (!existing) return publicId;
  }
  throw new MailboxConfigurationError('Could not generate a unique public ID');
};

const createAccessCode = () => `PK-${randomBytes(24).toString('base64url')}`;

const expirationFor = (inquiryType: InquiryType, status: InquiryStatus, now: Date) => {
  if (status === 'replied') return addCalendarDays(now, inquiryType === 'personal_case' ? PERSONAL_CASE_ANSWER_EXPIRY_DAYS : CONCEPT_ANSWER_EXPIRY_DAYS);
  return addCalendarDays(now, inquiryType === 'personal_case' ? PERSONAL_CASE_EXPIRY_DAYS : CONCEPT_EXPIRY_DAYS);
};

export const ensureMailboxSchema = (db: Database.Database) => db.exec(MAILBOX_SCHEMA);

export const loadMailboxConfig = (environment: NodeJS.ProcessEnv = process.env): MailboxConfig => {
  const accessCodePepper = environment.MAILBOX_ACCESS_CODE_PEPPER?.trim() ?? '';
  const encryptionSecret = environment.MAILBOX_ENCRYPTION_SECRET?.trim() ?? '';
  const adminToken = environment.MAILBOX_ADMIN_TOKEN?.trim() ?? '';
  const maintenanceToken = environment.MAILBOX_MAINTENANCE_TOKEN?.trim() ?? '';
  if ([accessCodePepper, encryptionSecret, adminToken, maintenanceToken].some((value) => value.length < 32)) {
    throw new MailboxConfigurationError('Mailbox security secrets are not configured');
  }

  const submissionWindowMs = Math.max(60_000, Number(environment.MAILBOX_SUBMISSION_WINDOW_MS ?? DAY_MS));
  const submissionMax = Math.max(1, Math.min(20, Number(environment.MAILBOX_SUBMISSION_MAX ?? 3)));
  return { accessCodePepper, encryptionSecret, adminToken, maintenanceToken, submissionWindowMs, submissionMax };
};

export const createMailboxService = (db: Database.Database, config: MailboxConfig) => {
  const hashWithPepper = (value: string) => createHmac('sha256', config.accessCodePepper).update(value).digest('base64url');
  const addAudit = (inquiryId: string, actorId: string, action: string, now: Date) => {
    db.prepare('INSERT INTO mailbox_audit_events (id, inquiry_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)').run(
      randomUUID(),
      inquiryId,
      actorId,
      action,
      now.toISOString()
    );
  };

  const consumeSubmissionLimit = (clientFingerprint: string, now: Date) => {
    const keyHash = hashWithPepper(`submission:${clientFingerprint}`);
    const existing = db
      .prepare('SELECT key_hash, window_started_at, request_count, expires_at FROM mailbox_rate_limits WHERE key_hash = ?')
      .get(keyHash) as { key_hash: string; window_started_at: string; request_count: number; expires_at: string } | undefined;
    const expiresAt = new Date(now.getTime() + config.submissionWindowMs).toISOString();

    if (!existing || new Date(existing.expires_at).getTime() <= now.getTime()) {
      db.prepare('INSERT OR REPLACE INTO mailbox_rate_limits (key_hash, window_started_at, request_count, expires_at) VALUES (?, ?, ?, ?)').run(
        keyHash,
        now.toISOString(),
        1,
        expiresAt
      );
      return;
    }

    if (existing.request_count >= config.submissionMax) throw new MailboxRateLimitError('Too many private mailbox submissions');
    db.prepare('UPDATE mailbox_rate_limits SET request_count = request_count + 1 WHERE key_hash = ?').run(keyHash);
  };

  const runMaintenance = (now = new Date()) => {
    const nowIso = now.toISOString();
    const deletedInquiries = db.prepare('DELETE FROM mailbox_inquiries WHERE expires_at <= ?').run(nowIso).changes;
    const deletedRateLimits = db.prepare('DELETE FROM mailbox_rate_limits WHERE expires_at <= ?').run(nowIso).changes;
    return { deletedInquiries, deletedRateLimits, ranAt: nowIso };
  };

  const submit = (input: SubmitInquiryInput) => {
    const now = input.now ?? new Date();
    const validated = validateInput(input);
    runMaintenance(now);
    consumeSubmissionLimit(input.clientFingerprint, now);

    const id = randomUUID();
    const publicId = createPublicId(db);
    const accessCode = createAccessCode();
    const createdAt = now.toISOString();
    const replyDueAt = addBusinessDays(now, 7).toISOString();
    const expiresAt = expirationFor(input.inquiryType, 'received', now).toISOString();
    const personalCaseCiphertext = validated.personalCase ? encryptPersonalCase(validated.personalCase, config.encryptionSecret) : null;

    const write = db.transaction(() => {
      db.prepare(
        `INSERT INTO mailbox_inquiries (
          id, public_id, access_code_hash, inquiry_type, category, body, personal_case_ciphertext,
          consent_version, status, decline_reason, reply_due_at, expires_at, created_at, updated_at, answered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', NULL, ?, ?, ?, ?, NULL)`
      ).run(
        id,
        publicId,
        hashWithPepper(normalizeAccessCode(accessCode)),
        input.inquiryType,
        validated.category,
        validated.body,
        personalCaseCiphertext,
        DISCLOSURE_VERSION,
        replyDueAt,
        expiresAt,
        createdAt,
        createdAt
      );
      addAudit(id, 'anonymous', 'submitted', now);
    });
    write();

    return { publicId, accessCode, replyDueAt, expiresAt, createdAt };
  };

  const getByAccessCode = (publicId: string, accessCode: string, now = new Date()) => {
    runMaintenance(now);
    const row = selectInquiryBy(db, 'public_id', publicId.trim());
    if (!row || !safeEquals(row.access_code_hash, hashWithPepper(normalizeAccessCode(accessCode)))) return null;
    if (row.status === 'replied' && row.read_at === null) {
      const readAt = now.toISOString();
      db.prepare('UPDATE mailbox_inquiries SET read_at = ?, updated_at = ? WHERE id = ?').run(readAt, readAt, row.id);
      row.read_at = readAt;
    }
    return mapInquiry(row, config, now);
  };

  const deleteByAccessCode = (publicId: string, accessCode: string, now = new Date()) => {
    const row = selectInquiryBy(db, 'public_id', publicId.trim());
    if (!row || !safeEquals(row.access_code_hash, hashWithPepper(normalizeAccessCode(accessCode)))) return false;
    const remove = db.transaction(() => {
      addAudit(row.id, 'anonymous', 'deleted_by_holder', now);
      db.prepare('DELETE FROM mailbox_inquiries WHERE id = ?').run(row.id);
    });
    remove();
    return true;
  };

  const listAdmin = (status?: InquiryStatus, now = new Date()) => {
    runMaintenance(now);
    const baseSql = `SELECT id, public_id, inquiry_type, category, status, reply_due_at, expires_at, created_at, read_at,
      substr(body, 1, 180) AS body_preview FROM mailbox_inquiries`;
    const rows = status
      ? (db.prepare(`${baseSql} WHERE status = ? ORDER BY created_at ASC`).all(status) as InquiryPreviewRow[])
      : (db.prepare(`${baseSql} ORDER BY created_at ASC`).all() as InquiryPreviewRow[]);

    return rows.map((row) => ({
      id: row.id,
      publicId: row.public_id,
      inquiryType: row.inquiry_type,
      category: row.category,
      status: row.status,
      preview: row.body_preview,
      createdAt: row.created_at,
      replyDueAt: row.reply_due_at,
      expiresAt: row.expires_at,
      readAt: row.read_at,
      isOverdue: ['received', 'reviewing'].includes(row.status) && new Date(row.reply_due_at).getTime() < now.getTime(),
    }));
  };

  const getAdminInquiry = (id: string, now = new Date()) => {
    runMaintenance(now);
    const row = selectInquiryBy(db, 'id', id);
    return row ? mapInquiry(row, config, now) : null;
  };

  const markReviewing = (id: string, now = new Date()) => {
    const row = selectInquiryBy(db, 'id', id);
    if (!row) return null;
    if (row.status === 'received') {
      db.prepare('UPDATE mailbox_inquiries SET status = ?, updated_at = ? WHERE id = ?').run('reviewing', now.toISOString(), id);
      addAudit(id, 'owner', 'review_started', now);
    }
    return getAdminInquiry(id, now);
  };

  const reply = (id: string, body: string, now = new Date()) => {
    const answer = body.trim();
    if (answer.length < 20 || answer.length > 5000) throw new MailboxValidationError('Reply must be between 20 and 5000 characters');
    const row = selectInquiryBy(db, 'id', id);
    if (!row) return null;
    if (row.status === 'declined') throw new MailboxValidationError('Declined inquiries cannot receive a reply');
    const nowIso = now.toISOString();
    const expiresAt = expirationFor(row.inquiry_type, 'replied', now).toISOString();
    const write = db.transaction(() => {
      db.prepare(
        `INSERT INTO mailbox_answers (inquiry_id, body, answered_by, created_at, updated_at)
         VALUES (?, ?, 'owner', ?, ?)
         ON CONFLICT(inquiry_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`
      ).run(id, answer, nowIso, nowIso);
      db.prepare(
        'UPDATE mailbox_inquiries SET status = ?, expires_at = ?, updated_at = ?, answered_at = ?, read_at = NULL WHERE id = ?'
      ).run('replied', expiresAt, nowIso, nowIso, id);
      addAudit(id, 'owner', 'replied', now);
    });
    write();
    return getAdminInquiry(id, now);
  };

  const decline = (id: string, reason: DeclineReason, now = new Date()) => {
    if (!Object.prototype.hasOwnProperty.call(DECLINE_MESSAGES, reason)) {
      throw new MailboxValidationError('Invalid decline reason');
    }
    const row = selectInquiryBy(db, 'id', id);
    if (!row) return null;
    const nowIso = now.toISOString();
    const expiresAt = addCalendarDays(now, 14).toISOString();
    db.prepare(
      'UPDATE mailbox_inquiries SET status = ?, decline_reason = ?, expires_at = ?, updated_at = ?, read_at = NULL WHERE id = ?'
    ).run('declined', reason, expiresAt, nowIso, id);
    addAudit(id, 'owner', `declined:${reason}`, now);
    return getAdminInquiry(id, now);
  };

  return {
    submit,
    getByAccessCode,
    deleteByAccessCode,
    listAdmin,
    getAdminInquiry,
    markReviewing,
    reply,
    decline,
    runMaintenance,
    verifyAdminToken: (token: string) => safeEquals(token, config.adminToken),
    verifyMaintenanceToken: (token: string) => safeEquals(token, config.maintenanceToken),
  };
};
