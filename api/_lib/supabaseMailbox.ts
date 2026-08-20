import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const ACCESS_CODE_BYTES = 18;
const ACCESS_CODE_PREFIX = 'Q-';
const MAX_QUESTION_LENGTH = 1200;
const REPLY_RETENTION_DAYS = { concept: 90, personal_case: 30 } as const;
const UNANSWERED_RETENTION_DAYS = { concept: 30, personal_case: 14 } as const;

export const REQUIRED_REPLY_DISCLOSURE =
  '免責聲明：八字及其他玄學屬傳統文化與詮釋性觀點，並非精密科學，也不能保證預測結果。本回覆由真人按你提供的有限資料作出，只供學習及參考。請勿過份迷信，亦不要把它作為醫療、心理健康、法律、投資、婚姻、職業、教育或其他重大人生決定的唯一或主要依據；需要時請向合資格專業人士尋求協助。';

type InquiryType = 'concept' | 'personal_case';
type InquiryStatus = 'received' | 'reviewing' | 'replied' | 'declined';
type DeclineReason = 'sensitive_data' | 'out_of_scope' | 'safety' | 'capacity';
type InquiryCategory = 'course' | 'calculation' | 'personal_case' | 'other';

type PersonalCase = {
  calendar: 'solar' | 'lunar';
  birthDate: string;
  birthTime: string | null;
  timeUncertain: boolean;
  timezone: string;
  calculationSex: 'male' | 'female' | null;
};

type SupabaseMailboxConfig = {
  supabaseUrl: string;
  supabaseSecretKey: string;
  accessCodePepper: string;
  encryptionSecret: string;
  submissionWindowMs: number;
  submissionMax: number;
};

type DatabaseInquiry = {
  id: string;
  public_id: string;
  inquiry_type: InquiryType;
  category: InquiryCategory;
  body: string;
  personal_case_ciphertext: string | null;
  status: InquiryStatus;
  decline_reason: DeclineReason | null;
  reply_due_at: string;
  expires_at: string;
  created_at: string;
  answered_at: string | null;
  mailbox_answers?: { body: string; created_at: string }[] | null;
};

export class MailboxValidationError extends Error {}
export class MailboxAuthorizationError extends Error {}

const requireEnvironment = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const loadSupabaseMailboxConfig = (): SupabaseMailboxConfig => ({
  supabaseUrl: requireEnvironment('SUPABASE_URL'),
  supabaseSecretKey: requireEnvironment('SUPABASE_SECRET_KEY'),
  accessCodePepper: requireEnvironment('MAILBOX_ACCESS_CODE_PEPPER'),
  encryptionSecret: requireEnvironment('MAILBOX_ENCRYPTION_SECRET'),
  submissionWindowMs: Number(process.env.MAILBOX_SUBMISSION_WINDOW_MS ?? 86_400_000),
  submissionMax: Number(process.env.MAILBOX_SUBMISSION_MAX ?? 3),
});

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const addBusinessDays = (date: Date, businessDays: number) => {
  const result = new Date(date);
  let remaining = businessDays;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const weekday = result.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizePersonalCase = (value: unknown): PersonalCase => {
  if (!isRecord(value)) throw new MailboxValidationError('Personal case details are required');
  const calendar = value.calendar;
  const birthDate = value.birthDate;
  const birthTime = value.birthTime;
  const timeUncertain = value.timeUncertain;
  const timezone = value.timezone;
  const calculationSex = value.calculationSex;

  if (calendar !== 'solar' && calendar !== 'lunar') throw new MailboxValidationError('Invalid calendar');
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new MailboxValidationError('Birth date must use YYYY-MM-DD');
  }
  if (birthTime !== null && (typeof birthTime !== 'string' || !/^\d{2}:\d{2}$/.test(birthTime))) {
    throw new MailboxValidationError('Birth time must use HH:MM or be omitted');
  }
  if (typeof timeUncertain !== 'boolean') throw new MailboxValidationError('Time certainty is required');
  if (typeof timezone !== 'string' || timezone.length < 2 || timezone.length > 64) {
    throw new MailboxValidationError('Timezone is required');
  }
  if (calculationSex !== null && calculationSex !== 'male' && calculationSex !== 'female') {
    throw new MailboxValidationError('Invalid calculation sex');
  }

  return { calendar, birthDate, birthTime, timeUncertain, timezone, calculationSex };
};

const normalizeQuestion = (value: unknown) => {
  if (typeof value !== 'string') throw new MailboxValidationError('Question is required');
  const question = value.trim();
  if (question.length < 8 || question.length > MAX_QUESTION_LENGTH) {
    throw new MailboxValidationError(`Question must be between 8 and ${MAX_QUESTION_LENGTH} characters`);
  }
  return question;
};

const normalizeCategory = (value: unknown, inquiryType: InquiryType): InquiryCategory => {
  if (inquiryType === 'personal_case') return 'personal_case';
  if (value === 'course' || value === 'calculation' || value === 'other') return value;
  throw new MailboxValidationError('Select a valid question category');
};

const secretKey = (secret: string) => createHmac('sha256', 'bazi-mailbox-encryption').update(secret).digest();

const encryptCase = (personalCase: PersonalCase, secret: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(personalCase), 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
};

const decryptCase = (ciphertext: string, secret: string): PersonalCase => {
  const [ivValue, tagValue, encryptedValue] = ciphertext.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new MailboxValidationError('Encrypted personal case is invalid');
  const decipher = createDecipheriv('aes-256-gcm', secretKey(secret), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  const plain = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]);
  return normalizePersonalCase(JSON.parse(plain.toString('utf8')));
};

const hashWithPepper = (value: string, pepper: string) => createHmac('sha256', pepper).update(value).digest('hex');

const codesMatch = (candidate: string, expectedHash: string, pepper: string) => {
  const candidateHash = Buffer.from(hashWithPepper(candidate, pepper), 'utf8');
  const expected = Buffer.from(expectedHash, 'utf8');
  return candidateHash.length === expected.length && timingSafeEqual(candidateHash, expected);
};

const makePublicId = () => `${ACCESS_CODE_PREFIX}${randomBytes(4).toString('hex').toUpperCase()}`;
const makeAccessCode = () => randomBytes(ACCESS_CODE_BYTES).toString('base64url');

const answerFromRow = (row: DatabaseInquiry) => (Array.isArray(row.mailbox_answers) ? row.mailbox_answers[0] ?? null : null);

const publicInquiry = (row: DatabaseInquiry, config: SupabaseMailboxConfig, includePersonalCase: boolean) => ({
  publicId: row.public_id,
  inquiryType: row.inquiry_type,
  category: row.category,
  body: row.body,
  personalCase:
    includePersonalCase && row.personal_case_ciphertext ? decryptCase(row.personal_case_ciphertext, config.encryptionSecret) : undefined,
  status: row.status,
  declineReason: row.decline_reason,
  replyDueAt: row.reply_due_at,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  answeredAt: row.answered_at,
  answer: answerFromRow(row)?.body ?? null,
  answerCreatedAt: answerFromRow(row)?.created_at ?? null,
});

export class SupabaseMailboxService {
  private readonly client: SupabaseClient;

  constructor(private readonly config: SupabaseMailboxConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private async audit(inquiryId: string, actorId: string, action: string) {
    const { error } = await this.client.from('mailbox_audit_events').insert({
      inquiry_id: inquiryId,
      actor_id: actorId,
      action,
    });
    if (error) throw error;
  }

  async submit(input: {
    inquiryType: unknown;
    category: unknown;
    body: unknown;
    personalCase: unknown;
    disclosureAccepted: unknown;
    personalCaseConsentAccepted: unknown;
    clientFingerprint: string;
    now?: Date;
  }) {
    const inquiryType: InquiryType = input.inquiryType === 'concept' || input.inquiryType === 'personal_case' ? input.inquiryType : (() => {
      throw new MailboxValidationError('Select a valid inquiry type');
    })();
    if (input.disclosureAccepted !== true) throw new MailboxValidationError('You must accept the disclaimer');
    if (inquiryType === 'personal_case' && input.personalCaseConsentAccepted !== true) {
      throw new MailboxValidationError('Personal-case consent is required');
    }

    const now = input.now ?? new Date();
    const rateLimitKey = hashWithPepper(input.clientFingerprint, this.config.accessCodePepper);
    const { data: priorRate, error: priorRateError } = await this.client
      .from('mailbox_rate_limits')
      .select('*')
      .eq('key_hash', rateLimitKey)
      .maybeSingle();
    if (priorRateError) throw priorRateError;

    const windowStartedAt = new Date(priorRate?.window_started_at ?? 0);
    const rateActive = priorRate && now.getTime() - windowStartedAt.getTime() < this.config.submissionWindowMs;
    if (rateActive && priorRate.request_count >= this.config.submissionMax) {
      throw new MailboxValidationError('Too many submissions. Please try again later.');
    }

    const rateRecord = rateActive
      ? { key_hash: rateLimitKey, window_started_at: priorRate.window_started_at, request_count: priorRate.request_count + 1, expires_at: priorRate.expires_at }
      : {
          key_hash: rateLimitKey,
          window_started_at: now.toISOString(),
          request_count: 1,
          expires_at: addDays(now, 2).toISOString(),
        };
    const { error: rateError } = await this.client.from('mailbox_rate_limits').upsert(rateRecord);
    if (rateError) throw rateError;

    const personalCase = inquiryType === 'personal_case' ? normalizePersonalCase(input.personalCase) : null;
    const accessCode = makeAccessCode();
    const publicId = makePublicId();
    const record = {
      public_id: publicId,
      access_code_hash: hashWithPepper(accessCode, this.config.accessCodePepper),
      inquiry_type: inquiryType,
      category: normalizeCategory(input.category, inquiryType),
      body: normalizeQuestion(input.body),
      personal_case_ciphertext: personalCase ? encryptCase(personalCase, this.config.encryptionSecret) : null,
      consent_version: 'v1.0-2026-08-20',
      reply_due_at: addBusinessDays(now, 7).toISOString(),
      expires_at: addDays(now, UNANSWERED_RETENTION_DAYS[inquiryType]).toISOString(),
    };
    const { data, error } = await this.client.from('mailbox_inquiries').insert(record).select('*').single();
    if (error) throw error;
    await this.audit(data.id, 'anonymous', 'submitted');

    return { ...publicInquiry(data as DatabaseInquiry, this.config, false), accessCode };
  }

  async getByAccessCode(publicId: string, accessCode: string) {
    const { data, error } = await this.client
      .from('mailbox_inquiries')
      .select('*, mailbox_answers(body, created_at)')
      .eq('public_id', publicId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data || !codesMatch(accessCode, data.access_code_hash, this.config.accessCodePepper)) return null;
    return publicInquiry(data as DatabaseInquiry, this.config, true);
  }

  async deleteByAccessCode(publicId: string, accessCode: string) {
    const { data, error } = await this.client
      .from('mailbox_inquiries')
      .select('id, access_code_hash')
      .eq('public_id', publicId)
      .maybeSingle();
    if (error) throw error;
    if (!data || !codesMatch(accessCode, data.access_code_hash, this.config.accessCodePepper)) return false;
    const { error: deleteError } = await this.client.from('mailbox_inquiries').delete().eq('id', data.id);
    if (deleteError) throw deleteError;
    return true;
  }

  async requireAdmin(accessToken: string) {
    if (!accessToken) throw new MailboxAuthorizationError('Missing administrator session');
    const { data: userData, error: userError } = await this.client.auth.getUser(accessToken);
    if (userError || !userData.user) throw new MailboxAuthorizationError('Invalid administrator session');
    const { data: adminData, error: adminError } = await this.client
      .from('mailbox_admins')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (adminError || !adminData) throw new MailboxAuthorizationError('Administrator access is not granted');
    return userData.user.id;
  }

  async listAdmin(status?: InquiryStatus) {
    let query = this.client
      .from('mailbox_inquiries')
      .select('id, public_id, inquiry_type, category, body, status, reply_due_at, expires_at, created_at, answered_at')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getAdminInquiry(id: string) {
    const { data, error } = await this.client
      .from('mailbox_inquiries')
      .select('*, mailbox_answers(body, created_at)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? publicInquiry(data as DatabaseInquiry, this.config, true) : null;
  }

  async markReviewing(id: string, adminId: string) {
    const { data, error } = await this.client
      .from('mailbox_inquiries')
      .update({ status: 'reviewing' })
      .eq('id', id)
      .in('status', ['received', 'reviewing'])
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await this.audit(id, adminId, 'marked_reviewing');
    return publicInquiry(data as DatabaseInquiry, this.config, true);
  }

  async reply(id: string, adminId: string, body: unknown) {
    if (typeof body !== 'string' || body.trim().length < 20 || body.trim().length > 5000) {
      throw new MailboxValidationError('Reply must be between 20 and 5000 characters');
    }
    const current = await this.getAdminInquiry(id);
    if (!current || current.status === 'declined') return null;
    const now = new Date();
    const { error: answerError } = await this.client.from('mailbox_answers').upsert({
      inquiry_id: id,
      body: body.trim(),
      answered_by: adminId,
      updated_at: now.toISOString(),
    });
    if (answerError) throw answerError;
    const { error: inquiryError } = await this.client
      .from('mailbox_inquiries')
      .update({
        status: 'replied',
        answered_at: now.toISOString(),
        expires_at: addDays(now, REPLY_RETENTION_DAYS[current.inquiryType]).toISOString(),
      })
      .eq('id', id);
    if (inquiryError) throw inquiryError;
    await this.audit(id, adminId, 'replied');
    return this.getAdminInquiry(id);
  }

  async decline(id: string, adminId: string, reason: unknown) {
    const reasons: DeclineReason[] = ['sensitive_data', 'out_of_scope', 'safety', 'capacity'];
    if (!reasons.includes(reason as DeclineReason)) throw new MailboxValidationError('Invalid decline reason');
    const { data, error } = await this.client
      .from('mailbox_inquiries')
      .update({ status: 'declined', decline_reason: reason, expires_at: addDays(new Date(), 7).toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await this.audit(id, adminId, `declined:${reason}`);
    return publicInquiry(data as DatabaseInquiry, this.config, true);
  }

  async purgeExpired() {
    const { data, error } = await this.client.rpc('mailbox_purge_expired');
    if (error) throw error;
    return Array.isArray(data) ? data[0] ?? { deleted_inquiries: 0, deleted_rate_limits: 0 } : data;
  }
}

export const createSupabaseMailboxService = () => new SupabaseMailboxService(loadSupabaseMailboxConfig());
