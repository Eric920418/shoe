# 資料庫備份資訊

## 備份時間
2025-10-31 00:14:27 CST

## 備份內容

### 資料庫備份
- **檔案名稱**: `shoe_store_backup_20251031_001427.dump`
- **格式**: PostgreSQL 自訂格式（Custom format）
- **壓縮**: gzip
- **大小**: 119KB（壓縮後）
- **TOC 條目**: 282 個（包含所有資料表、類型、索引等）
- **資料表數量**: 37 張

### 備份的資料表清單
1. _prisma_migrations
2. addresses
3. announcements
4. brands
5. campaign_orders
6. campaign_participations
7. campaign_rewards
8. campaigns
9. cart_items
10. carts
11. categories
12. conversations
13. coupons
14. email_campaigns
15. email_logs
16. faqs
17. hero_slides
18. membership_tier_configs
19. messages
20. notifications
21. order_items
22. orders
23. otp_verifications
24. point_transactions
25. product_variants
26. products
27. referral_codes
28. referral_settings
29. referral_usages
30. return_items
31. returns
32. reviews
33. size_charts
34. user_coupons
35. user_credits
36. users
37. wishlist_items

### 配置檔案備份
- `schema.prisma.backup` - Prisma Schema（完整資料庫模型定義）
- `.env.template` - 環境變數範本（已移除敏感資訊）

## 還原指令

### 創建新資料庫
```bash
createdb shoe_store_production
```

### 從備份還原
```bash
pg_restore -h localhost -p 5432 -U eric \
  -d shoe_store_production \
  -v shoe_store_backup_20251031_001427.dump
```

### 驗證還原
```bash
# 檢查資料表數量
psql -d shoe_store_production -c "\dt" | wc -l

# 檢查用戶數量
psql -d shoe_store_production -c "SELECT COUNT(*) FROM users;"

# 檢查產品數量
psql -d shoe_store_production -c "SELECT COUNT(*) FROM products;"
```

## 資料庫資訊

- **資料庫名稱**: shoe_store
- **PostgreSQL 版本**: 16.8 (Homebrew)
- **編碼**: UTF8
- **用戶**: eric
- **主機**: localhost
- **端口**: 5432

## 注意事項

⚠️ **安全警告**:
- 備份檔案包含所有用戶資料和敏感資訊
- 請妥善保管，不要上傳到公開的版本控制系統
- 建議加密儲存或使用安全的備份服務

⚠️ **還原提醒**:
- 還原前請確認目標資料庫為空或可覆蓋
- 生產環境還原前請先在測試環境驗證
- 還原後記得更新 `.env` 中的 DATABASE_URL
- 檢查 Prisma Client 是否需要重新生成

## 備份策略建議

### 開發環境
- 每週備份一次
- 重大功能上線前必須備份

### 生產環境
- 每日自動備份（建議凌晨進行）
- 保留最近 30 天的備份
- 每週完整備份並異地儲存
- 定期測試還原流程

---

**備份者**: Claude Code  
**備份原因**: 準備轉移到生產環境  
**下一步**: 設定生產環境並還原資料
