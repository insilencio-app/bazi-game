/* 封緘研習信箱：五行研習桌視覺，手機優先、私密取件碼與明確安全邊界。 */
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

type InquiryType = 'concept' | 'personal_case';

type MailboxInquiry = {
  publicId: string;
  inquiryType: InquiryType;
  category: string;
  body: string;
  personalCase?: { calendar: string; birthDate: string; birthTime: string | null; timeUncertain: boolean; timezone: string; calculationSex: string | null };
  status: 'received' | 'reviewing' | 'replied' | 'declined';
  replyDueAt: string;
  expiresAt: string;
  createdAt: string;
  answer: string | null;
  declineReason: string | null;
};

const DISCLAIMER =
  '八字及其他玄學屬傳統文化與詮釋性觀點，並非精密科學，也不能保證預測結果。回覆只供學習及參考，請勿過份迷信，亦不要把它作為醫療、心理健康、法律、投資、婚姻、職業、教育或其他重大人生決定的唯一或主要依據。';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-HK', { dateStyle: 'medium', timeZone: 'Asia/Hong_Kong' }).format(new Date(value));

const statusCopy: Record<MailboxInquiry['status'], { label: string; className: string; body: string }> = {
  received: { label: '已安全收件', className: 'mailbox-status mailbox-status--waiting', body: '你的信件正在排隊等候真人閱覽。' },
  reviewing: { label: '真人正在處理', className: 'mailbox-status mailbox-status--reviewing', body: '導師已開始整理這封信件，請保留你的取件碼。' },
  replied: { label: '已有真人回覆', className: 'mailbox-status mailbox-status--ready', body: '回覆已準備好，內容只供持有取件碼的人閱讀。' },
  declined: { label: '暫未能處理', className: 'mailbox-status mailbox-status--declined', body: '這封信件不適合在此私密信箱中回覆。' },
};

async function mailboxRequest<T>(operation: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/mailbox?operation=${encodeURIComponent(operation)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (response.status === 204) return undefined as T;
  const result = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(result.message ?? '暫時未能處理你的信件，請稍後再試。');
  return result;
}

export function MailboxPage() {
  const [view, setView] = useState<'submit' | 'access'>('submit');
  const [inquiryType, setInquiryType] = useState<InquiryType>('concept');
  const [category, setCategory] = useState('course');
  const [question, setQuestion] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUncertain, setTimeUncertain] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Hong_Kong');
  const [calculationSex, setCalculationSex] = useState('');
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [personalConsent, setPersonalConsent] = useState(false);
  const [submitted, setSubmitted] = useState<{ publicId: string; accessCode: string; replyDueAt: string; expiresAt: string } | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [publicId, setPublicId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [inquiry, setInquiry] = useState<MailboxInquiry | null>(null);
  const [accessError, setAccessError] = useState('');
  const [isAccessing, setIsAccessing] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState('');

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const result = await mailboxRequest<{ inquiry: MailboxInquiry & { accessCode: string } }>('submit', {
        inquiryType,
        category,
        body: question,
        personalCase:
          inquiryType === 'personal_case'
            ? {
                calendar: 'solar',
                birthDate,
                birthTime: timeUncertain ? null : birthTime || null,
                timeUncertain,
                timezone,
                calculationSex: calculationSex || null,
              }
            : undefined,
        disclosureAccepted,
        personalCaseConsentAccepted: personalConsent,
      });
      setSubmitted({
        publicId: result.inquiry.publicId,
        accessCode: result.inquiry.accessCode,
        replyDueAt: result.inquiry.replyDueAt,
        expiresAt: result.inquiry.expiresAt,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '暫時未能送出信件。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accessInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccessError('');
    setDeleteNotice('');
    setIsAccessing(true);
    try {
      const result = await mailboxRequest<{ inquiry: MailboxInquiry }>('access', { publicId: publicId.trim(), accessCode: accessCode.trim() });
      setInquiry(result.inquiry);
    } catch (error) {
      setInquiry(null);
      setAccessError(error instanceof Error ? error.message : '暫時未能開啟信件。');
    } finally {
      setIsAccessing(false);
    }
  };

  const deleteInquiry = async () => {
    if (!inquiry || !window.confirm('確定要永久刪除這封私密信件及其真人回覆嗎？此操作不能復原。')) return;
    try {
      await mailboxRequest<void>('delete', { publicId: inquiry.publicId, accessCode: accessCode.trim() });
      setInquiry(null);
      setDeleteNotice('這封私密信件已永久刪除。');
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : '暫時未能刪除信件。');
    }
  };

  return (
    <main className="mailbox-shell">
      <header className="mailbox-topbar">
        <Link className="mailbox-back-link" to={ROUTES.home}>← 返回研習桌</Link>
        <span className="mailbox-topbar__mark" aria-label="私密信封">✦ 私密真人問答</span>
      </header>

      <section className="mailbox-hero" aria-labelledby="mailbox-heading">
        <p className="mailbox-kicker">封緘研習信箱</p>
        <h1 id="mailbox-heading">把問題交給真人導師。</h1>
        <p>不設帳戶、不收聯絡方式；你只需保存自己的秘密取件碼。</p>
        <div className="mailbox-hero__facts" aria-label="服務說明">
          <span>真人閱覽</span><span>一般七個工作天內盡量回覆</span><span>內容不會公開</span>
        </div>
      </section>

      <nav className="mailbox-tabs" aria-label="私密信箱操作">
        <button className={view === 'submit' ? 'mailbox-tab is-active' : 'mailbox-tab'} onClick={() => setView('submit')} type="button">寫一封信</button>
        <button className={view === 'access' ? 'mailbox-tab is-active' : 'mailbox-tab'} onClick={() => setView('access')} type="button">用取件碼開信</button>
      </nav>

      {view === 'submit' ? (
        <section className="mailbox-panel" aria-labelledby="compose-heading">
          {submitted ? (
            <div className="mailbox-success" role="status">
              <p className="mailbox-kicker">已安全封緘</p>
              <h2 id="compose-heading">請立即保存你的取件資料</h2>
              <p>系統不會收集電郵或傳送通知；遺失取件碼後無法找回這封信件。</p>
              <dl className="mailbox-code-card">
                <div><dt>信件編號</dt><dd>{submitted.publicId}</dd></div>
                <div><dt>秘密取件碼</dt><dd>{submitted.accessCode}</dd></div>
              </dl>
              <p className="mailbox-note">一般會於 <strong>{formatDate(submitted.replyDueAt)}</strong> 或之前盡量回覆。此信件最遲保存至 {formatDate(submitted.expiresAt)}。</p>
              <button className="mailbox-action mailbox-action--primary" type="button" onClick={() => { setView('access'); setPublicId(submitted.publicId); setAccessCode(submitted.accessCode); }}>前往私密信箱</button>
            </div>
          ) : (
            <form onSubmit={submitInquiry} noValidate>
              <div className="mailbox-section-heading">
                <p className="mailbox-kicker">第一步</p><h2 id="compose-heading">選擇你想討論的方向</h2>
              </div>
              <fieldset className="mailbox-choice-grid">
                <legend className="sr-only">提問類型</legend>
                <label className={inquiryType === 'concept' ? 'mailbox-choice is-selected' : 'mailbox-choice'}>
                  <input type="radio" name="inquiryType" checked={inquiryType === 'concept'} onChange={() => setInquiryType('concept')} />
                  <strong>課程概念問題</strong><span>例如五行、十神、課程內容或排盤步驟。</span>
                </label>
                <label className={inquiryType === 'personal_case' ? 'mailbox-choice is-selected' : 'mailbox-choice'}>
                  <input type="radio" name="inquiryType" checked={inquiryType === 'personal_case'} onChange={() => setInquiryType('personal_case')} />
                  <strong>個人命例學習</strong><span>只提交自己的最少排盤資料；將以伺服器端加密保存。</span>
                </label>
              </fieldset>

              {inquiryType === 'concept' && (
                <label className="mailbox-field">問題分類
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="course">課程概念</option><option value="calculation">計算與排盤</option><option value="other">其他學習問題</option>
                  </select>
                </label>
              )}

              {inquiryType === 'personal_case' && (
                <section className="mailbox-case-drawer" aria-labelledby="case-heading">
                  <div><p className="mailbox-kicker">敏感資料匣</p><h3 id="case-heading">只填寫排盤所需的最少資料</h3></div>
                  <div className="mailbox-field-grid">
                    <label className="mailbox-field">出生日期<input required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
                    <label className="mailbox-field">出生時間<input disabled={timeUncertain} required={!timeUncertain} type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} /></label>
                    <label className="mailbox-check"><input type="checkbox" checked={timeUncertain} onChange={(event) => setTimeUncertain(event.target.checked)} />出生時間不確定</label>
                    <label className="mailbox-field">時區<input required value={timezone} onChange={(event) => setTimezone(event.target.value)} aria-describedby="timezone-help" /></label>
                    <p className="mailbox-help" id="timezone-help">香港可填寫 `Asia/Hong_Kong`。</p>
                    <label className="mailbox-field">傳統計算法性別（可略過）
                      <select value={calculationSex} onChange={(event) => setCalculationSex(event.target.value)}><option value="">不提供</option><option value="male">男</option><option value="female">女</option></select>
                    </label>
                  </div>
                  <p className="mailbox-help">請不要填姓名、電話、電郵、地址、相片或他人的出生資料。</p>
                </section>
              )}

              <label className="mailbox-field">你的問題<textarea required minLength={8} maxLength={1200} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="請以你正在學習的角度描述問題；不需要留下姓名或聯絡方式。" rows={7} /><span className="mailbox-char-count">{question.length}/1200</span></label>
              <section className="mailbox-disclosure"><h3>提交前請確認</h3><p>{DISCLAIMER}</p><label className="mailbox-check"><input required type="checkbox" checked={disclosureAccepted} onChange={(event) => setDisclosureAccepted(event.target.checked)} />我已閱讀並同意上述免責說明。</label>{inquiryType === 'personal_case' && <label className="mailbox-check"><input required type="checkbox" checked={personalConsent} onChange={(event) => setPersonalConsent(event.target.checked)} />我同意系統以加密方式短期保存我提供的命例資料，以便真人回覆。</label>}</section>
              {submitError && <p className="mailbox-error" role="alert">{submitError}</p>}
              <button className="mailbox-action mailbox-action--primary" disabled={isSubmitting} type="submit">{isSubmitting ? '正在安全封緘…' : '封緘並取得取件碼'}</button>
            </form>
          )}
        </section>
      ) : (
        <section className="mailbox-panel" aria-labelledby="access-heading">
          <div className="mailbox-section-heading"><p className="mailbox-kicker">私密取件</p><h2 id="access-heading">用你的兩組資料開啟信件</h2><p>我們不使用電郵或帳戶。請輸入送出時保存的信件編號與秘密取件碼。</p></div>
          <form onSubmit={accessInquiry} className="mailbox-access-form">
            <label className="mailbox-field">信件編號<input required value={publicId} onChange={(event) => setPublicId(event.target.value.toUpperCase())} placeholder="Q-1A2B3C4D" autoCapitalize="characters" /></label>
            <label className="mailbox-field">秘密取件碼<input required value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="貼上你保存的取件碼" autoComplete="off" /></label>
            <button className="mailbox-action mailbox-action--primary" disabled={isAccessing} type="submit">{isAccessing ? '正在驗證…' : '開啟私密信件'}</button>
          </form>
          {accessError && <p className="mailbox-error" role="alert">{accessError}</p>}
          {deleteNotice && <p className="mailbox-success-message" role="status">{deleteNotice}</p>}
          {inquiry && <article className="mailbox-letter" aria-live="polite">
            <header><div><p className="mailbox-kicker">{inquiry.publicId}</p><h3>你的私密信件</h3></div><span className={statusCopy[inquiry.status].className}>{statusCopy[inquiry.status].label}</span></header>
            <p className="mailbox-letter__status">{statusCopy[inquiry.status].body}</p>
            <dl className="mailbox-letter__meta"><div><dt>提交日期</dt><dd>{formatDate(inquiry.createdAt)}</dd></div><div><dt>回覆目標</dt><dd>{formatDate(inquiry.replyDueAt)}</dd></div><div><dt>保存至</dt><dd>{formatDate(inquiry.expiresAt)}</dd></div></dl>
            <section><h4>你的問題</h4><p className="mailbox-preserved-text">{inquiry.body}</p></section>
            {inquiry.personalCase && <details className="mailbox-case-summary"><summary>查看這次提交的命例資料</summary><p>{inquiry.personalCase.birthDate} · {inquiry.personalCase.birthTime ?? '時間未提供'} · {inquiry.personalCase.timezone}</p></details>}
            {inquiry.answer && <section className="mailbox-answer"><p className="mailbox-kicker">真人回覆</p><p className="mailbox-preserved-text">{inquiry.answer}</p><p className="mailbox-disclaimer-inline">{DISCLAIMER}</p></section>}
            {inquiry.status === 'declined' && <section className="mailbox-answer mailbox-answer--declined"><h4>處理說明</h4><p>這封信件未能在此服務內回覆。請勿重新提交更多敏感資料；如涉及健康、法律、財務或安全問題，請向合資格專業人士求助。</p></section>}
            <button className="mailbox-delete" type="button" onClick={deleteInquiry}>永久刪除這封私密信件</button>
          </article>}
        </section>
      )}
    </main>
  );
}
