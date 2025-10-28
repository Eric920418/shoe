-- 添加 LINE Login 相關欄位到 users 表
-- 這些欄位都是可選的，不會影響現有資料

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "lineId" TEXT,
ADD COLUMN IF NOT EXISTS "lineDisplayName" TEXT,
ADD COLUMN IF NOT EXISTS "lineProfileImage" TEXT,
ADD COLUMN IF NOT EXISTS "isLineConnected" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "isLineOfficialFriend" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "lineConnectedAt" TIMESTAMP(3);

-- 添加唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS "users_lineId_key" ON "users"("lineId");

-- 顯示成功訊息
SELECT 'LINE Login 欄位添加成功！' AS status;
