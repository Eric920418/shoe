# 藍新金流整合設定指南

本文檔說明如何設定和使用藍新金流支付系統。

## 📋 目錄

1. [環境變數設定](#環境變數設定)
2. [藍新金流商店後台設定](#藍新金流商店後台設定)
3. [測試環境設定](#測試環境設定)
4. [正式環境上線](#正式環境上線)
5. [常見問題排解](#常見問題排解)

---

## 🔧 環境變數設定

### 1. 複製環境變數範本

```bash
cp .env.example .env.local
```

### 2. 填入藍新金流憑證

編輯 `.env.local` 文件，填入以下資訊：

```env
# 商店代號（向藍新金流申請）
NEWEBPAY_MERCHANT_ID=MS12345678

# HashKey 和 HashIV（藍新金流提供）
NEWEBPAY_HASH_KEY=K9gJ99V7agH7IHzXFrQMQQWHKgW6LDZd
NEWEBPAY_HASH_IV=P3Byvs1dzveFaSLC
```

### 3. 設定回調網址

**本地開發環境：**

```env
NEWEBPAY_NOTIFY_URL=http://localhost:3000/api/newebpay/notify
NEWEBPAY_RETURN_URL=http://localhost:3000/api/newebpay/return
NEWEBPAY_CLIENT_BACK_URL=http://localhost:3000
```

**正式環境（請替換成您的網域）：**

```env
NEWEBPAY_NOTIFY_URL=https://yourdomain.com/api/newebpay/notify
NEWEBPAY_RETURN_URL=https://yourdomain.com/api/newebpay/return
NEWEBPAY_CLIENT_BACK_URL=https://yourdomain.com
```

---

## 🏪 藍新金流商店後台設定

### 1. 登入藍新金流商店後台

- 測試環境：https://cwww.newebpay.com/
- 正式環境：https://www.newebpay.com/

### 2. 啟用支付方式

進入「商店管理」→「收款管理」，啟用以下支付方式：

- ✅ **信用卡** (CREDIT)
- ✅ **ATM 轉帳** (VACC)
- ✅ **超商代碼** (CVS)
- ✅ **超商條碼** (BARCODE) - 選填
- ✅ **網路 ATM** (WEBATM) - 選填

⚠️ **重要：** 如果未啟用信用卡功能，會出現「信用卡未啟動」錯誤。

### 3. 設定回調網址

在「系統設定」→「API 設定」中，設定以下網址：

| 項目 | 測試環境 | 正式環境 |
|------|----------|----------|
| NotifyURL | `http://localhost:3000/api/newebpay/notify` | `https://yourdomain.com/api/newebpay/notify` |
| ReturnURL | `http://localhost:3000/api/newebpay/return` | `https://yourdomain.com/api/newebpay/return` |
| ClientBackURL | `http://localhost:3000` | `https://yourdomain.com` |

### 4. 檢查 HashKey 和 HashIV

在「系統設定」→「API 金鑰」中，確認您的 HashKey 和 HashIV：

- HashKey: `K9gJ99V7agH7IHzXFrQMQQWHKgW6LDZd`
- HashIV: `P3Byvs1dzveFaSLC`

---

## 🧪 測試環境設定

### 1. 使用測試網址

```env
NEWEBPAY_MPG_URL=https://ccore.newebpay.com/MPG/mpg_gateway
NEWEBPAY_QUERY_URL=https://ccore.newebpay.com/API/QueryTradeInfo
```

### 2. 測試信用卡資訊

藍新金流測試環境提供以下測試卡號：

| 卡號 | 到期日 | CVV | 說明 |
|------|--------|-----|------|
| 4000-2211-1111-1111 | 任意未來日期 | 任意3碼 | 測試成功 |
| 4000-2211-1111-1112 | 任意未來日期 | 任意3碼 | 測試失敗（餘額不足） |

### 3. 測試 ATM 和超商

- ATM 轉帳：會產生虛擬帳號，可在測試後台手動確認付款
- 超商代碼：會產生繳費代碼，可在測試後台手動確認付款

### 4. 本地測試回調網址問題

⚠️ **重要：** 藍新金流無法呼叫 `localhost` 的回調網址。

**解決方案：**

1. **使用 ngrok 建立公開網址：**

```bash
# 安裝 ngrok
npm install -g ngrok

# 啟動 ngrok
ngrok http 3000
```

複製 ngrok 產生的網址（例：`https://abc123.ngrok.io`），更新環境變數：

```env
NEWEBPAY_NOTIFY_URL=https://abc123.ngrok.io/api/newebpay/notify
NEWEBPAY_RETURN_URL=https://abc123.ngrok.io/api/newebpay/return
NEWEBPAY_CLIENT_BACK_URL=https://abc123.ngrok.io
```

2. **部署到測試伺服器：** 使用 Vercel、Heroku 等服務部署測試版本。

---

## 🚀 正式環境上線

### 1. 切換到正式環境網址

編輯 `.env.local`（或 `.env.production`）：

```env
# 正式環境網址
NEWEBPAY_MPG_URL=https://core.newebpay.com/MPG/mpg_gateway
NEWEBPAY_QUERY_URL=https://core.newebpay.com/API/QueryTradeInfo

# 正式環境回調網址（替換成您的網域）
NEWEBPAY_NOTIFY_URL=https://yourdomain.com/api/newebpay/notify
NEWEBPAY_RETURN_URL=https://yourdomain.com/api/newebpay/return
NEWEBPAY_CLIENT_BACK_URL=https://yourdomain.com
```

### 2. 向藍新金流申請正式環境憑證

- 填寫正式環境申請表
- 通過審核後取得正式環境的 Merchant ID、HashKey、HashIV
- 更新 `.env.production` 檔案

### 3. 在藍新金流正式後台設定回調網址

確保正式後台的回調網址設定正確。

### 4. 進行正式環境測試

建議使用小額交易進行測試：

1. 信用卡支付測試
2. ATM 轉帳測試
3. 超商代碼測試
4. 訂單狀態更新測試

---

## 🔍 常見問題排解

### 問題 1：「信用卡未啟動」錯誤

**原因：** 藍新金流商店後台未啟用信用卡功能。

**解決方案：**

1. 登入藍新金流商店後台
2. 進入「商店管理」→「收款管理」
3. 啟用「信用卡」支付方式

或者，在程式碼中移除信用卡選項：

```typescript
// app/api/newebpay/create-payment/route.ts
paymentTypes: ['VACC', 'CVS'], // 只啟用 ATM 和超商
```

### 問題 2：「資料驗證失敗」錯誤

**原因：** HashKey 或 HashIV 設定錯誤。

**解決方案：**

1. 檢查 `.env.local` 的 `NEWEBPAY_HASH_KEY` 和 `NEWEBPAY_HASH_IV`
2. 確認與藍新金流後台的金鑰一致
3. 注意不要有多餘的空格或換行

### 問題 3：回調網址無法接收通知

**原因：** 藍新金流無法連接到您的回調網址。

**解決方案：**

1. **本地開發：** 使用 ngrok 建立公開網址
2. **測試環境：** 部署到可公開訪問的伺服器
3. **檢查防火牆：** 確保伺服器允許藍新金流的 IP 連接
4. **檢查 SSL：** 正式環境必須使用 HTTPS

### 問題 4：訂單狀態未更新

**原因：** NotifyURL 回調失敗或處理錯誤。

**解決方案：**

1. 檢查伺服器日誌：`console.log` 輸出
2. 確認資料庫連接正常
3. 測試 `/api/newebpay/notify` 端點是否正常運作
4. 在藍新金流後台查看通知記錄

### 問題 5：無法跳轉到藍新金流頁面

**原因：** 表單提交失敗或 URL 錯誤。

**解決方案：**

1. 檢查 `NEWEBPAY_MPG_URL` 設定
2. 確認測試環境和正式環境 URL 是否正確
3. 檢查瀏覽器 Console 是否有錯誤訊息
4. 確認表單資料完整性

---

## 📞 技術支援

### 藍新金流技術支援

- 客服電話：02-2655-5658
- Email：service@newebpay.com
- 技術文件：https://www.newebpay.com/website/Page/content/download_api

### 本專案相關檔案

- 結帳頁面：`app/checkout/page.tsx`
- 支付 API：`app/api/newebpay/create-payment/route.ts`
- 通知 API：`app/api/newebpay/notify/route.ts`
- 返回 API：`app/api/newebpay/return/route.ts`
- 加密工具：`src/lib/newebpay.ts`

---

## ✅ 檢查清單

上線前請確認以下項目：

- [ ] 已取得藍新金流正式環境憑證
- [ ] 已在商店後台啟用所需的支付方式
- [ ] 已設定正確的回調網址
- [ ] 已將環境變數切換為正式環境
- [ ] 已完成小額交易測試
- [ ] 已確認訂單狀態更新正常
- [ ] 已設定 SSL 憑證（HTTPS）
- [ ] 已確認客戶可正常付款和查詢訂單

---

## 📝 版本記錄

- v1.0 (2024-11-16): 初始版本，整合藍新金流支付系統
- 支援多種付款方式：線上支付、銀行轉帳、貨到付款
- 完整的訂單追蹤和狀態更新

---

**最後更新：** 2024年11月16日

