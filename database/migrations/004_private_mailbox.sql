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
  answered_at TEXT
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
