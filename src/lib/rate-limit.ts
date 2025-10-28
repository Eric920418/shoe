/**
 * API Rate Limiting - 使用 Redis 實現速率限制
 */

import { getRedisClient } from './redis'

interface RateLimitConfig {
  maxRequests: number  // 最大請求數
  windowMs: number     // 時間窗口（毫秒）
}

/**
 * 檢查速率限制
 * @param identifier 標識符（IP 或 用户ID）
 * @param config 速率限制配置
 * @returns 是否允許請求
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // 開發環境：跳過 rate limiting
  if (process.env.NODE_ENV !== 'production') {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    }
  }

  const key = `rate_limit:${identifier}`

  try {
    const client = await getRedisClient()
    const now = Date.now()
    const windowStart = now - config.windowMs

    // 使用 Redis ZSET 存儲請求時間戳
    // 1. 刪除時間窗口之外的舊記錄
    await client.zRemRangeByScore(key, 0, windowStart)

    // 2. 統計當前時間窗口內的請求數
    const requestCount = await client.zCard(key)

    if (requestCount >= config.maxRequests) {
      // 獲取最早的請求時間來計算何時可以重試
      const oldestRequest = await client.zRange(key, 0, 0, { REV: false })
      const resetAt = oldestRequest.length > 0
        ? parseInt(oldestRequest[0]) + config.windowMs
        : now + config.windowMs

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      }
    }

    // 3. 新增當前請求
    await client.zAdd(key, { score: now, value: now.toString() })

    // 4. 設置過期時間（自動清理）
    await client.expire(key, Math.ceil(config.windowMs / 1000))

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount - 1,
      resetAt: now + config.windowMs,
    }
  } catch (error) {
    console.error('[Rate Limit Error]:', error)
    // 如果 Redis 失败，預設允許請求（降級）
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    }
  }
}

/**
 * 獲取客戶端標識符（IP 地址）
 */
export function getClientIdentifier(request: Request): string {
  // 嘗試從各種頭部獲取真實 IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'unknown'
}

/**
 * Rate Limit 配置預設
 */
export const RateLimitPresets = {
  // GraphQL API：100 次/分鐘
  graphql: { maxRequests: 100, windowMs: 60000 },

  // 認證接口：10 次/分鐘（防止暴力破解）
  auth: { maxRequests: 10, windowMs: 60000 },

  // 上傳接口：20 次/分鐘
  upload: { maxRequests: 20, windowMs: 60000 },

  // 嚴格限制：5 次/分鐘
  strict: { maxRequests: 5, windowMs: 60000 },
}
