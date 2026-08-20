import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { addBusinessDays, createMailboxService, ensureMailboxSchema, type MailboxConfig } from './mailbox';

const config: MailboxConfig = {
  accessCodePepper: 'test-access-code-pepper-that-is-longer-than-32-chars',
  encryptionSecret: 'test-encryption-secret-that-is-longer-than-32-chars',
  adminToken: 'test-admin-token-that-is-longer-than-32-chars',
  maintenanceToken: 'test-maintenance-token-that-is-longer-than-32-chars',
  submissionWindowMs: 86_400_000,
  submissionMax: 3,
};

const databases: Database.Database[] = [];

const createTestMailbox = () => {
  const db = new Database(':memory:');
  databases.push(db);
  db.pragma('foreign_keys = ON');
  ensureMailboxSchema(db);
  return { db, mailbox: createMailboxService(db, config) };
};

afterEach(() => {
  while (databases.length > 0) databases.pop()?.close();
});

describe('private mailbox', () => {
  it('counts seven working days without counting weekends', () => {
    const submittedOnFriday = new Date('2026-08-21T09:00:00.000Z');
    expect(addBusinessDays(submittedOnFriday, 7).toISOString()).toBe('2026-09-01T09:00:00.000Z');
  });

  it('encrypts personal-case data, then requires the matching access code to retrieve it', () => {
    const { db, mailbox } = createTestMailbox();
    const created = mailbox.submit({
      inquiryType: 'personal_case',
      category: 'personal_case',
      body: '我想了解月令與日主互動的學習判讀方向。',
      personalCase: {
        calendar: 'solar',
        birthDate: '1990-01-01',
        birthTime: '08:30',
        timeUncertain: false,
        timezone: 'Asia/Hong_Kong',
        calculationSex: 'female',
      },
      disclosureAccepted: true,
      personalCaseConsentAccepted: true,
      clientFingerprint: 'test-client',
      now: new Date('2026-08-20T09:00:00.000Z'),
    });

    const stored = db.prepare('SELECT personal_case_ciphertext FROM mailbox_inquiries WHERE public_id = ?').get(created.publicId) as {
      personal_case_ciphertext: string;
    };
    expect(stored.personal_case_ciphertext).not.toContain('1990-01-01');
    expect(mailbox.getByAccessCode(created.publicId, 'wrong-code')).toBeNull();

    const inquiry = mailbox.getByAccessCode(created.publicId, created.accessCode);
    expect(inquiry?.personalCase?.birthDate).toBe('1990-01-01');
    expect(inquiry?.replyDueAt).toBe('2026-08-31T09:00:00.000Z');
  });

  it('extends a replied personal case to the shorter thirty-day retention period', () => {
    const { mailbox } = createTestMailbox();
    const created = mailbox.submit({
      inquiryType: 'personal_case',
      category: 'personal_case',
      body: '我想理解這個命例中十神關係的閱讀順序。',
      personalCase: {
        calendar: 'solar',
        birthDate: '1992-04-06',
        birthTime: null,
        timeUncertain: true,
        timezone: 'Asia/Hong_Kong',
        calculationSex: null,
      },
      disclosureAccepted: true,
      personalCaseConsentAccepted: true,
      clientFingerprint: 'test-client-two',
      now: new Date('2026-08-20T09:00:00.000Z'),
    });
    const adminInquiry = mailbox.listAdmin()[0];
    expect(adminInquiry).toBeDefined();

    const replied = mailbox.reply(
      adminInquiry.id,
      '建議先以日主為中心，依次確認月令、五行力量與十神關係；這只是學習上的判讀路徑，並非確定預測。',
      new Date('2026-08-25T09:00:00.000Z')
    );

    expect(replied?.status).toBe('replied');
    expect(replied?.expiresAt).toBe('2026-09-24T09:00:00.000Z');
    expect(mailbox.getByAccessCode(created.publicId, created.accessCode)?.answer).toContain('日主為中心');
  });

  it('cleans expired private records through the maintenance handler', () => {
    const { mailbox } = createTestMailbox();
    const created = mailbox.submit({
      inquiryType: 'concept',
      category: 'course',
      body: '我想確認第六課的藏干應該如何開始閱讀？',
      disclosureAccepted: true,
      clientFingerprint: 'test-client-three',
      now: new Date('2026-08-01T09:00:00.000Z'),
    });

    const maintenance = mailbox.runMaintenance(new Date('2026-09-01T09:00:00.000Z'));
    expect(maintenance.deletedInquiries).toBe(1);
    expect(mailbox.getByAccessCode(created.publicId, created.accessCode, new Date('2026-09-01T09:00:00.000Z'))).toBeNull();
  });
});
