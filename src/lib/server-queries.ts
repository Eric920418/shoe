/**
 * 伺服器端資料查詢函數
 * 直接使用 Prisma 查詢，避免在 SSR 時通過 HTTP 回打 GraphQL API
 *
 * 注意：這些函數只能在伺服器端（Server Components、Route Handlers、Server Actions）使用
 */

import { cache } from 'react'
import { prisma } from './prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * 將 Prisma Decimal 轉換為 number（用於序列化到 Client Components）
 */
function serializeProduct(product: any) {
  if (!product) return null

  return {
    ...product,
    price: product.price instanceof Decimal ? product.price.toNumber() : product.price,
    originalPrice: product.originalPrice instanceof Decimal ? product.originalPrice.toNumber() : product.originalPrice,
    cost: product.cost instanceof Decimal ? product.cost.toNumber() : product.cost,
    weight: product.weight instanceof Decimal ? product.weight.toNumber() : product.weight,
    heelHeight: product.heelHeight instanceof Decimal ? product.heelHeight.toNumber() : product.heelHeight,
    averageRating: product.averageRating instanceof Decimal ? product.averageRating.toNumber() : product.averageRating,
    // 確保 isFeatured 和 isNewArrival 被序列化
    isFeatured: product.isFeatured || false,
    isNewArrival: product.isNewArrival || false,
    variants: product.variants?.map((v: any) => ({
      ...v,
      priceAdjustment: v.priceAdjustment instanceof Decimal ? v.priceAdjustment.toNumber() : v.priceAdjustment,
      weight: v.weight instanceof Decimal ? v.weight.toNumber() : v.weight,
    })),
    sizeCharts: product.sizeCharts?.map((s: any) => ({
      ...s,
      footLength: s.footLength instanceof Decimal ? s.footLength.toNumber() : s.footLength,
    })),
  }
}

/**
 * 根據 slug 獲取產品詳情（包含關聯資料）
 * 使用 React cache 確保同一個請求週期內只查詢一次
 */
export const getProductBySlug = cache(async (slug: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        sizeCharts: {
          where: {
            isActive: true,
          },
          orderBy: [
            { eu: 'asc' },
          ],
        },
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return serializeProduct(product)
  } catch (error) {
    console.error('Failed to fetch product by slug:', slug, error)
    return null
  }
})

/**
 * 根據 ID 獲取產品詳情
 */
export const getProductById = cache(async (id: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        brand: true,
        category: true,
        variants: {
          where: {
            isActive: true,
          },
        },
        sizeCharts: {
          where: {
            isActive: true,
          },
        },
      },
    })

    return product
  } catch (error) {
    console.error('Failed to fetch product by id:', id, error)
    return null
  }
})

/**
 * 獲取產品列表（支援篩選和分頁）
 */
export const getProducts = cache(async (params: {
  skip?: number
  take?: number
  categoryId?: string
  brandId?: string
  minPrice?: number
  maxPrice?: number
  gender?: string
  search?: string
  isFeatured?: boolean
}) => {
  try {
    const {
      skip = 0,
      take = 20,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      gender,
      search,
      isFeatured,
    } = params

    const where: any = {
      isActive: true,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (brandId) {
      where.brandId = brandId
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) {
        where.price.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice
      }
    }

    if (gender) {
      where.gender = gender
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.product.count({ where }),
    ])

    return {
      products,
      total,
      hasMore: skip + take < total,
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return {
      products: [],
      total: 0,
      hasMore: false,
    }
  }
})

/**
 * 獲取所有品牌（包含產品數量）
 */
export const getBrands = cache(async () => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return brands.map((brand) => ({
      ...brand,
      productCount: brand._count.products,
    }))
  } catch (error) {
    console.error('Failed to fetch brands:', error)
    return []
  }
})

/**
 * 獲取所有分類（包含產品數量）
 */
export const getCategories = cache(async () => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return categories.map((category) => ({
      ...category,
      productCount: category._count.products,
    }))
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
})

/**
 * 獲取精選產品
 */
export const getFeaturedProducts = cache(async (limit: number = 10) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: limit,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // 序列化所有產品
    return products.map(serializeProduct)
  } catch (error) {
    console.error('Failed to fetch featured products:', error)
    return []
  }
})

/**
 * 獲取最新產品
 */
export const getNewArrivals = cache(async (limit: number = 10) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isNewArrival: true,
      },
      take: limit,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 序列化所有產品
    return products.map(serializeProduct)
  } catch (error) {
    console.error('Failed to fetch new arrivals:', error)
    return []
  }
})

/**
 * 獲取熱門產品（根據銷量）
 */
export const getBestSellers = cache(async (limit: number = 10) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      take: limit,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        soldCount: 'desc',
      },
    })

    return products
  } catch (error) {
    console.error('Failed to fetch best sellers:', error)
    return []
  }
})

/**
 * 獲取首頁配置
 */
export const getHomepageConfig = cache(async () => {
  try {
    const configs = await prisma.homepageConfig.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return configs
  } catch (error) {
    console.error('Failed to fetch homepage config:', error)
    return []
  }
})

/**
 * 獲取首頁產品（包含完整資料）
 */
export const getHomepageProducts = cache(async (limit: number = 25) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      take: limit,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { soldCount: 'desc' },
        { viewCount: 'desc' },
      ],
    })

    // 序列化產品
    return products.map(serializeProduct)
  } catch (error) {
    console.error('Failed to fetch homepage products:', error)
    return []
  }
})

/**
 * 獲取活動中的限時搶購
 */
export const getActiveFlashSale = cache(async () => {
  try {
    const now = new Date()
    const flashSale = await prisma.flashSale.findFirst({
      where: {
        isActive: true,
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return flashSale
  } catch (error) {
    console.error('Failed to fetch active flash sale:', error)
    return null
  }
})

/**
 * 獲取分類展示配置
 */
export const getCategoryDisplays = cache(async () => {
  try {
    const displays = await prisma.categoryDisplay.findMany({
      where: {
        showOnHomepage: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                products: {
                  where: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
      take: 8,
    })

    return displays.map((display) => ({
      ...display,
      category: {
        ...display.category,
        productCount: display.category._count.products,
      },
    }))
  } catch (error) {
    console.error('Failed to fetch category displays:', error)
    return []
  }
})
