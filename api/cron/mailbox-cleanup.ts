import { createClient } from '@supabase/supabase-js';

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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !supabaseSecretKey) throw new Error('Supabase server credentials are unavailable');
    const client = createClient(supabaseUrl, supabaseSecretKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: results, error } = await client.rpc('mailbox_purge_expired');
    if (error) throw error;
    response.status(200).json({ ok: true, results });
  } catch {
    console.error('[mailbox-cron] maintenance failed');
    response.status(500).json({ message: 'Maintenance failed' });
  }
}
