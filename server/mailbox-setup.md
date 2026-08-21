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

私密個人命例不可只保存於本機 SQLite、前端 localStorage、Git 或短暫記憶體。正式部署前，應把問答資料改存至具備持久儲存、受存取控制、加密連線及備份／清除流程的資料庫；目前 SQLite 實作適合作為本機開發與 API 契約驗證。
