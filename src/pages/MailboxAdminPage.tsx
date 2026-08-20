/* 封緘研習信箱管理端：只供 Supabase Auth 中已獲 mailbox_admins 權限的唯一管理員使用。 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseClientConfigured } from '../lib/supabaseClient';
import { ROUTES } from '../routes';

type InquiryRow = { id: string; public_id: string; inquiry_type: string; category: string; body: string; status: string; reply_due_at: string; created_at: string; answered_at: string | null };
type InquiryDetail = { publicId: string; inquiryType: string; body: string; personalCase?: { birthDate: string; birthTime: string | null; timezone: string }; status: string; answer: string | null; replyDueAt: string; createdAt: string; expiresAt: string };

const dateText = (value: string) => new Intl.DateTimeFormat('zh-HK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Hong_Kong' }).format(new Date(value));

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

  const canUseAdmin = useMemo(() => supabaseClientConfigured && Boolean(supabase), []);

  const callAdmin = async <T,>(operation: string, payload: Record<string, unknown> = {}) => {
    if (!accessToken) throw new Error('請先登入管理員帳戶。');
    const response = await fetch(`/api/mailbox?operation=${operation}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
    const result = (await response.json()) as T & { message?: string };
    if (!response.ok) throw new Error(result.message ?? '暫時未能處理案卷。');
    return result;
  };

  const loadList = async () => {
    const result = await callAdmin<{ inquiries: InquiryRow[] }>('admin-list');
    setInquiries(result.inquiries);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAccessToken(data.session?.access_token ?? ''));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setAccessToken(session?.access_token ?? ''));
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    loadList().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '未能讀取案卷。'));
  }, [accessToken]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError('登入失敗。請確認電郵與密碼。');
    setBusy(false);
  };

  const openInquiry = async (id: string) => {
    setBusy(true); setError('');
    try {
      const result = await callAdmin<{ inquiry: InquiryDetail }>('admin-detail', { id });
      setSelected(result.inquiry); setReply(result.inquiry.answer ?? '');
    } catch (reason) { setError(reason instanceof Error ? reason.message : '未能開啟案卷。'); }
    finally { setBusy(false); }
  };

  const perform = async (operation: string, payload: Record<string, unknown> = {}) => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      const result = await callAdmin<{ inquiry: InquiryDetail }>(operation, { id: inquiries.find((item) => item.public_id === selected.publicId)?.id, ...payload });
      setSelected(result.inquiry); setReply(result.inquiry.answer ?? reply); setNotice('案卷已更新。'); await loadList();
    } catch (reason) { setError(reason instanceof Error ? reason.message : '未能更新案卷。'); }
    finally { setBusy(false); }
  };

  if (!canUseAdmin) return <main className="mailbox-shell"><section className="mailbox-panel"><h1>管理端尚未完成設定</h1><p>請確認 Vercel 已提供 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`，再重新部署。</p><Link to={ROUTES.home}>返回研習桌</Link></section></main>;

  if (!accessToken) return <main className="mailbox-shell"><header className="mailbox-topbar"><Link className="mailbox-back-link" to={ROUTES.home}>← 返回研習桌</Link><span className="mailbox-topbar__mark">✦ 導師案卷桌</span></header><section className="mailbox-panel mailbox-login"><p className="mailbox-kicker">僅限管理員</p><h1>開啟私密案卷桌</h1><p>請以 Supabase 中已獲授權的唯一管理員帳戶登入。</p><form onSubmit={signIn}><label className="mailbox-field">電郵<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label className="mailbox-field">密碼<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>{error && <p className="mailbox-error">{error}</p>}<button className="mailbox-action mailbox-action--primary" disabled={busy} type="submit">{busy ? '正在驗證…' : '登入案卷桌'}</button></form></section></main>;

  return <main className="mailbox-admin-shell"><header className="mailbox-admin-header"><div><p className="mailbox-kicker">導師案卷桌</p><h1>私密問答</h1></div><button className="mailbox-action mailbox-action--quiet" type="button" onClick={() => supabase?.auth.signOut()}>登出</button></header>{error && <p className="mailbox-error">{error}</p>}{notice && <p className="mailbox-success-message">{notice}</p>}<div className="mailbox-admin-layout"><aside className="mailbox-case-list"><div className="mailbox-case-list__header"><h2>案卷</h2><button type="button" onClick={() => loadList().catch(() => setError('未能更新案卷。'))}>重新整理</button></div>{inquiries.map((item) => <button type="button" key={item.id} className={selected?.publicId === item.public_id ? 'mailbox-case-row is-selected' : 'mailbox-case-row'} onClick={() => openInquiry(item.id)}><span>{item.public_id}</span><strong>{item.inquiry_type === 'personal_case' ? '個人命例' : '概念問題'}</strong><small>{dateText(item.created_at)}</small><em className={`mailbox-status mailbox-status--${item.status}`}>{item.status}</em></button>)}{inquiries.length === 0 && <p className="mailbox-empty">目前沒有案卷。</p>}</aside><section className="mailbox-admin-detail">{selected ? <><header><p className="mailbox-kicker">{selected.publicId}</p><h2>{selected.inquiryType === 'personal_case' ? '個人命例學習' : '課程概念問題'}</h2><p>提交：{dateText(selected.createdAt)}　回覆目標：{dateText(selected.replyDueAt)}</p></header><section className="mailbox-admin-question"><h3>提問內容</h3><p>{selected.body}</p>{selected.personalCase && <details className="mailbox-case-summary"><summary>解封本次命例資料</summary><p>{selected.personalCase.birthDate} · {selected.personalCase.birthTime ?? '時間未提供'} · {selected.personalCase.timezone}</p></details>}</section><div className="mailbox-admin-actions"><button type="button" disabled={busy || selected.status === 'replied'} onClick={() => perform('admin-review')}>標記正在處理</button><button type="button" disabled={busy || selected.status === 'replied'} onClick={() => perform('admin-decline', { reason: 'out_of_scope' })}>婉拒此案</button></div><label className="mailbox-field">真人回覆<textarea rows={9} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="以學習與參考角度撰寫回覆；固定免責文字會由用戶信件頁顯示。" /></label><button className="mailbox-action mailbox-action--primary" disabled={busy || reply.trim().length < 20} type="button" onClick={() => perform('admin-reply', { body: reply })}>發布私密回覆</button></> : <div className="mailbox-empty mailbox-empty--detail"><h2>選擇一封案卷</h2><p>個人命例預設遮蔽；只有當你開啟案卷時才會解密顯示。</p></div>}</section></div></main>;
}
