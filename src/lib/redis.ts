import { createClient } from 'redis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let redisClient: ReturnType<typeof createClient> | null = null

/**
 * 獲取 Redis 客戶端
 */
export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    await redisClient.connect()
  }

  return redisClient
}

/**
 * 快取資料
 */
export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  try {
    const client = await getRedisClient()
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
    await client.flushAll()
  } catch (error) {
    console.error('Redis flush error:', error)
  }
}
