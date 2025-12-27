import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client 單例
 *
 * Vercel Serverless 優化：
 * - 生產環境只記錄錯誤，減少日誌開銷
 * - 使用全局變數避免開發環境的熱重載問題
 *
 * 注意：連線池配置應在 DATABASE_URL 中設定：
 * - Neon: ?pgbouncer=true&connection_limit=1
 * - Supabase: ?pgbouncer=true&connection_limit=1
 * - Prisma Accelerate: prisma://accelerate.prisma-data.net/?api_key=xxx
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    // Serverless 環境優化：減少連線建立時間
    datasourceUrl: process.env.DATABASE_URL,
  })

// 開發環境保持單例避免熱重載建立過多連線
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
