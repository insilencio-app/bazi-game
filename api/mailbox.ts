import { createSupabaseMailboxService, MailboxAuthorizationError, MailboxValidationError, REQUIRED_REPLY_DISCLOSURE } from '../server/supabaseMailbox';

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
