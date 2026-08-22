import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type InquiryType = 'concept' | 'personal_case';
type InquiryStatus = 'received' | 'reviewing' | 'replied' | 'declined';
type DeclineReason = 'sensitive_data' | 'out_of_scope' | 'safety' | 'capacity';
type PersonalCase = { calendar: 'solar' | 'lunar'; birthDate: string; birthTime: string | null; timeUncertain: boolean; timezone: string; calculationSex: 'male' | 'female' | null };
type MailboxAnswer = { body: string; created_at: string };

export const REQUIRED_REPLY_DISCLOSURE =
  '免責聲明：八字及其他玄學屬傳統文化與詮釋性觀點，並非精密科學，也不能保證預測結果。本回覆由真人按你提供的有限資料作出，只供學習及參考。請勿過份迷信，亦不要把它作為醫療、心理健康、法律、投資、婚姻、職業、教育或其他重大人生決定的唯一或主要依據；需要時請向合資格專業人士尋求協助。';

export class MailboxValidationError extends Error {}
export class MailboxAuthorizationError extends Error {}
class MissingMailboxEnvironmentError extends Error {
  constructor(readonly variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
  }
}

const requireEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new MissingMailboxEnvironmentError(name);
  return value;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const addBusinessDays = (date: Date, days: number) => {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (result.getUTCDay() !== 0 && result.getUTCDay() !== 6) remaining -= 1;
  }
  return result;
};

const hash = (value: string, pepper: string) => createHmac('sha256', pepper).update(value).digest('hex');
const deriveMailboxSecret = (rootSecret: string, purpose: string) =>
  createHmac('sha256', rootSecret).update(purpose).digest('hex');
const cryptoKey = (secret: string) => createHmac('sha256', 'bazi-mailbox-encryption').update(secret).digest();

const codesMatch = (candidate: string, expected: string, pepper: string) => {
  const candidateHash = Buffer.from(hash(candidate, pepper));
  const expectedHash = Buffer.from(expected);
  return candidateHash.length === expectedHash.length && timingSafeEqual(candidateHash, expectedHash);
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeCase = (value: unknown, requireCalculationSex = false): PersonalCase => {
  if (!isRecord(value)) throw new MailboxValidationError('Personal case details are required');
  const calendar = value.calendar;
  const birthDate = value.birthDate;
  const birthTime = value.birthTime;
  const timeUncertain = value.timeUncertain;
  const timezone = value.timezone;
  const calculationSex = value.calculationSex;
  if (calendar !== 'solar' && calendar !== 'lunar') throw new MailboxValidationError('Invalid calendar');
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new MailboxValidationError('Birth date must use YYYY-MM-DD');
  if (birthTime !== null && (typeof birthTime !== 'string' || !/^\d{2}:\d{2}$/.test(birthTime))) throw new MailboxValidationError('Birth time must use HH:MM or be omitted');
  if (typeof timeUncertain !== 'boolean') throw new MailboxValidationError('Time certainty is required');
  if (typeof timezone !== 'string' || timezone.length < 2 || timezone.length > 64) throw new MailboxValidationError('Timezone is required');
  if (calculationSex !== null && calculationSex !== 'male' && calculationSex !== 'female') throw new MailboxValidationError('Invalid calculation sex');
  if (requireCalculationSex && calculationSex !== 'male' && calculationSex !== 'female') throw new MailboxValidationError('請選擇性別');
  return { calendar, birthDate, birthTime, timeUncertain, timezone, calculationSex };
};

const encryptCase = (value: PersonalCase, secret: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', cryptoKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
};

const decryptCase = (value: string, secret: string) => {
  const [iv, tag, ciphertext] = value.split('.');
  if (!iv || !tag || !ciphertext) throw new MailboxValidationError('Encrypted personal case is invalid');
  const decipher = createDecipheriv('aes-256-gcm', cryptoKey(secret), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const cleartext = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
  return normalizeCase(JSON.parse(cleartext));
};

class InlineSupabaseMailboxService {
  private readonly client: any;
  private readonly pepper: string;
  private readonly encryptionSecret: string;
  private readonly submissionWindowMs: number;
  private readonly submissionMax: number;

  constructor() {
    const supabaseSecretKey = requireEnv('SUPABASE_SECRET_KEY');
    this.pepper = deriveMailboxSecret(supabaseSecretKey, 'bazi-mailbox/access-code-pepper/v1');
    this.encryptionSecret = deriveMailboxSecret(supabaseSecretKey, 'bazi-mailbox/personal-case-encryption/v1');
    this.submissionWindowMs = Number(process.env.MAILBOX_SUBMISSION_WINDOW_MS ?? 86_400_000);
    this.submissionMax = Number(process.env.MAILBOX_SUBMISSION_MAX ?? 3);
    this.client = createClient(requireEnv('SUPABASE_URL'), supabaseSecretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  private toPublic(row: any, includeCase: boolean, answer: MailboxAnswer | null = null) {
    return {
      id: row.id,
      publicId: row.public_id,
      inquiryType: row.inquiry_type,
      category: row.category,
      body: row.body,
      personalCase: includeCase && row.personal_case_ciphertext ? decryptCase(row.personal_case_ciphertext, this.encryptionSecret) : undefined,
      status: row.status,
      declineReason: row.decline_reason,
      replyDueAt: row.reply_due_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      answeredAt: row.answered_at,
      answer: answer?.body ?? null,
      answerCreatedAt: answer?.created_at ?? null,
    };
  }

  private async getAnswer(inquiryId: string): Promise<MailboxAnswer | null> {
    const { data, error } = await this.client
      .from('mailbox_answers')
      .select('body, created_at')
      .eq('inquiry_id', inquiryId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  private async audit(inquiryId: string, actorId: string, action: string) {
    const { error } = await this.client.from('mailbox_audit_events').insert({ inquiry_id: inquiryId, actor_id: actorId, action });
    if (error) throw error;
  }

  async submit(input: Record<string, unknown> & { clientFingerprint: string }) {
    const inquiryType: InquiryType = input.inquiryType === 'concept' || input.inquiryType === 'personal_case' ? input.inquiryType : (() => { throw new MailboxValidationError('Select a valid inquiry type'); })();
    if (input.disclosureAccepted !== true) throw new MailboxValidationError('You must accept the disclaimer');
    if (inquiryType === 'personal_case' && input.personalCaseConsentAccepted !== true) throw new MailboxValidationError('Personal-case consent is required');
    if (typeof input.body !== 'string' || input.body.trim().length < 8 || input.body.trim().length > 1200) throw new MailboxValidationError('Question must be between 8 and 1200 characters');
    const category = inquiryType === 'personal_case' ? 'personal_case' : input.category;
    if (category !== 'course' && category !== 'calculation' && category !== 'other' && category !== 'personal_case') throw new MailboxValidationError('Select a valid question category');

    const now = new Date();
    const keyHash = hash(input.clientFingerprint, this.pepper);
    const { data: rate, error: rateError } = await this.client.from('mailbox_rate_limits').select('*').eq('key_hash', keyHash).maybeSingle();
    if (rateError) throw rateError;
    const rateActive = rate && now.getTime() - new Date(rate.window_started_at).getTime() < this.submissionWindowMs;
    if (rateActive && rate.request_count >= this.submissionMax) throw new MailboxValidationError('Too many submissions. Please try again later.');
    const { error: upsertError } = await this.client.from('mailbox_rate_limits').upsert(rateActive ? {
      key_hash: keyHash, window_started_at: rate.window_started_at, request_count: rate.request_count + 1, expires_at: rate.expires_at,
    } : { key_hash: keyHash, window_started_at: now.toISOString(), request_count: 1, expires_at: addDays(now, 2).toISOString() });
    if (upsertError) throw upsertError;

    const personalCase = inquiryType === 'personal_case' ? normalizeCase(input.personalCase, true) : null;
    const accessCode = randomBytes(18).toString('base64url');
    const { data, error } = await this.client.from('mailbox_inquiries').insert({
      public_id: `Q-${randomBytes(4).toString('hex').toUpperCase()}`,
      access_code_hash: hash(accessCode, this.pepper),
      inquiry_type: inquiryType,
      category,
      body: input.body.trim(),
      personal_case_ciphertext: personalCase ? encryptCase(personalCase, this.encryptionSecret) : null,
      consent_version: 'v1.0-2026-08-20',
      reply_due_at: addBusinessDays(now, 7).toISOString(),
      expires_at: addDays(now, inquiryType === 'personal_case' ? 14 : 30).toISOString(),
    }).select('*').single();
    if (error) throw error;
    await this.audit(data.id, 'anonymous', 'submitted');
    return { ...this.toPublic(data, false), accessCode };
  }

  async getByAccessCode(publicId: string, accessCode: string) {
    const { data, error } = await this.client.from('mailbox_inquiries').select('*').eq('public_id', publicId).gt('expires_at', new Date().toISOString()).maybeSingle();
    if (error) throw error;
    if (!data || !codesMatch(accessCode, data.access_code_hash, this.pepper)) return null;
    return this.toPublic(data, true, await this.getAnswer(data.id));
  }

  async deleteByAccessCode(publicId: string, accessCode: string) {
    const { data, error } = await this.client.from('mailbox_inquiries').select('id, access_code_hash').eq('public_id', publicId).maybeSingle();
    if (error) throw error;
    if (!data || !codesMatch(accessCode, data.access_code_hash, this.pepper)) return false;
    const { error: deleteError } = await this.client.from('mailbox_inquiries').delete().eq('id', data.id);
    if (deleteError) throw deleteError;
    return true;
  }

  async requireAdmin(accessToken: string) {
    if (!accessToken) throw new MailboxAuthorizationError('Missing administrator session');
    const { data: user, error: userError } = await this.client.auth.getUser(accessToken);
    if (userError || !user.user) throw new MailboxAuthorizationError('Invalid administrator session');
    const { data: admin, error: adminError } = await this.client.from('mailbox_admins').select('user_id').eq('user_id', user.user.id).maybeSingle();
    if (adminError || !admin) throw new MailboxAuthorizationError('Administrator access is not granted');
    return user.user.id;
  }

  async listAdmin(status?: InquiryStatus) {
    let query = this.client.from('mailbox_inquiries').select('id, public_id, inquiry_type, category, body, status, reply_due_at, expires_at, created_at, answered_at').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getAdminInquiry(id: string) {
    const { data, error } = await this.client.from('mailbox_inquiries').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.toPublic(data, true, await this.getAnswer(data.id)) : null;
  }

  async markReviewing(id: string, adminId: string) {
    const { data, error } = await this.client.from('mailbox_inquiries').update({ status: 'reviewing' }).eq('id', id).in('status', ['received', 'reviewing']).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await this.audit(id, adminId, 'marked_reviewing');
    return this.toPublic(data, true, await this.getAnswer(data.id));
  }

  async reply(id: string, adminId: string, body: unknown) {
    if (typeof body !== 'string' || body.trim().length < 20 || body.trim().length > 5000) throw new MailboxValidationError('Reply must be between 20 and 5000 characters');
    const current = await this.getAdminInquiry(id);
    if (!current || current.status === 'declined') return null;
    const now = new Date();
    const { error: answerError } = await this.client.from('mailbox_answers').upsert({ inquiry_id: id, body: body.trim(), answered_by: adminId, updated_at: now.toISOString() });
    if (answerError) throw answerError;
    const { error: inquiryError } = await this.client.from('mailbox_inquiries').update({ status: 'replied', answered_at: now.toISOString(), expires_at: addDays(now, current.inquiryType === 'personal_case' ? 30 : 90).toISOString() }).eq('id', id);
    if (inquiryError) throw inquiryError;
    await this.audit(id, adminId, 'replied');
    return this.getAdminInquiry(id);
  }

  async decline(id: string, adminId: string, reason: unknown) {
    const allowed: DeclineReason[] = ['sensitive_data', 'out_of_scope', 'safety', 'capacity'];
    if (!allowed.includes(reason as DeclineReason)) throw new MailboxValidationError('Invalid decline reason');
    const { data, error } = await this.client.from('mailbox_inquiries').update({ status: 'declined', decline_reason: reason, expires_at: addDays(new Date(), 7).toISOString() }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await this.audit(id, adminId, `declined:${reason}`);
    return this.toPublic(data, true, await this.getAnswer(data.id));
  }
}

const createSupabaseMailboxService = () => new InlineSupabaseMailboxService();

type ApiRequest = {
  method?: string;
  url?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(value: unknown): void;
  end(): void;
};

const getBody = (body: unknown) => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      throw new MailboxValidationError('Invalid JSON payload');
    }
  }
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
};

const getOperation = (request: ApiRequest) => {
  const fromQuery = request.query?.operation;
  if (typeof fromQuery === 'string') return fromQuery;
  return new URL(request.url ?? '', 'https://mailbox.invalid').searchParams.get('operation') ?? '';
};

const getBearerToken = (request: ApiRequest) => {
  const value = request.headers.authorization;
  const header = Array.isArray(value) ? value[0] : value;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
};

const getFingerprint = (request: ApiRequest) => {
  const forwarded = request.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(',')[0]?.trim() || 'unknown-client';
};

const sendError = (response: ApiResponse, error: unknown) => {
  if (error instanceof MailboxValidationError) {
    response.status(400).json({ message: error.message });
    return;
  }
  if (error instanceof MailboxAuthorizationError) {
    response.status(401).json({ message: error.message });
    return;
  }
  console.error('[mailbox-api] operation failed');
  response.status(500).json({ message: 'Private mailbox is temporarily unavailable.' });
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  if (request.method !== 'POST') {
    response.status(405).json({ message: 'Method not allowed' });
    return;
  }

  try {
    const mailbox = createSupabaseMailboxService();
    const body = getBody(request.body);
    const operation = getOperation(request);

    if (operation === 'submit') {
      const inquiry = await mailbox.submit({
        inquiryType: body.inquiryType,
        category: body.category,
        body: body.body,
        personalCase: body.personalCase,
        disclosureAccepted: body.disclosureAccepted,
        personalCaseConsentAccepted: body.personalCaseConsentAccepted,
        clientFingerprint: getFingerprint(request),
      });
      response.status(201).json({ ok: true, inquiry });
      return;
    }

    if (operation === 'access') {
      const inquiry = await mailbox.getByAccessCode(String(body.publicId ?? ''), String(body.accessCode ?? ''));
      if (!inquiry) {
        response.status(404).json({ message: 'This link is invalid, unavailable, or has expired.' });
        return;
      }
      response.status(200).json({ ok: true, inquiry, requiredReplyDisclosure: REQUIRED_REPLY_DISCLOSURE });
      return;
    }

    if (operation === 'delete') {
      const deleted = await mailbox.deleteByAccessCode(String(body.publicId ?? ''), String(body.accessCode ?? ''));
      if (!deleted) {
        response.status(404).json({ message: 'This link is invalid, unavailable, or has expired.' });
        return;
      }
      response.status(204).end();
      return;
    }

    const adminId = await mailbox.requireAdmin(getBearerToken(request));
    if (operation === 'admin-list') {
      const status = body.status;
      const inquiries = await mailbox.listAdmin(
        status === 'received' || status === 'reviewing' || status === 'replied' || status === 'declined' ? status : undefined
      );
      response.status(200).json({ ok: true, inquiries });
      return;
    }
    if (operation === 'admin-detail') {
      const inquiry = await mailbox.getAdminInquiry(String(body.id ?? ''));
      response.status(inquiry ? 200 : 404).json(inquiry ? { ok: true, inquiry, requiredReplyDisclosure: REQUIRED_REPLY_DISCLOSURE } : { message: 'Not found' });
      return;
    }
    if (operation === 'admin-review') {
      const inquiry = await mailbox.markReviewing(String(body.id ?? ''), adminId);
      response.status(inquiry ? 200 : 404).json(inquiry ? { ok: true, inquiry } : { message: 'Not found' });
      return;
    }
    if (operation === 'admin-reply') {
      const inquiry = await mailbox.reply(String(body.id ?? ''), adminId, body.body);
      response.status(inquiry ? 200 : 404).json(inquiry ? { ok: true, inquiry, requiredReplyDisclosure: REQUIRED_REPLY_DISCLOSURE } : { message: 'Not found' });
      return;
    }
    if (operation === 'admin-decline') {
      const inquiry = await mailbox.decline(String(body.id ?? ''), adminId, body.reason);
      response.status(inquiry ? 200 : 404).json(inquiry ? { ok: true, inquiry } : { message: 'Not found' });
      return;
    }

    response.status(400).json({ message: 'Unknown mailbox operation' });
  } catch (error) {
    sendError(response, error);
  }
}
