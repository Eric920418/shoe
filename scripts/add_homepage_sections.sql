-- 插入所有首頁區塊配置
-- 注意：如果已存在相同 componentId 的記錄，這些 INSERT 會失敗，這是正常的

-- 1. 英雄輪播 (sortOrder: 1)
INSERT INTO homepage_configs (id, "componentId", "componentType", title, subtitle, "isActive", "sortOrder", settings, "createdAt", "updatedAt")
VALUES (
  'hero_slider_config',
  'hero_slider',
  'HERO_SLIDER',
  '首頁輪播',
  NULL,
  true,
  1,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 保證條 (sortOrder: 2)
INSERT INTO homepage_configs (id, "componentId", "componentType", title, subtitle, "isActive", "sortOrder", settings, "createdAt", "updatedAt")
VALUES (
  'guarantee_bar_config',
  'guarantee_bar',
  'GUARANTEE_BAR',
  '服務保證',
  NULL,
  true,
  2,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. 限時搶購 (sortOrder: 3)
INSERT INTO homepage_configs (id, "componentId", "componentType", title, subtitle, "isActive", "sortOrder", settings, "createdAt", "updatedAt")
VALUES (
  'flash_sale_config',
  'flash_sale',
  'FLASH_SALE',
  '限時搶購',
  '每2小時更新',
  true,
  3,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. 分類網格 (sortOrder: 4)
INSERT INTO homepage_configs (id, "componentId", "componentType", title, subtitle, "isActive", "sortOrder", settings, "createdAt", "updatedAt")
VALUES (
  'category_grid_config',
  'category_grid',
  'CATEGORY_GRID',
  '熱門分類',
  NULL,
  true,
  4,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 5. 每日特價 (sortOrder: 5)
INSERT INTO homepage_configs (id, "componentId", "componentType", title, subtitle, "isActive", "sortOrder", settings, "createdAt", "updatedAt")
VALUES (
  'daily_deals_config',
  'daily_deals',
  'DAILY_DEALS',
  '今日特價',
  '每日限量優惠',
  true,
  5,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 6. 超值優惠 (sortOrder: 6)
INSERT INTO homepage_configs (id, "componentId", "componentType", title, subtitle, "isActive", "sortOrder", settings, "createdAt", "updatedAt")
VALUES (
  'super_deals_config',
  'super_deals',
  'SUPER_DEALS',
  '超值優惠',
  '組合套裝',
  true,
  6,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 7. 熱門產品 (sortOrder: 7)
INSERT INTO homepage_configs (id, "componentId", "componentType", title, subtitle, "isActive", "sortOrder", settings, "createdAt", "updatedAt")
VALUES (
  'popular_products_config',
  'popular_products',
  'POPULAR_PRODUCTS',
  '熱門商品',
  '精選推薦',
  true,
  7,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 查看結果
SELECT "componentId", "componentType", title, "isActive", "sortOrder"
FROM homepage_configs
ORDER BY "sortOrder";
