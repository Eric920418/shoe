/**
 * 產品 Resolvers - 處理產品查詢和管理
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { ProductCache, CategoryCache, BrandCache, SizeChartCache } from '@/lib/cache'
import { generateUniqueBrandSlug, generateUniqueCategorySlug, generateUniqueProductSlug } from '@/lib/slugify'

interface GraphQLContext {
  userId: string | null
  userRole: string | null
  userEmail: string | null
}

export const productResolvers = {
  Query: {
    // 獲取單個產品（帶快取）
    product: async (_: any, { id, slug }: { id?: string; slug?: string }) => {
      if (!id && !slug) {
        throw new GraphQLError('必須提供id或slug', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      const cacheKey = id || slug!
      const product = await ProductCache.get(cacheKey, async () => {
        return await prisma.product.findUnique({
          where: id ? { id } : { slug },
          include: {
            category: true,
            brand: true,
            variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            sizeCharts: { where: { isActive: true }, orderBy: { eu: 'asc' } },
            reviews: { where: { isApproved: true, isPublic: true }, take: 10, orderBy: { createdAt: 'desc' } },
          },
        })
      })

      if (!product) {
        throw new GraphQLError('產品不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 異步增加瀏覽次數（不阻塞響應）
      prisma.product.update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      }).catch(err => console.error('更新瀏覽次數失敗:', err))

      return product
    },

    // 獲取產品列表
    products: async (
      _: any,
      {
        skip = 0,
        take = 20,
        categoryId,
        brandId,
        minPrice,
        maxPrice,
        gender,
        search,
        where,
        orderBy = { createdAt: 'desc' },
      }: {
        skip?: number
        take?: number
        categoryId?: string
        brandId?: string
        minPrice?: number
        maxPrice?: number
        gender?: string
        search?: string
        where?: any
        orderBy?: any
      }
    ) => {
      // 構建篩選條件
      const filters: any = { isActive: true, ...where }

      // 分類篩選
      if (categoryId) {
        filters.categoryId = categoryId
      }

      // 品牌篩選
      if (brandId) {
        filters.brandId = brandId
      }

      // 性別篩選
      if (gender) {
        filters.gender = gender
      }

      // 價格範圍篩選
      if (minPrice !== undefined || maxPrice !== undefined) {
        filters.price = {}
        if (minPrice !== undefined) {
          filters.price.gte = minPrice
        }
        if (maxPrice !== undefined) {
          filters.price.lte = maxPrice
        }
      }

      // 關鍵字搜尋（搜尋產品名稱和描述）
      if (search) {
        filters.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      return await prisma.product.findMany({
        skip,
        take,
        where: filters,
        orderBy,
        include: {
          category: true,
          brand: true,
          variants: { where: { isActive: true }, take: 1 },
        },
      })
    },

    // 獲取分類
    category: async (_: any, { id, slug }: { id?: string; slug?: string }) => {
      return await prisma.category.findUnique({
        where: id ? { id } : { slug },
        include: {
          products: {
            where: { isActive: true },
            take: 10,
            include: { brand: true },
          },
        },
      })
    },

    // 獲取所有分類（帶快取）
    categories: async (_: any, { where }: { where?: any }) => {
      return await CategoryCache.getList(async () => {
        return await prisma.category.findMany({
          where: { ...where, isActive: true },
          orderBy: { sortOrder: 'asc' },
        })
      })
    },

    // 獲取品牌
    brand: async (_: any, { id, slug }: { id?: string; slug?: string }) => {
      return await prisma.brand.findUnique({
        where: id ? { id } : { slug },
        include: {
          products: {
            where: { isActive: true },
            take: 10,
          },
        },
      })
    },

    // 獲取所有品牌（帶快取）
    brands: async (_: any, { where }: { where?: any }) => {
      return await BrandCache.getList(async () => {
        return await prisma.brand.findMany({
          where: { ...where, isActive: true },
          orderBy: { sortOrder: 'asc' },
        })
      })
    },

    // 獲取產品尺碼表
    productSizeChart: async (_: any, { productId, variantId }: { productId: string; variantId?: string }) => {
      return await prisma.sizeChart.findMany({
        where: {
          productId,
          variantId: variantId || null,
          isActive: true,
        },
        orderBy: { eu: 'asc' },
      })
    },
  },

  Mutation: {
    // 創建產品（管理員）
    createProduct: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      try {
        // 自動生成 slug（如果未提供）
        const slug = input.slug || await generateUniqueProductSlug(input.name)

        // 資料驗證和清理
        const cleanedInput = {
          ...input,
          slug,
          images: input.images || [],
          features: input.features || [],
          // 確保 gender 是有效的 enum 值或 null
          gender: input.gender || null,
          // 其他可選欄位
          shoeType: input.shoeType || null,
          season: input.season || null,
          heelHeight: input.heelHeight || null,
          closure: input.closure || null,
          sole: input.sole || null,
        }

        console.log('Creating product with input:', JSON.stringify(cleanedInput, null, 2))

        const product = await prisma.product.create({
          data: cleanedInput,
          include: {
            category: true,
            brand: true,
          },
        })

        // 清除相關快取
        await ProductCache.invalidate()

        console.log('Product created successfully:', product.id)
        return product
      } catch (error: any) {
        console.error('創建產品失敗:', error)
        throw new GraphQLError(`創建產品失敗: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error },
        })
      }
    },

    // 更新產品（管理員）
    updateProduct: async (_: any, { id, input }: { id: string; input: any }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 如果更新了名稱且沒有提供 slug，自動重新生成 slug
      let updateData = { ...input }
      if (input.name && !input.slug) {
        updateData.slug = await generateUniqueProductSlug(input.name, id)
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          brand: true,
        },
      })

      // 清除相關快取
      await ProductCache.invalidate(id)

      return product
    },

    // 刪除產品（管理員）
    deleteProduct: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      await prisma.product.delete({ where: { id } })

      // 清除相關快取
      await ProductCache.invalidate(id)

      return true
    },

    // 創建分類（管理員）
    createCategory: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 自動生成 slug（如果未提供）
      const slug = input.slug || await generateUniqueCategorySlug(input.name)

      const category = await prisma.category.create({
        data: {
          ...input,
          slug,
        },
      })

      // 清除分類快取
      await CategoryCache.invalidate()

      return category
    },

    // 更新分類（管理員）
    updateCategory: async (_: any, { id, input }: { id: string; input: any }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 如果更新了名稱且沒有提供 slug，自動重新生成 slug
      let updateData = { ...input }
      if (input.name && !input.slug) {
        updateData.slug = await generateUniqueCategorySlug(input.name, id)
      }

      const category = await prisma.category.update({
        where: { id },
        data: updateData,
      })

      // 清除分類快取
      await CategoryCache.invalidate()

      return category
    },

    // 刪除分類（管理員）
    deleteCategory: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      await prisma.category.delete({ where: { id } })
      return true
    },

    // 創建品牌（管理員）
    createBrand: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      try {
        // 自動生成 slug（如果未提供）
        const slug = input.slug || await generateUniqueBrandSlug(input.name)

        const brand = await prisma.brand.create({
          data: {
            ...input,
            slug,
            sortOrder: input.sortOrder || 0,
          },
        })

        // 清除品牌快取
        await BrandCache.invalidate()

        return brand
      } catch (error: any) {
        console.error('創建品牌失敗:', error)
        throw new GraphQLError(`創建品牌失敗: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error },
        })
      }
    },

    // 更新品牌（管理員）
    updateBrand: async (_: any, { id, input }: { id: string; input: any }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      try {
        // 如果更新了名稱且沒有提供 slug，自動重新生成 slug
        let updateData = { ...input }
        if (input.name && !input.slug) {
          updateData.slug = await generateUniqueBrandSlug(input.name, id)
        }

        const brand = await prisma.brand.update({
          where: { id },
          data: updateData,
        })

        // 清除品牌快取
        await BrandCache.invalidate()

        return brand
      } catch (error: any) {
        console.error('更新品牌失敗:', error)
        throw new GraphQLError(`更新品牌失敗: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error },
        })
      }
    },

    // 刪除品牌（管理員）
    deleteBrand: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      try {
        // 檢查是否有產品關聯
        const productCount = await prisma.product.count({
          where: { brandId: id },
        })

        if (productCount > 0) {
          throw new GraphQLError(`無法刪除品牌，因為還有 ${productCount} 個產品使用此品牌`, {
            extensions: { code: 'BAD_REQUEST' },
          })
        }

        await prisma.brand.delete({ where: { id } })

        // 清除品牌快取
        await BrandCache.invalidate()

        return true
      } catch (error: any) {
        console.error('刪除品牌失敗:', error)
        if (error instanceof GraphQLError) {
          throw error
        }
        throw new GraphQLError(`刪除品牌失敗: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error },
        })
      }
    },
  },

  // 移除 Product.category 和 Product.brand 的 field resolver
  // 因為已經在查詢中使用 include，不需要額外查詢，避免 N+1 問題

  Category: {
    productCount: async (category: any) => {
      // 使用快取優化（如果已有 _count，直接返回）
      if (category._count?.products !== undefined) {
        return category._count.products
      }
      return await prisma.product.count({
        where: { categoryId: category.id, isActive: true },
      })
    },
  },

  Brand: {
    productCount: async (brand: any) => {
      // 使用快取優化（如果已有 _count，直接返回）
      if (brand._count?.products !== undefined) {
        return brand._count.products
      }
      return await prisma.product.count({
        where: { brandId: brand.id, isActive: true },
      })
    },
  },
}
