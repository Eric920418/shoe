# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**鞋店電商系統** - Next.js 14 全端單體架構（App Router）+ GraphQL API + PostgreSQL + Redis

這是一個專業的鞋類電商平台，整合前端與後端於同一個 Next.js 專案中。

## 關鍵技術棧

### 核心框架
- **Next.js 14** (App Router) - 全端框架
- **TypeScript** - 類型安全
- **Prisma ORM** - 資料庫 ORM
- **GraphQL Yoga** - GraphQL 伺服器（位於 `/app/api/graphql`）
- **Apollo Client** - GraphQL 客戶端

### 資料庫與快取
- **PostgreSQL** - 主資料庫
- **Redis** - 快取系統（選用）

### UI 與樣式
- **Tailwind CSS v4** - CSS 框架
- **React Hook Form** + **Zod** - 表單驗證

## 常用指令

### 開發環境
```bash
# 安裝依賴（必須使用 pnpm）
pnpm install

# 啟動開發伺服器
pnpm dev

# 生成 Prisma Client
pnpm db:generate

# 資料庫遷移（開發環境）
pnpm db:migrate

# 查看資料庫（Prisma Studio）
pnpm db:studio
```

### 測試與構建
```bash
# 執行測試
pnpm test

# 測試監視模式
pnpm test:watch

# 建構生產版本
pnpm build

# 啟動生產伺服器
pnpm start

# 程式碼檢查
pnpm lint
```

### 資料庫管理
```bash
# 僅生成 Prisma Client（不影響資料庫）
pnpm prisma generate

# 查看待處理的遷移
pnpm prisma migrate status

# 部署遷移（生產環境）
pnpm db:deploy

# 重置資料庫（危險！會清空所有資料）
pnpm prisma migrate reset

# 執行種子資料
pnpm db:seed
```

## 專案架構

### 資料夾結構
```
shoe/
├── app/                    # Next.js App Router
│   ├── api/graphql/       # GraphQL API 端點
│   ├── admin/             # 後台管理頁面
│   ├── account/           # 用戶帳戶頁面
│   ├── auth/              # 認證頁面
│   ├── cart/              # 購物車
│   ├── checkout/          # 結帳流程
│   ├── orders/            # 訂單頁面
│   └── products/          # 產品列表與詳情
├── src/
│   ├── graphql/           # GraphQL 配置
│   │   ├── resolvers/     # 所有 Resolvers
│   │   ├── schema.ts      # GraphQL Schema 定義
│   │   └── queries.ts     # 前端查詢定義
│   ├── lib/               # 核心工具函數
│   │   ├── prisma.ts      # Prisma Client 實例
│   │   ├── auth.ts        # JWT 認證邏輯
│   │   ├── redis.ts       # Redis 連接
│   │   ├── cache.ts       # 快取策略
│   │   ├── membership.ts  # 會員等級計算
│   │   └── validation.ts  # 資料驗證
│   └── contexts/          # React Context
│       └── AuthContext.tsx
├── components/            # React 組件
│   ├── admin/            # 後台組件
│   ├── product/          # 產品組件
│   ├── checkout/         # 結帳組件
│   ├── common/           # 通用組件
│   └── navigation/       # 導航組件
└── prisma/
    └── schema.prisma      # 資料庫 Schema
```

### GraphQL API 架構

**API 端點**: `/api/graphql`

所有 GraphQL resolvers 位於 `src/graphql/resolvers/`：
- `authResolvers.ts` - 認證（登入/註冊）
- `userResolvers.ts` - 用戶管理
- `productResolvers.ts` - 產品查詢
- `cartResolvers.ts` - 購物車
- `orderResolvers.ts` - 訂單管理
- `couponResolvers.ts` - 優惠券
- `creditResolvers.ts` - 購物金系統
- `referralResolvers.ts` - 邀請碼系統
- `announcementResolvers.ts` - 公告系統
- `chatResolvers.ts` - 客服聊天
- `socialLinkResolvers.ts` - 社群連結管理

### 認證系統

使用 JWT Token 進行認證：
- Token 儲存在 Cookie 中
- 認證邏輯位於 `src/lib/auth.ts`
- `AuthContext.tsx` 提供全局認證狀態
- 使用 `bcryptjs` 進行密碼加密

權限分為兩種：
- `USER` - 一般用戶
- `ADMIN` - 管理員（可訪問 `/admin/*` 路由）

### 會員等級系統

會員等級根據累計消費金額自動升級（邏輯位於 `src/lib/membership.ts`）：
- **BRONZE** (銅): $0 - $9,999
- **SILVER** (銀): $10,000 - $49,999
- **GOLD** (金): $50,000 - $99,999
- **PLATINUM** (白金): $100,000 - $199,999
- **DIAMOND** (鑽石): $200,000+

升級時會自動發放升級獎勵購物金。

## 核心功能模組

### 1. 產品系統（鞋店專屬）

**特色功能**：
- 多國尺碼系統（EUR/US/UK/CM）- `SizeChart` 資料表
- 顏色變體系統 - `ProductVariant` 資料表
- 鞋類專屬屬性（鞋型、性別、季節、材質）
- 尺碼庫存獨立管理（按顏色 × 尺碼）

**關鍵組件**：
- `components/product/SizeSelector.tsx` - 尺碼選擇器
- `components/product/ColorSelector.tsx` - 顏色選擇器
- `components/product/ProductGallery.tsx` - 產品圖庫

### 2. 購物金系統

**資料表**: `user_credits`

**功能**：
- 發放來源追蹤（活動/退款/管理員/生日/評價）
- 使用限制（最低訂單金額、單筆最大使用額）
- 有效期限管理
- 結帳時自動計算可用購物金

**API**：
- Query: `myCredits`, `availableCreditAmount`
- Mutation: `grantCredit`, `batchGrantCredit`

**前端組件**: `components/checkout/CreditSelector.tsx`

### 3. 邀請碼系統

**資料表**: `referral_codes`, `referral_usages`

**運作機制**：
1. 每個用戶自動生成專屬邀請碼
2. 邀請連結格式：`網站網址?ref=邀請碼`
3. 被邀請人首次下單完成後，自動發放購物金給邀請人
4. **邀請碼永不過期，無使用上限**

**注意事項**：
- 只有邀請人獲得獎勵，被邀請人不獲得
- 每個用戶只能使用一次邀請碼
- 不能使用自己的邀請碼
- URL 參數追蹤儲存 30 天（使用 Cookie）

**前端組件**: `components/common/ReferralTracker.tsx`
**頁面**: `/account/referral`

### 4. 公告系統

**資料表**: `announcements`

**6 種公告類型**：
- `INFO` - 一般資訊
- `SUCCESS` - 成功訊息
- `WARNING` - 警告
- `ERROR` - 錯誤
- `PROMOTION` - 促銷活動
- `MAINTENANCE` - 系統維護

**前端組件**: `components/common/AnnouncementBanner.tsx`

公告會根據優先級（`priority` 欄位）和時間範圍自動顯示在前台。

### 5. 客服聊天系統

**資料表**: `conversations`, `messages`

**功能**：
- 用戶創建對話
- 管理員回覆
- 對話狀態管理（OPEN/CLOSED/RESOLVED）
- 訊息已讀/未讀追蹤

**頁面**：
- 用戶端：`/account/support`
- 管理端：`/admin/chats`

### 6. 社群分享功能

**組件**: `components/product/SocialShareButtons.tsx`

支援平台：
- Facebook
- LINE
- Instagram（複製連結）
- 一鍵複製產品連結

### 7. 優惠券系統

**資料表**: `coupons`, `user_coupons`

**4 種類型**：
- `PERCENTAGE` - 百分比折扣
- `FIXED` - 固定金額
- `FREE_SHIPPING` - 免運費
- `BUY_X_GET_Y` - 買 X 送 Y

## 資料庫 Schema 重點

### 核心資料表關聯

```
User (用戶)
├── Cart (購物車)
│   └── CartItem (購物車項目)
├── Order (訂單)
│   └── OrderItem (訂單項目)
├── UserCredit (購物金)
├── ReferralCode (邀請碼)
├── Review (評論)
└── Conversation (對話)

Product (產品)
├── ProductVariant (顏色變體)
├── SizeChart (尺碼表)
├── CartItem
├── OrderItem
└── Review

Order (訂單)
├── OrderItem
├── Address (收貨地址)
└── Coupon (優惠券)
```

### 重要欄位說明

**Product 鞋店專屬欄位**：
- `shoeType` - 鞋類型（運動鞋、皮鞋、涼鞋、靴子）
- `gender` - 性別（男、女、中性、兒童）
- `season` - 季節（春夏、秋冬、四季）
- `heelHeight` - 鞋跟高度
- `closure` - 閉合方式（系帶、魔術貼、拉鏈、套脚）
- `sole` - 鞋底材質

**SizeChart 尺碼對照表**：
- `eu`, `us`, `uk`, `cm` - 四種尺碼標準
- `footLength` - 腳長（厘米）
- `stock` - 該尺碼的獨立庫存

**UserCredit 購物金**：
- `balance` - 餘額（可能被部分使用）
- `maxUsagePerOrder` - 單筆訂單最大使用額
- `minOrderAmount` - 最低訂單金額限制
- `validUntil` - 有效期限

## 開發注意事項

### 資料庫遷移規則

**重要**：根據用戶全局設定，禁止使用 `--accept-data-loss` 參數。

開發時的安全流程：
```bash
# 1. 修改 prisma/schema.prisma
# 2. 生成遷移（會提示可能的資料遺失）
pnpm db:migrate

# 3. 如果出現資料遺失警告，必須手動處理：
#    - 先備份資料
#    - 調整 Schema 避免破壞性變更
#    - 或使用 Prisma 的資料遷移腳本
```

### 錯誤處理

**所有錯誤必須完整顯示在前端**（根據用戶全局設定）。

GraphQL Resolvers 應該：
```typescript
// ❌ 錯誤：隱藏錯誤訊息
throw new Error('Internal error');

// ✅ 正確：提供完整錯誤訊息
throw new Error(`無法更新產品：庫存不足 (可用: ${stock}, 需求: ${quantity})`);
```

### 套件管理

**必須使用 pnpm**，不要使用 npm 或 yarn。

```bash
# 安裝套件
pnpm add <package-name>

# 安裝開發依賴
pnpm add -D <package-name>

# 移除套件
pnpm remove <package-name>
```

### 文檔更新規則

**每次更新檔案必須同步更新 README.md**（根據用戶全局設定）。

README.md 是唯一的主要文檔，包含：
- 專案架構說明
- 開發與部署指南
- 測試與效能優化記錄
- API 文檔與範例
- 故障排除指南

**禁止創建新的 .md 文檔**。所有內容都應整合到 README.md 中。

## GraphQL API 使用範例

### 查詢產品
```graphql
query GetProduct($slug: String!) {
  product(slug: $slug) {
    id
    name
    price
    variants {
      id
      color
      colorHex
      stock
    }
    sizeCharts {
      eu
      us
      uk
      cm
      stock
    }
  }
}
```

### 使用購物金結帳
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    orderNumber
    total
    creditUsed  # 使用的購物金金額
  }
}
```

### 查詢邀請碼統計
```graphql
query MyReferralStats {
  myReferralCode {
    code
    usedCount
    totalRewards
  }
  referralStats {
    totalReferrals
    successfulOrders
    totalRewardAmount
  }
}
```

## 環境變數設定

必需的環境變數（`.env`）：

```env
# 資料庫
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shoe_store"

# Redis（選用）
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 常見問題排查

### GraphQL 查詢失敗
```bash
# 重新生成 Prisma Client
pnpm db:generate

# 重啟開發伺服器
pnpm dev
```

### 資料庫連線失敗
```bash
# 檢查 PostgreSQL 是否運行
brew services list

# 重啟 PostgreSQL
brew services restart postgresql
```

### 購物金無法使用
檢查清單：
1. 購物金是否在有效期內（`validFrom` 到 `validUntil`）
2. 訂單金額是否達到最低限制（`minOrderAmount`）
3. 購物金餘額是否足夠（`balance`）
4. 是否超過單筆最大使用額（`maxUsagePerOrder`）

### 邀請碼無效
檢查清單：
1. 邀請碼格式是否正確
2. 邀請碼是否已停用（`isActive = false`）
3. 用戶是否嘗試使用自己的邀請碼
4. 用戶是否已經使用過其他邀請碼（每人限用一次）

## 專案依賴關係

### 前端依賴
- `@apollo/client` - GraphQL 客戶端
- `react-hook-form` + `@hookform/resolvers` - 表單處理
- `zod` - Schema 驗證
- `date-fns` - 日期處理
- `react-hot-toast` - 通知提示
- `js-cookie` - Cookie 管理
- `lucide-react` - 圖示庫

### 後端依賴
- `graphql-yoga` - GraphQL 伺服器
- `@prisma/client` - 資料庫 ORM
- `jsonwebtoken` - JWT 認證
- `bcryptjs` - 密碼加密
- `redis` - 快取（選用）
- `joi` - 資料驗證
- `compression` - HTTP 壓縮
- `helmet` - 安全頭部

## 效能優化建議

參考 `PERFORMANCE_OPTIMIZATION.md` 獲取詳細的效能優化指引。

關鍵優化點：
1. 使用 Redis 快取熱門產品查詢
2. 圖片使用 Next.js Image 組件自動優化
3. GraphQL 查詢使用 DataLoader 避免 N+1 問題
4. 產品列表實作分頁和無限滾動
5. 使用 React.memo 和 useMemo 減少重渲染

## 測試策略

參考 `TESTING.md` 獲取詳細的測試指引。

```bash
# 執行所有測試
pnpm test

# 監視模式（開發時使用）
pnpm test:watch

# 產生測試覆蓋率報告
pnpm test:coverage
```

---

**最後更新**: 2025-10-27
**專案狀態**: 生產就緒 ✅
