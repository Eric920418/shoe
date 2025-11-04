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
        const prod = await prisma.product.findUnique({
          where: id ? { id } : { slug },
          include: {
            category: true,
            brand: true,
            variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            sizeCharts: { where: { isActive: true }, orderBy: { eu: 'asc' } },
            reviews: { where: { isApproved: true, isPublic: true }, take: 10, orderBy: { createdAt: 'desc' } },
          },
        })

        // ✅ 預先計算 totalStock
        if (prod) {
          const totalStock = prod.sizeCharts?.reduce(
            (sum, chart) => sum + chart.stock,
            0
          ) || 0
          return { ...prod, totalStock }
        }

        return prod
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
        noCache = false,
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
        noCache?: boolean
      }
    ) => {
      // 構建篩選條件
      // 如果是後台管理查詢（noCache=true），不過濾 isActive
      const filters: any = noCache ? { ...where } : { isActive: true, ...where }

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

      // 查詢資料的函數
      const fetchProducts = async () => {
        const products = await prisma.product.findMany({
          skip,
          take,
          where: filters,
          orderBy,
          include: {
            category: true,
            brand: true,
            variants: { where: { isActive: true }, take: 1 },
            sizeCharts: {
              where: { isActive: true },
              select: { stock: true }, // ✅ 載入尺碼庫存
            },
          },
        })

        // ✅ 預先計算 totalStock，避免在 resolver 中重複查詢
        return products.map(product => {
          const totalStock = product.sizeCharts?.reduce(
            (sum, chart) => sum + chart.stock,
            0
          ) || 0
          return { ...product, totalStock }
        })
      }

      // 如果需要跳過快取（例如：後台管理頁面）
      if (noCache) {
        return await fetchProducts()
      }

      // 正常情況使用快取
      const cacheParams = `${skip}:${take}:${categoryId || 'all'}:${brandId || 'all'}:${gender || 'all'}:${minPrice || ''}:${maxPrice || ''}:${search || ''}:${JSON.stringify(orderBy)}`
      return await ProductCache.getList(cacheParams, fetchProducts)
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

    // 獲取所有分類（帶快取，包含產品數量）
    categories: async (_: any, { where }: { where?: any }) => {
      return await CategoryCache.getList(async () => {
        return await prisma.category.findMany({
          where: { ...where, isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { products: { where: { isActive: true } } }
            }
          }
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

    // 獲取所有品牌（帶快取，包含產品數量）
    brands: async (_: any, { where }: { where?: any }) => {
      return await BrandCache.getList(async () => {
        return await prisma.brand.findMany({
          where: { ...where, isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { products: { where: { isActive: true } } }
            }
          }
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
        // 生成或驗證 slug
        let slug: string
        if (input.slug && input.slug.trim()) {
          // 如果用戶提供了 slug，檢查是否唯一
          const trimmedSlug = input.slug.trim()
          const existing = await prisma.product.findUnique({
            where: { slug: trimmedSlug },
            select: { id: true },
          })

          if (existing) {
            // 如果已存在，自動生成唯一 slug
            slug = await generateUniqueProductSlug(input.name)
            console.log(`Slug "${trimmedSlug}" already exists, generated new slug: ${slug}`)
          } else {
            slug = trimmedSlug
          }
        } else {
          // 如果未提供 slug，自動生成
          slug = await generateUniqueProductSlug(input.name)
        }

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

      try {
        // 確認產品存在
        const existingProduct = await prisma.product.findUnique({
          where: { id },
          select: { id: true, name: true },
        })

        if (!existingProduct) {
          throw new GraphQLError(`產品不存在 (ID: ${id})`, {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        let updateData = { ...input }

        // 處理 slug 邏輯
        if (input.slug && input.slug.trim()) {
          // 如果用戶提供了 slug，檢查是否唯一（排除自己）
          const trimmedSlug = input.slug.trim()
          const existing = await prisma.product.findUnique({
            where: { slug: trimmedSlug },
            select: { id: true },
          })

          if (existing && existing.id !== id) {
            // 如果已被其他產品使用，自動生成唯一 slug
            updateData.slug = await generateUniqueProductSlug(input.name || existingProduct.name, id)
            console.log(`Slug "${trimmedSlug}" already in use, generated new slug: ${updateData.slug}`)
          } else {
            updateData.slug = trimmedSlug
          }
        } else if (input.name) {
          // 如果只更新了名稱但沒有提供 slug，自動重新生成 slug
          updateData.slug = await generateUniqueProductSlug(input.name, id)
        }

        console.log('Updating product with data:', JSON.stringify(updateData, null, 2))

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

        console.log('Product updated successfully:', product.id)
        return product
      } catch (error: any) {
        console.error('更新產品失敗:', error)

        // 如果是我們拋出的 GraphQLError，直接重新拋出
        if (error instanceof GraphQLError) {
          throw error
        }

        // 處理 Prisma 特定錯誤
        if (error.code === 'P2025') {
          throw new GraphQLError(`產品不存在 (ID: ${id})`, {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        if (error.code === 'P2002') {
          const target = error.meta?.target || []
          throw new GraphQLError(`更新失敗：${target.join(', ')} 已經存在`, {
            extensions: { code: 'UNIQUE_CONSTRAINT_VIOLATION', target },
          })
        }

        if (error.code === 'P2003') {
          throw new GraphQLError(`更新失敗：關聯的資料不存在（可能是分類或品牌 ID 無效）`, {
            extensions: { code: 'FOREIGN_KEY_VIOLATION' },
          })
        }

        // 其他未知錯誤
        throw new GraphQLError(`更新產品失敗: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error },
        })
      }
    },

    // 刪除產品（管理員）
    deleteProduct: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      try {
        // 檢查是否有訂單項目關聯
        const orderItemCount = await prisma.orderItem.count({
          where: { productId: id },
        })

        if (orderItemCount > 0) {
          throw new GraphQLError(
            `無法刪除產品，因為還有 ${orderItemCount} 筆訂單項目使用此產品。建議改為停用產品（設為不活躍）而非刪除。`,
            { extensions: { code: 'BAD_REQUEST' } }
          )
        }

        // 檢查是否有購物車項目關聯
        const cartItemCount = await prisma.cartItem.count({
          where: { productId: id },
        })

        if (cartItemCount > 0) {
          // 購物車項目有 cascade delete，所以會自動刪除，但給予警告
          console.warn(`刪除產品 ${id} 將同時刪除 ${cartItemCount} 個購物車項目`)
        }

        // 刪除產品（如果通過檢查）
        await prisma.product.delete({ where: { id } })

        // 清除相關快取
        await ProductCache.invalidate(id)

        return true
      } catch (error: any) {
        console.error('刪除產品失敗:', error)

        // 如果是我們拋出的 GraphQLError，直接重新拋出
        if (error instanceof GraphQLError) {
          throw error
        }

        // 處理其他資料庫錯誤
        if (error.code === 'P2003') {
          throw new GraphQLError(
            '無法刪除產品，因為還有其他資料關聯到此產品（如訂單、評論等）。建議改為停用產品而非刪除。',
            { extensions: { code: 'CONSTRAINT_VIOLATION' } }
          )
        }

        if (error.code === 'P2025') {
          throw new GraphQLError('產品不存在', { extensions: { code: 'NOT_FOUND' } })
        }

        // 其他未知錯誤
        throw new GraphQLError(`刪除產品失敗: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error },
        })
      }
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
      // ✅ 優先使用預先載入的 _count（避免 N+1 查詢）
      if (category._count?.products !== undefined) {
        return category._count.products
      }
      // Fallback：單獨查詢（效能較差，但確保相容性）
      return await prisma.product.count({
        where: { categoryId: category.id, isActive: true },
      })
    },
  },

  Brand: {
    productCount: async (brand: any) => {
      // ✅ 優先使用預先載入的 _count（避免 N+1 查詢）
      if (brand._count?.products !== undefined) {
        return brand._count.products
      }
      // Fallback：單獨查詢（效能較差，但確保相容性）
      return await prisma.product.count({
        where: { brandId: brand.id, isActive: true },
      })
    },
  },

  Product: {
    totalStock: async (product: any) => {
      // 如果已經有預先計算的 totalStock，直接返回
      if (product.totalStock !== undefined) {
        return product.totalStock
      }

      // 計算所有尺碼的庫存總和
      const sizeCharts = await prisma.sizeChart.findMany({
        where: {
          productId: product.id,
          isActive: true,
        },
        select: {
          stock: true,
        },
      })

      // 加總所有尺碼庫存
      const total = sizeCharts.reduce((sum, chart) => sum + chart.stock, 0)
      return total
    },
  },
}
