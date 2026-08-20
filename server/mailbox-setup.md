# 私密問答 API：設定與維護

## 必要設定

在部署環境的秘密設定中加入以下值。每個值均應由密碼管理工具產生，至少 32 個字元，並且不可提交至 Git。

| 變數 | 用途 |
|---|---|
| `MAILBOX_ACCESS_CODE_PEPPER` | 對秘密取件碼作 HMAC 雜湊；資料庫只保存雜湊。 |
| `MAILBOX_ENCRYPTION_SECRET` | 用 AES-256-GCM 加密個人命例資料後才寫入資料庫。 |
| `MAILBOX_ADMIN_TOKEN` | 單一管理員 API 的 `x-mailbox-admin-token` 標頭值。 |
| `MAILBOX_MAINTENANCE_TOKEN` | 每日維護 API 的 `x-mailbox-maintenance-token` 標頭值。 |
| `MAILBOX_SUBMISSION_WINDOW_MS` | 匿名提交限流視窗，預設為 24 小時。 |
| `MAILBOX_SUBMISSION_MAX` | 每個短期不可逆流量識別值的提交上限，預設為 3 次。 |

## API 路徑

| 路徑 | 用途 |
|---|---|
| `POST /api/inquiries` | 建立匿名概念問題或個人命例；回傳一次性秘密取件碼。 |
| `POST /api/inquiries/:publicId/access` | 以取件碼查看自己的私密狀態與真人回覆。 |
| `POST /api/inquiries/:publicId/delete` | 以取件碼不可逆地刪除自己的私密信件。 |
| `GET /api/admin/inquiries` | 單一管理員查看案卷列。 |
| `POST /api/admin/inquiries/:id/review` | 標記正在處理。 |
| `POST /api/admin/inquiries/:id/reply` | 寫入真人回覆；前端必須同時顯示 API 提供的 `requiredReplyDisclosure`。 |
| `POST /api/admin/inquiries/:id/decline` | 以固定原因婉拒，並採較短保存期限。 |
| `POST /api/internal/mailbox/maintenance` | 每日清除已過期私密問答和短期限流資料。 |

管理端請在每次請求附上 `x-mailbox-admin-token`；維護端點只接受 `x-mailbox-maintenance-token`。兩種 token 不可放入前端程式、網址、localStorage 或瀏覽器可讀環境變數。

## 七個工作天服務目標與每日維護

提交時，系統會以 UTC 計算七個工作天的 `replyDueAt`，跳過星期六及星期日；法定假期暫未納入首版。這個時間是服務提醒與管理端逾期標記，不是自動回覆，也不會向用戶收集電郵作通知。

每日維護需要由受管排程在伺服器端呼叫受保護端點。請在 UTC 低流量時段每日一次執行：

```text
POST /api/internal/mailbox/maintenance
x-mailbox-maintenance-token: <server-side secret>
```

| 做法 | 適用情況 | 取捨 | 設定複雜度 |
|---|---|---|---|
| **受管每日排程呼叫維護端點（建議）** | 網站以可休眠或自動擴展的後端運行。 | 不依賴常駐記憶體；維護工作可重試並留下日誌。 | 中等：在部署平台設定每日受保護請求。 |
| 常駐 Node 服務內的排程器 | 你已有單一、24 小時不中斷的 Node 伺服器。 | 可少一個外部排程設定；但服務重啟、水平擴展或休眠時需要額外處理。 | 較低於常駐伺服器；不適合可休眠部署。 |

首版選用第一種做法：API 本身沒有把 `setInterval` 當成資料清理保證，因此不會因程序重啟、休眠或多個執行個體而遺漏或重複處理。

## 部署前檢查

私密個人命例不可只保存於本機 SQLite、前端 localStorage、Git 或短暫記憶體。正式部署前，應把問答資料改存至具備持久儲存、受存取控制、加密連線及備份／清除流程的資料庫；目前 SQLite 實作適合作為本機開發與 API 契約驗證。
