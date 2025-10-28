/**
 * Redis 快取包裝器 - 提供統一的快取介面
 */

import { cacheGet, cacheSet, cacheDel } from './redis'

// 快取鍵前綴
const CACHE_PREFIX = {
  PRODUCT: 'product:',
  PRODUCTS: 'products:',
  CATEGORY: 'category:',
  CATEGORIES: 'categories:',
  BRAND: 'brand:',
  BRANDS: 'brands:',
  SIZE_CHART: 'size_chart:',
}

// 快取過期時間（秒）
const CACHE_TTL = {
  PRODUCT: 3600,        // 1小時
  PRODUCTS: 600,        // 10分鐘
  CATEGORY: 7200,       // 2小時
  CATEGORIES: 3600,     // 1小時
  BRAND: 7200,          // 2小時
  BRANDS: 3600,         // 1小時
  SIZE_CHART: 1800,     // 30分鐘
}

/**
 * 獲取帶快取的資料
 * @param key 快取鍵
 * @param fetcher 獲取資料的函數
 * @param ttl 快取時間（秒）
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  try {
    // 嘗試從快取獲取
    const cached = await cacheGet<T>(key)
    if (cached !== null) {
      console.log(`[Cache HIT] ${key}`)
      return cached
    }

    console.log(`[Cache MISS] ${key}`)
    // 快取未命中，執行查詢
    const data = await fetcher()

    // 存入快取
    await cacheSet(key, data, ttl)

    return data
  } catch (error) {
    console.error(`[Cache ERROR] ${key}:`, error)
    // 快取失敗時直接返回資料
    return await fetcher()
  }
}

/**
 * 使快取失效
 */
export async function invalidateCache(pattern: string) {
  try {
    await cacheDel(pattern)
    console.log(`[Cache INVALIDATE] ${pattern}`)
  } catch (error) {
    console.error(`[Cache INVALIDATE ERROR] ${pattern}:`, error)
  }
}

/**
 * 產品快取工具
 */
export const ProductCache = {
  // 獲取單個產品
  async get(id: string, fetcher: () => Promise<any>) {
    return getCached(
      `${CACHE_PREFIX.PRODUCT}${id}`,
      fetcher,
      CACHE_TTL.PRODUCT
    )
  },

  // 獲取產品列表
  async getList(params: string, fetcher: () => Promise<any>) {
    return getCached(
      `${CACHE_PREFIX.PRODUCTS}${params}`,
      fetcher,
      CACHE_TTL.PRODUCTS
    )
  },

  // 清除產品快取
  async invalidate(id?: string) {
    if (id) {
      await invalidateCache(`${CACHE_PREFIX.PRODUCT}${id}`)
    }
    // 清除所有產品列表快取
    await invalidateCache(`${CACHE_PREFIX.PRODUCTS}*`)
  },
}

/**
 * 分類快取工具
 */
export const CategoryCache = {
  // 獲取單個分類
  async get(id: string, fetcher: () => Promise<any>) {
    return getCached(
      `${CACHE_PREFIX.CATEGORY}${id}`,
      fetcher,
      CACHE_TTL.CATEGORY
    )
  },

  // 獲取分類列表
  async getList(fetcher: () => Promise<any>) {
    return getCached(
      CACHE_PREFIX.CATEGORIES,
      fetcher,
      CACHE_TTL.CATEGORIES
    )
  },

  // 清除分類快取
  async invalidate(id?: string) {
    if (id) {
      await invalidateCache(`${CACHE_PREFIX.CATEGORY}${id}`)
    }
    await invalidateCache(CACHE_PREFIX.CATEGORIES)
  },
}

/**
 * 品牌快取工具
 */
export const BrandCache = {
  // 獲取單個品牌
  async get(id: string, fetcher: () => Promise<any>) {
    return getCached(
      `${CACHE_PREFIX.BRAND}${id}`,
      fetcher,
      CACHE_TTL.BRAND
    )
  },

  // 獲取品牌列表
  async getList(fetcher: () => Promise<any>) {
    return getCached(
      CACHE_PREFIX.BRANDS,
      fetcher,
      CACHE_TTL.BRANDS
    )
  },

  // 清除品牌快取
  async invalidate(id?: string) {
    if (id) {
      await invalidateCache(`${CACHE_PREFIX.BRAND}${id}`)
    }
    await invalidateCache(CACHE_PREFIX.BRANDS)
  },
}

/**
 * 尺碼表快取工具
 */
export const SizeChartCache = {
  // 獲取產品尺碼表
  async get(productId: string, variantId: string | undefined, fetcher: () => Promise<any>) {
    const key = variantId
      ? `${CACHE_PREFIX.SIZE_CHART}${productId}:${variantId}`
      : `${CACHE_PREFIX.SIZE_CHART}${productId}`
    return getCached(key, fetcher, CACHE_TTL.SIZE_CHART)
  },

  // 清除尺碼表快取
  async invalidate(productId: string) {
    await invalidateCache(`${CACHE_PREFIX.SIZE_CHART}${productId}*`)
  },
}
