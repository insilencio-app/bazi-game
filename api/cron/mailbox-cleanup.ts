import { createSupabaseMailboxService } from '../../server/supabaseMailbox';

type CronRequest = { method?: string; headers: Record<string, string | string[] | undefined> };
type CronResponse = { status(code: number): CronResponse; json(value: unknown): void };

export default async function handler(request: CronRequest, response: CronResponse) {
  const authorization = request.headers.authorization;
  const received = Array.isArray(authorization) ? authorization[0] : authorization;
  const expected = process.env.CRON_SECRET;

  if (request.method !== 'GET' || !expected || received !== `Bearer ${expected}`) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const results = await createSupabaseMailboxService().purgeExpired();
    response.status(200).json({ ok: true, results });
  } catch {
    console.error('[mailbox-cron] maintenance failed');
    response.status(500).json({ message: 'Maintenance failed' });
  }
}
