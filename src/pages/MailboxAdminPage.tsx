/* 封緘研習信箱管理端：以案卷側欄與專注回覆面板呈現五行研習桌的沉靜、清楚、私密工作流。 */
/* 五行研習桌設計提醒：管理端的案卷操作按風險分層；永久刪除必須以明確危險區、二次確認與中性私密文案呈現。 */
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseClientConfigured } from '../lib/supabaseClient';
import { ROUTES } from '../routes';

type InquiryRow = {
  id: string;
  public_id: string;
  inquiry_type: string;
  category: string;
  body: string;
  status: string;
  reply_due_at: string;
  created_at: string;
  answered_at: string | null;
  read_at: string | null;
};

type InquiryDetail = {
  publicId: string;
  inquiryType: string;
  body: string;
  personalCase?: { birthDate: string; birthTime: string | null; timezone: string };
  status: string;
  answer: string | null;
  readAt: string | null;
  replyDueAt: string;
  createdAt: string;
  expiresAt: string;
};

const dateText = (value: string) =>
  new Intl.DateTimeFormat('zh-HK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Hong_Kong',
  }).format(new Date(value));

export function MailboxAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [selected, setSelected] = useState<InquiryDetail | null>(null);
  const [reply, setReply] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState('');

  const canUseAdmin = useMemo(() => supabaseClientConfigured && Boolean(supabase), []);

  const callAdmin = useCallback(
    async <T,>(operation: string, payload: Record<string, unknown> = {}) => {
      if (!accessToken) throw new Error('請先登入管理員帳戶。');
      const response = await fetch(`/api/mailbox?operation=${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as T & { message?: string };
      if (!response.ok) throw new Error(result.message ?? '暫時未能處理案卷。');
      return result;
    },
    [accessToken],
  );

  const loadList = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      if (!silent) setIsRefreshing(true);
      try {
        const result = await callAdmin<{ inquiries: InquiryRow[] }>('admin-list');
        setInquiries(result.inquiries);
        setLastSyncedAt(new Date().toISOString());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '未能讀取案卷。');
      } finally {
        if (!silent) setIsRefreshing(false);
      }
    },
    [accessToken, callAdmin],
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAccessToken(data.session?.access_token ?? ''));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? '');
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    void loadList(true);
    const timer = window.setInterval(() => void loadList(true), 20_000);
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') void loadList(true);
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [accessToken, loadList]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError('登入失敗。請確認電郵與密碼。');
    setBusy(false);
  };

  const openInquiry = async (id: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await callAdmin<{ inquiry: InquiryDetail }>('admin-detail', { id });
      setSelected(result.inquiry);
      setReply(result.inquiry.answer ?? '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未能開啟案卷。');
    } finally {
      setBusy(false);
    }
  };

  const perform = async (operation: string, payload: Record<string, unknown> = {}) => {
    if (!selected) return;
    const selectedRow = inquiries.find((item) => item.public_id === selected.publicId);
    if (!selectedRow) {
      setError('這封案卷已不在目前清單中，請先重新整理。');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await callAdmin<{ inquiry: InquiryDetail }>(operation, { id: selectedRow.id, ...payload });
      setSelected(result.inquiry);
      setReply(result.inquiry.answer ?? reply);
      setNotice(operation === 'admin-reply' ? '私密回覆已發布，取件者現在可查看。' : '案卷已更新。');
      await loadList(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未能更新案卷。');
    } finally {
      setBusy(false);
    }
  };

  const confirmDangerousAction = (firstPrompt: string, secondPrompt: string) =>
    window.confirm(firstPrompt) && window.confirm(secondPrompt);

  const deleteSelectedReply = async () => {
    if (!selected || selected.status !== 'replied') return;
    const selectedRow = inquiries.find((item) => item.public_id === selected.publicId);
    if (!selectedRow) {
      setError('這封案卷已不在目前清單中，請先重新整理。');
      return;
    }
    if (!confirmDangerousAction(
      `確定刪除案卷 ${selected.publicId} 的已發布回覆嗎？案卷會退回「處理中」，之後可重新撰寫。`,
      '請再次確認：此操作會令取件者暫時看不到原本回覆。'
    )) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await callAdmin<{ inquiry: InquiryDetail }>('admin-delete-reply', { id: selectedRow.id });
      setSelected(result.inquiry);
      setReply('');
      setNotice('已刪除私密回覆，案卷已退回處理中。');
      await loadList(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未能刪除私密回覆。');
    } finally {
      setBusy(false);
    }
  };

  const deleteSelectedInquiry = async () => {
    if (!selected) return;
    const selectedRow = inquiries.find((item) => item.public_id === selected.publicId);
    if (!selectedRow) {
      setError('這封案卷已不在目前清單中，請先重新整理。');
      return;
    }
    if (!confirmDangerousAction(
      `確定永久刪除案卷 ${selected.publicId} 嗎？提問、回覆與相關紀錄均會一併移除。`,
      `請再次確認：永久刪除後無法從管理端復原案卷 ${selected.publicId}。`
    )) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      await callAdmin<{ deleted: true }>('admin-delete-inquiry', { id: selectedRow.id });
      setSelected(null);
      setReply('');
      setNotice(`案卷 ${selected.publicId} 已永久刪除。`);
      await loadList(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未能永久刪除案卷。');
    } finally {
      setBusy(false);
    }
  };

  if (!canUseAdmin) {
    return (
      <main className="mailbox-shell">
        <section className="mailbox-panel">
          <h1>管理端尚未完成設定</h1>
          <p>請確認 Vercel 已提供公開 Supabase 前端設定，再重新部署。</p>
          <Link to={ROUTES.home}>返回研習桌</Link>
        </section>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className="mailbox-shell">
        <header className="mailbox-topbar">
          <Link className="mailbox-back-link" to={ROUTES.home}>← 返回研習桌</Link>
          <span className="mailbox-topbar__mark">✦ 導師案卷桌</span>
        </header>
        <section className="mailbox-panel mailbox-login">
          <p className="mailbox-kicker">僅限管理員</p>
          <h1>開啟私密案卷桌</h1>
          <p>請以管理員帳戶登入。</p>
          <form onSubmit={signIn}>
            <label className="mailbox-field">電郵<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
            <label className="mailbox-field">密碼<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
            {error && <p className="mailbox-error">{error}</p>}
            <button className="mailbox-action mailbox-action--primary" disabled={busy} type="submit">{busy ? '正在驗證…' : '登入案卷桌'}</button>
          </form>
        </section>
      </main>
    );
  }

  const replyCount = reply.trim().length;
  const replyReady = replyCount >= 20 && selected?.status !== 'replied';

  return (
    <main className="mailbox-admin-shell">
      <header className="mailbox-admin-header">
        <div>
          <p className="mailbox-kicker">導師案卷桌</p>
          <h1>私密問答</h1>
        </div>
        <button className="mailbox-action mailbox-action--quiet" type="button" onClick={() => supabase?.auth.signOut()}>登出</button>
      </header>
      {error && <p className="mailbox-error mailbox-admin-message">{error}</p>}
      {notice && <p className="mailbox-success-message mailbox-admin-message">{notice}</p>}
      <div className="mailbox-admin-layout">
        <aside className="mailbox-case-list" aria-label="私密案卷清單">
          <div className="mailbox-case-list__header">
            <div>
              <h2>案卷</h2>
              <p className="mailbox-sync-note">每 20 秒同步一次{lastSyncedAt ? ` · 上次 ${dateText(lastSyncedAt)}` : ''}</p>
            </div>
            <button type="button" disabled={isRefreshing} onClick={() => void loadList()}>{isRefreshing ? '同步中…' : '重新整理'}</button>
          </div>
          {inquiries.map((item) => (
            <button
              type="button"
              key={item.id}
              className={selected?.publicId === item.public_id ? 'mailbox-case-row is-selected' : 'mailbox-case-row'}
              onClick={() => void openInquiry(item.id)}
            >
              <span>{item.public_id}</span>
              <strong>{item.inquiry_type === 'personal_case' ? '個人命例' : '概念問題'}</strong>
              <small>{dateText(item.created_at)}</small>
              <em className={`mailbox-status mailbox-status--${item.status}`}>{item.read_at ? `已讀 ${dateText(item.read_at)}` : item.status}</em>
            </button>
          ))}
          {inquiries.length === 0 && <p className="mailbox-empty">目前沒有案卷。新提問會自動同步，也可按「重新整理」。</p>}
        </aside>

        <section className="mailbox-admin-detail">
          {selected ? (
            <div className="mailbox-admin-workspace">
              <header className="mailbox-admin-detail__header">
                <p className="mailbox-kicker">{selected.publicId}</p>
                <h2>{selected.inquiryType === 'personal_case' ? '個人命例學習' : '課程概念問題'}</h2>
                <p>
                  提交：{dateText(selected.createdAt)}　回覆目標：{dateText(selected.replyDueAt)}
                  {selected.readAt ? `　已讀：${dateText(selected.readAt)}` : '　尚未讀取'}
                </p>
              </header>

              <section className="mailbox-admin-question">
                <h3>提問內容</h3>
                <p>{selected.body}</p>
                {selected.personalCase && (
                  <details className="mailbox-case-summary">
                    <summary>解封本次命例資料</summary>
                    <p>{selected.personalCase.birthDate} · {selected.personalCase.birthTime ?? '時間未提供'} · {selected.personalCase.timezone}</p>
                  </details>
                )}
              </section>

              <div className="mailbox-admin-actions">
                <button type="button" disabled={busy || selected.status === 'replied'} onClick={() => void perform('admin-review')}>標記正在處理</button>
                <button type="button" disabled={busy || selected.status === 'replied'} onClick={() => void perform('admin-decline', { reason: 'out_of_scope' })}>婉拒此案</button>
              </div>

              <section className="mailbox-reply-composer" aria-label="真人私密回覆">
                <header className="mailbox-reply-composer__header">
                  <div>
                    <p className="mailbox-kicker">回覆工作區</p>
                    <h3>真人私密回覆</h3>
                  </div>
                  <span className={replyReady ? 'mailbox-reply-ready' : 'mailbox-reply-minimum'}>{replyCount}/20 字</span>
                </header>
                <label className="mailbox-field">
                  只供此取件者查看
                  <textarea rows={10} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="以學習與參考角度撰寫回覆；固定免責文字會由取件頁自動顯示。" />
                </label>
                <footer className="mailbox-reply-composer__footer">
                  <p>{selected.status === 'replied' ? '此案已回覆。如要補充，請在另開案卷中處理。' : replyReady ? '回覆會立即寫入私密信箱，並由取件碼保護。' : '請至少輸入 20 個字元後發布私密回覆。'}</p>
                  <div className="mailbox-reply-composer__buttons">
                    {selected.status === 'replied' && (
                      <button className="mailbox-action mailbox-action--danger" disabled={busy} type="button" onClick={() => void deleteSelectedReply()}>
                        刪除已發布回覆
                      </button>
                    )}
                    <button className="mailbox-action mailbox-action--primary" disabled={busy || !replyReady} type="button" onClick={() => void perform('admin-reply', { body: reply })}>
                      {busy ? '正在保存…' : '發布私密回覆'}
                    </button>
                  </div>
                </footer>
              </section>

              <section className="mailbox-admin-danger-zone" aria-labelledby="mailbox-delete-heading">
                <div>
                  <p className="mailbox-kicker">危險操作</p>
                  <h3 id="mailbox-delete-heading">永久刪除此案</h3>
                  <p>此操作會永久移除提問、已發布回覆與相關紀錄，無法從管理端復原。</p>
                </div>
                <button className="mailbox-action mailbox-action--danger" disabled={busy} type="button" onClick={() => void deleteSelectedInquiry()}>
                  永久刪除案卷
                </button>
              </section>
            </div>
          ) : (
            <div className="mailbox-empty mailbox-empty--detail">
              <h2>選擇一封案卷</h2>
              <p>新提問會每 20 秒同步。選取案卷後，可在右側專注工作區查看內容與發布回覆。</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
