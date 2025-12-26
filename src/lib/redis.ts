import { createClient } from 'redis'

// 只有明確設定 REDIS_URL 時才啟用 Redis
const REDIS_URL = process.env.REDIS_URL

let redisClient: ReturnType<typeof createClient> | null = null
let isRedisAvailable = false

/**
 * 檢查 Redis 是否可用
 */
export function isRedisEnabled(): boolean {
  return !!REDIS_URL && isRedisAvailable
}

/**
 * 獲取 Redis 客戶端
 * 如果 Redis 未配置或不可用，返回 null
 */
export async function getRedisClient() {
  // 如果沒有設定 REDIS_URL，不嘗試連接
  if (!REDIS_URL) {
    return null
  }

  if (!redisClient) {
    try {
      redisClient = createClient({
        url: REDIS_URL,
      })

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err)
        isRedisAvailable = false
      })

      redisClient.on('connect', () => {
        console.log('Redis connected successfully')
        isRedisAvailable = true
      })

      await redisClient.connect()
      isRedisAvailable = true
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      redisClient = null
      isRedisAvailable = false
      return null
    }
  }

  return redisClient
}

/**
 * 快取資料
 */
export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  try {
    const client = await getRedisClient()
    if (!client) return // Redis 不可用，靜默跳過
    await client.setEx(key, ttl, JSON.stringify(value))
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

/**
 * 獲取快取
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient()
    if (!client) return null // Redis 不可用，返回 null
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

/**
 * 刪除快取
 *
 * ⚠️ 重要：使用 SCAN 代替 KEYS 避免阻塞 Redis
 * KEYS 命令會阻塞整個 Redis，在生產環境極度危險
 * SCAN 命令是非阻塞的，分批掃描，不會影響其他請求
 */
export async function cacheDel(key: string) {
  try {
    const client = await getRedisClient()
    if (!client) return // Redis 不可用，靜默跳過

    // 如果包含通配符，使用 SCAN 命令（非阻塞）
    if (key.includes('*')) {
      const keysToDelete: string[] = []
      let cursor = 0

      // 使用 SCAN 分批掃描，避免阻塞
      do {
        const result = await client.scan(cursor, {
          MATCH: key,
          COUNT: 100, // 每次掃描 100 個 key
        })

        cursor = result.cursor
        keysToDelete.push(...result.keys)
      } while (cursor !== 0)

      // 分批刪除（每次最多 100 個，避免一次刪除過多）
      if (keysToDelete.length > 0) {
        const BATCH_SIZE = 100
        for (let i = 0; i < keysToDelete.length; i += BATCH_SIZE) {
          const batch = keysToDelete.slice(i, i + BATCH_SIZE)
          await client.del(batch)
        }
        console.log(`Deleted ${keysToDelete.length} keys matching pattern: ${key}`)
      }
    } else {
      // 單個鍵直接刪除
      await client.del(key)
    }
  } catch (error) {
    console.error('Redis del error:', error)
  }
}

/**
 * 清空所有快取
 */
export async function cacheFlush() {
  try {
    const client = await getRedisClient()
    if (!client) return // Redis 不可用，靜默跳過
    await client.flushAll()
  } catch (error) {
    console.error('Redis flush error:', error)
  }
}

/**
 * 增加產品瀏覽次數（緩衝到 Redis）
 * ✅ 性能優化：避免每次查詢都寫入資料庫
 * 如果 Redis 不可用，直接跳過（瀏覽次數不是關鍵功能）
 */
export async function incrementViewCount(productId: string): Promise<void> {
  try {
    const client = await getRedisClient()
    if (!client) return // Redis 不可用，靜默跳過
    const key = `viewcount:${productId}`
    await client.incr(key)
    // 設定 TTL 為 1 小時，確保即使批次寫入失敗也不會無限累積
    await client.expire(key, 3600)
  } catch (error) {
    console.error('Redis increment viewCount error:', error)
  }
}

/**
 * 批次寫回所有緩衝的瀏覽次數到資料庫
 * ✅ 應該由定時任務調用（例如每 5 分鐘或每 100 次瀏覽）
 */
export async function flushViewCounts(prisma: any): Promise<number> {
  try {
    const client = await getRedisClient()
    if (!client) return 0 // Redis 不可用，返回 0

    const keysToFlush: string[] = []
    let cursor = 0

    // 使用 SCAN 找出所有 viewcount:* 的鍵
    do {
      const result = await client.scan(cursor, {
        MATCH: 'viewcount:*',
        COUNT: 100,
      })
      cursor = result.cursor
      keysToFlush.push(...result.keys)
    } while (cursor !== 0)

    if (keysToFlush.length === 0) {
      return 0
    }

    // 批次取得所有值
    const pipeline = client.multi()
    keysToFlush.forEach(key => pipeline.get(key))
    const values = await pipeline.exec()

    // 更新資料庫
    let updateCount = 0
    for (let i = 0; i < keysToFlush.length; i++) {
      const productId = keysToFlush[i].replace('viewcount:', '')
      const count = parseInt(values[i] as string, 10) || 0

      if (count > 0) {
        await prisma.product.update({
          where: { id: productId },
          data: { viewCount: { increment: count } },
        })
        updateCount++
      }
    }

    // 刪除已處理的鍵
    await client.del(keysToFlush)

    console.log(`✅ 批次寫回 ${updateCount} 個產品的瀏覽次數`)
    return updateCount
  } catch (error) {
    console.error('Redis flushViewCounts error:', error)
    return 0
  }
}
