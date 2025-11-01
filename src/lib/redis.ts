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
 */
export async function cacheDel(key: string) {
  try {
    const client = await getRedisClient()

    // 如果包含通配符，使用 KEYS 命令找出所有匹配的鍵
    if (key.includes('*')) {
      const keys = await client.keys(key)
      if (keys.length > 0) {
        await client.del(keys)
        console.log(`Deleted ${keys.length} keys matching pattern: ${key}`)
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
