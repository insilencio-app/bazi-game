/* 五行研習桌設計提醒：行事曆只作私密案卷的回看路標；事件不放問題或回覆，既有取件資料只在用戶選擇後置於網址 fragment。 */

export type MailboxCalendarReminderOptions = {
  publicId: string;
  accessCode: string;
  replyDueAt: string;
  siteOrigin: string;
  mailboxPath: string;
  includePrivateLink: boolean;
};

type HongKongDateParts = {
  year: string;
  month: string;
  day: string;
};

const ICS_LINE_BREAK = '\r\n';
const HONG_KONG_TIME_ZONE = 'Asia/Hong_Kong';

const escapeIcsText = (value: string) => value
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

const formatIcsUtc = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

const getHongKongDateParts = (value: string): HongKongDateParts => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('回覆目標日期無效，暫時未能建立提醒。');

  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: HONG_KONG_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => formatted.find((part) => part.type === type)?.value;
  const year = pick('year');
  const month = pick('month');
  const day = pick('day');

  if (!year || !month || !day) throw new Error('暫時未能讀取回覆目標日期。');
  return { year, month, day };
};

const buildMailboxFragmentUrl = ({ siteOrigin, mailboxPath, publicId, accessCode }: Pick<MailboxCalendarReminderOptions, 'siteOrigin' | 'mailboxPath' | 'publicId' | 'accessCode'>) => {
  const origin = new URL(siteOrigin).origin;
  const path = mailboxPath.startsWith('/') ? mailboxPath : `/${mailboxPath}`;
  const fragment = new URLSearchParams({ id: publicId.trim(), code: accessCode.trim() });
  return `${origin}${path}#${fragment.toString()}`;
};

const makeEventUid = () => {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `mailbox-reminder-${randomPart}@bazi-game.local`;
};

/**
 * Uses the server-provided replyDueAt value, which is already calculated as the seventh working day.
 * The event is set to 09:00–09:30 on the displayed Hong Kong calendar date, without question or reply content.
 */
export const createMailboxReminderIcs = (options: MailboxCalendarReminderOptions) => {
  const publicId = options.publicId.trim();
  const accessCode = options.accessCode.trim();
  if (!publicId || !accessCode) throw new Error('缺少取件資料，未能建立提醒。');

  const date = getHongKongDateParts(options.replyDueAt);
  const dateStamp = `${date.year}${date.month}${date.day}`;
  const privateUrl = options.includePrivateLink
    ? buildMailboxFragmentUrl({
        siteOrigin: options.siteOrigin,
        mailboxPath: options.mailboxPath,
        publicId,
        accessCode,
      })
    : null;
  const description = privateUrl
    ? [
        '這是私密案卷的回看提醒。',
        '點擊下方連結會預填兩組取件資料，但不會自動查詢。',
        '請勿轉寄、分享此事件，或加入共用行事曆。',
        '',
        `私密連結：${privateUrl}`,
      ].join('\n')
    : [
        '這是私密案卷的回看提醒。',
        '本事件不包含案件內容、信件編號或秘密取件碼。',
        '請使用你自行保存的取件資料回到私密信箱查看。',
      ].join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BaZi Game//Private Mailbox Reminder//ZH-HANT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${makeEventUid()}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${dateStamp}T090000`,
    `DTEND:${dateStamp}T093000`,
    `SUMMARY:${escapeIcsText('查看私密案卷')}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText('查看私密案卷')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ];

  return { ics: lines.join(ICS_LINE_BREAK), fileDate: dateStamp };
};

/** Must be called from a user click, so browsers allow the .ics download. */
export const downloadMailboxReminder = (options: MailboxCalendarReminderOptions) => {
  const { ics, fileDate } = createMailboxReminderIcs(options);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `private-mailbox-reminder-${fileDate}.ics`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

/**
 * Reads credentials from #id=...&code=... then immediately removes the fragment.
 * Fragments are not sent to the server in ordinary browser requests. The page must still require a user click to query.
 */
export const getMailboxCredentialsFromFragmentAndClear = (): { publicId: string; accessCode: string } | null => {
  const hash = window.location.hash;
  if (!hash.startsWith('#')) return null;

  const values = new URLSearchParams(hash.slice(1));
  const publicId = values.get('id')?.trim() ?? '';
  const accessCode = values.get('code')?.trim() ?? '';
  if (!publicId || !accessCode) return null;

  window.history.replaceState(window.history.state, document.title, `${window.location.pathname}${window.location.search}`);
  return { publicId, accessCode };
};
