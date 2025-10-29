import { PrismaClient } from '@prisma/client'

// 優化的 Prisma 配置
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'minimal', // 減少錯誤訊息大小
  }).$extends({
    // 查詢結果快取
    result: {
      product: {
        cacheKey: {
          needs: { id: true },
          compute(product) {
            return `product:${product.id}`
          },
        },
      },
    },
    // 自動 SELECT 優化
    query: {
      // 優化產品查詢
      product: {
        async findMany({ args, query }) {
          // 預設只選擇必要欄位
          if (!args.select && !args.include) {
            args.select = {
              id: true,
              name: true,
              slug: true,
              price: true,
              originalPrice: true,
              images: true,
              brand: true,
              isNew: true,
              isSale: true,
              _count: {
                select: {
                  reviews: true,
                },
              },
            }
          }
          return query(args)
        },
        async findUnique({ args, query }) {
          // 使用快取
          const cacheKey = `product:${args.where.id || args.where.slug}`
          const cached = await getCachedData(cacheKey)

          if (cached) {
            return cached
          }

          const result = await query(args)

          if (result) {
            await setCachedData(cacheKey, result, 300) // 5 分鐘快取
          }

          return result
        },
      },
      // 優化用戶查詢
      user: {
        async findUnique({ args, query }) {
          // 排除敏感資料
          if (!args.select) {
            args.select = {
              id: true,
              email: true,
              name: true,
              role: true,
              membershipLevel: true,
              totalSpent: true,
              createdAt: true,
              // 不包含 password
            }
          }
          return query(args)
        },
      },
      // 優化訂單查詢
      order: {
        async findMany({ args, query }) {
          // 使用分頁
          if (!args.take) {
            args.take = 20
          }

          // 預設排序
          if (!args.orderBy) {
            args.orderBy = { createdAt: 'desc' }
          }

          return query(args)
        },
      },
    },
  })
}

// 快取輔助函數（暫時使用內存快取，之後可替換為 Redis）
const cache = new Map<string, { data: any; expiry: number }>()

async function getCachedData(key: string): Promise<any> {
  const cached = cache.get(key)

  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }

  cache.delete(key)
  return null
}

async function setCachedData(key: string, data: any, ttl: number): Promise<void> {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl * 1000,
  })

  // 定期清理過期快取
  if (cache.size > 1000) {
    const now = Date.now()
    for (const [k, v] of cache.entries()) {
      if (v.expiry < now) {
        cache.delete(k)
      }
    }
  }
}

// 批量查詢優化
export async function batchGetProducts(ids: string[]) {
  const cacheKeys = ids.map(id => `product:${id}`)
  const results: any[] = []
  const missingIds: string[] = []

  // 檢查快取
  for (let i = 0; i < ids.length; i++) {
    const cached = await getCachedData(cacheKeys[i])
    if (cached) {
      results[i] = cached
    } else {
      missingIds.push(ids[i])
    }
  }

  // 批量查詢缺失的資料
  if (missingIds.length > 0) {
    const missing = await prisma.product.findMany({
      where: { id: { in: missingIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        brand: true,
      },
    })

    // 更新快取和結果
    for (const product of missing) {
      const index = ids.indexOf(product.id)
      results[index] = product
      await setCachedData(`product:${product.id}`, product, 300)
    }
  }

  return results
}

// 預載入熱門資料
export async function preloadPopularData() {
  // 預載入熱門產品
  const popularProducts = await prisma.product.findMany({
    where: { isPopular: true },
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
    },
  })

  // 快取熱門產品
  for (const product of popularProducts) {
    await setCachedData(`product:${product.id}`, product, 600)
  }

  // 預載入品牌
  const brands = await prisma.brand.findMany()
  await setCachedData('brands:all', brands, 3600)

  return { popularProducts, brands }
}

// 清理快取
export async function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// 連接池優化
declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma

// 匯出優化後的查詢方法
export const optimizedQueries = {
  // 獲取產品列表（帶快取）
  async getProducts(options: {
    take?: number
    skip?: number
    category?: string
    brand?: string
  }) {
    const cacheKey = `products:${JSON.stringify(options)}`
    const cached = await getCachedData(cacheKey)

    if (cached) return cached

    const products = await prisma.product.findMany({
      where: {
        ...(options.category && { category: options.category }),
        ...(options.brand && { brand: options.brand }),
      },
      take: options.take || 20,
      skip: options.skip || 0,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        images: true,
        brand: true,
        isNew: true,
        isSale: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    await setCachedData(cacheKey, products, 60) // 1 分鐘快取
    return products
  },

  // 獲取單個產品（帶快取）
  async getProduct(slug: string) {
    const cacheKey = `product:${slug}`
    const cached = await getCachedData(cacheKey)

    if (cached) return cached

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        sizeCharts: {
          orderBy: { eu: 'asc' },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (product) {
      await setCachedData(cacheKey, product, 300) // 5 分鐘快取
    }

    return product
  },
}