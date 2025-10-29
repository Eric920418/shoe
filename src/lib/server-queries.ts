/**
 * 伺服器端資料查詢函數
 * 直接使用 Prisma 查詢，避免在 SSR 時通過 HTTP 回打 GraphQL API
 *
 * 注意：這些函數只能在伺服器端（Server Components、Route Handlers、Server Actions）使用
 */

import { cache } from 'react'
import { prisma } from './prisma'

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

    return product
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

    return products
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

    return products
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
