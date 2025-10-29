import { createClient } from 'redis'

// Redis 客戶端配置
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis 連接失敗次數過多，停止重連')
        return false
      }
      return Math.min(retries * 100, 3000)
    },
  },
})

// 錯誤處理
redisClient.on('error', (err) => {
  console.error('Redis 錯誤:', err)
})

redisClient.on('connect', () => {
  console.log('✅ Redis 連接成功')
})

// 連接 Redis
let isConnected = false
async function ensureConnection() {
  if (!isConnected) {
    await redisClient.connect()
    isConnected = true
  }
  return redisClient
}

// 快取策略配置
export const CacheConfig = {
  // 產品快取時間
  PRODUCT_TTL: 300, // 5 分鐘
  PRODUCT_LIST_TTL: 60, // 1 分鐘

  // 用戶快取時間
  USER_TTL: 600, // 10 分鐘
  SESSION_TTL: 3600, // 1 小時

  // 購物車快取時間
  CART_TTL: 1800, // 30 分鐘

  // 熱門資料快取時間
  HOT_DATA_TTL: 3600, // 1 小時

  // 公告快取時間
  ANNOUNCEMENT_TTL: 1800, // 30 分鐘
}

// 快取鍵生成器
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  productList: (params: any) => `products:${JSON.stringify(params)}`,
  user: (id: string) => `user:${id}`,
  session: (token: string) => `session:${token}`,
  cart: (userId: string) => `cart:${userId}`,
  hotProducts: () => 'hot:products',
  brands: () => 'brands:all',
  categories: () => 'categories:all',
  announcements: () => 'announcements:active',
  sizeChart: (productId: string) => `sizechart:${productId}`,
}

// 核心快取操作
export class RedisCache {
  // 獲取快取
  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = await ensureConnection()
      const data = await client.get(key)

      if (!data) return null

      return JSON.parse(data) as T
    } catch (error) {
      console.error(`Redis GET 錯誤 [${key}]:`, error)
      return null
    }
  }

  // 設置快取
  static async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const client = await ensureConnection()
      const data = JSON.stringify(value)

      if (ttl) {
        await client.setEx(key, ttl, data)
      } else {
        await client.set(key, data)
      }

      return true
    } catch (error) {
      console.error(`Redis SET 錯誤 [${key}]:`, error)
      return false
    }
  }

  // 刪除快取
  static async del(key: string | string[]): Promise<number> {
    try {
      const client = await ensureConnection()
      const keys = Array.isArray(key) ? key : [key]
      return await client.del(keys)
    } catch (error) {
      console.error(`Redis DEL 錯誤:`, error)
      return 0
    }
  }

  // 批量獲取
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const client = await ensureConnection()
      const values = await client.mGet(keys)

      return values.map(value => {
        if (!value) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return null
        }
      })
    } catch (error) {
      console.error('Redis MGET 錯誤:', error)
      return keys.map(() => null)
    }
  }

  // 快取存在檢查
  static async exists(key: string): Promise<boolean> {
    try {
      const client = await ensureConnection()
      return (await client.exists(key)) > 0
    } catch (error) {
      console.error(`Redis EXISTS 錯誤 [${key}]:`, error)
      return false
    }
  }

  // 設置過期時間
  static async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const client = await ensureConnection()
      return await client.expire(key, ttl)
    } catch (error) {
      console.error(`Redis EXPIRE 錯誤 [${key}]:`, error)
      return false
    }
  }

  // 清空匹配的快取
  static async clearPattern(pattern: string): Promise<number> {
    try {
      const client = await ensureConnection()
      const keys = await client.keys(pattern)

      if (keys.length === 0) return 0

      return await client.del(keys)
    } catch (error) {
      console.error(`Redis 清空模式錯誤 [${pattern}]:`, error)
      return 0
    }
  }
}

// 高級快取功能
export class AdvancedCache {
  // 快取或計算（Cache-Aside 模式）
  static async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // 嘗試從快取獲取
    const cached = await RedisCache.get<T>(key)
    if (cached) {
      console.log(`✅ 快取命中: ${key}`)
      return cached
    }

    console.log(`⚠️ 快取未命中: ${key}`)

    // 計算新值
    const value = await compute()

    // 存入快取（非阻塞）
    RedisCache.set(key, value, ttl).catch(console.error)

    return value
  }

  // 快取預熱
  static async warmup(items: Array<{ key: string; value: any; ttl: number }>) {
    console.log('🔥 開始快取預熱...')

    const results = await Promise.allSettled(
      items.map(item => RedisCache.set(item.key, item.value, item.ttl))
    )

    const success = results.filter(r => r.status === 'fulfilled').length
    console.log(`✅ 快取預熱完成: ${success}/${items.length} 成功`)
  }

  // 快取失效傳播（用於更新相關快取）
  static async invalidate(patterns: string[]) {
    console.log('🗑️ 快取失效:', patterns)

    const results = await Promise.all(
      patterns.map(pattern => RedisCache.clearPattern(pattern))
    )

    const total = results.reduce((sum, count) => sum + count, 0)
    console.log(`✅ 清除 ${total} 個快取項`)
  }

  // 快取統計
  static async getStats() {
    try {
      const client = await ensureConnection()
      const info = await client.info('stats')

      // 解析統計資訊
      const stats = {
        hits: 0,
        misses: 0,
        connections: 0,
        memory: '0',
      }

      const lines = info.split('\r\n')
      lines.forEach(line => {
        if (line.includes('keyspace_hits:')) {
          stats.hits = parseInt(line.split(':')[1])
        } else if (line.includes('keyspace_misses:')) {
          stats.misses = parseInt(line.split(':')[1])
        }
      })

      const hitRate = stats.hits / (stats.hits + stats.misses) * 100

      return {
        ...stats,
        hitRate: `${hitRate.toFixed(2)}%`,
      }
    } catch (error) {
      console.error('獲取快取統計失敗:', error)
      return null
    }
  }
}

// GraphQL 快取中間件
export async function graphqlCacheMiddleware(
  resolve: any,
  root: any,
  args: any,
  context: any,
  info: any
) {
  // 只快取查詢，不快取變更
  if (info.operation.operation !== 'query') {
    return resolve(root, args, context, info)
  }

  // 生成快取鍵
  const cacheKey = `gql:${info.fieldName}:${JSON.stringify(args)}`

  // 使用快取
  return AdvancedCache.getOrCompute(
    cacheKey,
    () => resolve(root, args, context, info),
    60 // 1 分鐘快取
  )
}

// 初始化快取預熱（應用啟動時調用）
export async function initializeCacheWarmup() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('跳過開發環境的快取預熱')
    return
  }

  try {
    // 預熱熱門產品
    const hotProductKeys = [
      'hot:products',
      'brands:all',
      'categories:all',
    ]

    // 這裡可以從資料庫載入實際資料
    await AdvancedCache.warmup([
      {
        key: 'hot:products',
        value: [], // 實際產品資料
        ttl: CacheConfig.HOT_DATA_TTL,
      },
      {
        key: 'brands:all',
        value: [], // 實際品牌資料
        ttl: CacheConfig.HOT_DATA_TTL,
      },
    ])
  } catch (error) {
    console.error('快取預熱失敗:', error)
  }
}

// 優雅關閉
export async function closeRedisConnection() {
  if (isConnected) {
    await redisClient.quit()
    isConnected = false
    console.log('✅ Redis 連接已關閉')
  }
}

// 導出客戶端（用於特殊操作）
export { redisClient }