# 私密問答 API：設定與維護

## 必要設定

Production Function 只需由 Supabase 整合注入的伺服器端設定；它們絕不可使用 `VITE_` 前綴，亦不可寫入 Git、前端程式、網址或瀏覽器儲存空間。

| 變數 | 用途 |
|---|---|
| `SUPABASE_URL` | 只供伺服器端 Function 連接專案資料庫。 |
| `SUPABASE_SECRET_KEY` | 只供伺服器端 Function 使用的 Supabase service-role 金鑰，同時作為信箱用途隔離子密鑰的根密鑰。 |
| `MAILBOX_SUBMISSION_WINDOW_MS` | 匿名提交限流視窗，預設為 24 小時；可選。 |
| `MAILBOX_SUBMISSION_MAX` | 每個短期不可逆流量識別值的提交上限，預設為 3 次；可選。 |

系統以 `SUPABASE_SECRET_KEY` 對三個固定用途標籤作 HMAC 衍生，分別供取件碼雜湊、個人命例 AES-256-GCM 加密與維護流程使用。用途標籤不可變更；更換 Supabase service-role 金鑰會令舊取件碼雜湊及舊加密命例無法再以相同子密鑰驗證或解密，因此必須先完成既有資料的到期清理，或規劃一次受控資料重設。

## 已驗證的 Vercel 與 Supabase 連線

正式網站 `bazi-game` 必須在 Vercel Storage 連接到 `bazi-atlas` 的 **Production** branch。不要把它連到空白或測試用的其他 Supabase project；Function 若指向沒有 mailbox schema 的 project，會無法查詢私密信箱資料表。

管理端前端只需要公開的 Supabase Project URL 與 publishable key。`vite.config.ts` 會在建置時優先使用手動 `VITE_SUPABASE_URL`／`VITE_SUPABASE_PUBLISHABLE_KEY`，否則安全映射 Vercel integration 已注入的 `SUPABASE_URL`／`SUPABASE_PUBLISHABLE_KEY`。這個映射**絕不可**包含 `SUPABASE_SECRET_KEY` 或其他 server-side secret。

## 資料庫初始化與 Data API 權限

在新的正式資料庫依順序執行以下 migrations：

1. `supabase/migrations/20260820_private_mailbox.sql`
2. `supabase/migrations/20260821_mailbox_service_role_grants.sql`
3. `supabase/migrations/20260821_mailbox_cleanup_cron.sql`

2026 年後建立的 Supabase project 可能要求明確 grants 才會將新 `public` 資料表加入 Data API。migration 會授予標準 API roles 資料表層權限，但 RLS 仍是私密資料的強制存取邊界：匿名角色沒有信箱資料政策；已登入角色只有列入 `mailbox_admins` 的管理員可通過管理端資料政策。

## API 路徑

| 路徑 | 用途 |
|---|---|
| `POST /api/mailbox?operation=submit` | 建立匿名概念問題或個人命例；回傳一次性秘密取件碼。 |
| `POST /api/mailbox?operation=access` | 以取件碼查看自己的私密狀態與真人回覆。 |
| `POST /api/mailbox?operation=delete` | 以取件碼不可逆地刪除自己的私密信件。 |
| `POST /api/mailbox?operation=admin-list` | 單一管理員查看案卷列。 |
| `POST /api/mailbox?operation=admin-detail` | 讀取一宗管理端案卷。 |
| `POST /api/mailbox?operation=admin-review` | 標記正在處理。 |
| `POST /api/mailbox?operation=admin-reply` | 寫入真人回覆；前端必須同時顯示 API 提供的 `requiredReplyDisclosure`。 |
| `POST /api/mailbox?operation=admin-decline` | 以固定原因婉拒，並採較短保存期限。 |

管理端每次請求均附上 Supabase Auth bearer session，Function 會確認該使用者同時位於 `mailbox_admins` 表；不使用或保存另一個管理員 token。

## 七個工作天服務目標與每日維護

提交時，系統會以 UTC 計算七個工作天的 `replyDueAt`，跳過星期六及星期日；法定假期暫未納入首版。這個時間是服務提醒與管理端逾期標記，不是自動回覆，也不會向用戶收集電郵作通知。

每日維護由 Supabase 資料庫內的 Cron Job 直接執行 `public.mailbox_purge_expired()`；它不經公開 HTTP 維護端點，因此不需要在 Vercel 保存或傳送額外的排程 token。排程於 UTC 02:00 執行；執行紀錄可在 Supabase 的 Cron 介面或 `cron.job_run_details` 查看。

## 部署前檢查

私密個人命例不可保存於前端 localStorage、Git 或短暫記憶體。正式問答資料保存於已連接的 Supabase PostgreSQL；資料表受 RLS、管理員名單、保存期限清理與個人命例欄位加密保護。若更換 Supabase project，必須先完成上述 migrations、唯一管理員設定與完整提交／取件／回覆／刪除驗收，才可切換 Production 連線。
