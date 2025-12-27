/**
 * SKU 庫存管理 Resolvers
 * 處理顏色 × 尺碼組合的庫存管理
 */

import { prisma } from '@/lib/prisma'
import { Context } from '../context'
import { GraphQLError } from 'graphql'
import { ProductCache } from '@/lib/cache'

// 驗證管理員權限
function requireAdmin(context: Context) {
  if (!context.user || context.user.role !== 'ADMIN') {
    throw new GraphQLError('需要管理員權限')
  }
}

export const skuResolvers = {
  Query: {
    // 獲取產品的所有 SKU
    productSkus: async (_: any, { productId }: { productId: string }) => {
      return await prisma.productSku.findMany({
        where: { productId },
        include: {
          variant: true,
          sizeChart: true,
        },
        orderBy: [
          { variant: { sortOrder: 'asc' } },
          { sizeChart: { sortOrder: 'asc' } },
        ],
      })
    },

    // 獲取產品的 SKU 矩陣
    skuMatrix: async (_: any, { productId }: { productId: string }) => {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          sizeCharts: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          skus: {
            include: {
              variant: true,
              sizeChart: true,
            },
          },
        },
      })

      if (!product) {
        throw new GraphQLError('產品不存在')
      }

      const totalStock = product.skus.reduce((sum, sku) => sum + sku.stock, 0)

      return {
        productId: product.id,
        productName: product.name,
        variants: product.variants,
        sizes: product.sizeCharts,
        skus: product.skus,
        totalStock,
        totalVariants: product.variants.length,
        totalSizes: product.sizeCharts.length,
      }
    },

    // 獲取單個 SKU
    sku: async (_: any, { id }: { id: string }) => {
      return await prisma.productSku.findUnique({
        where: { id },
        include: {
          product: true,
          variant: true,
          sizeChart: true,
        },
      })
    },

    // 根據顏色和尺碼獲取 SKU
    skuByVariantAndSize: async (
      _: any,
      { productId, variantId, sizeChartId }: { productId: string; variantId: string; sizeChartId: string }
    ) => {
      return await prisma.productSku.findUnique({
        where: {
          productId_variantId_sizeChartId: {
            productId,
            variantId,
            sizeChartId,
          },
        },
        include: {
          product: true,
          variant: true,
          sizeChart: true,
        },
      })
    },
  },

  Mutation: {
    // 更新單個 SKU 庫存
    updateSkuStock: async (
      _: any,
      { skuId, stock }: { skuId: string; stock: number },
      context: Context
    ) => {
      requireAdmin(context)

      if (stock < 0) {
        throw new GraphQLError('庫存不能為負數')
      }

      const sku = await prisma.productSku.update({
        where: { id: skuId },
        data: { stock },
        include: {
          variant: true,
          sizeChart: true,
        },
      })

      // ✅ 清除產品快取，確保產品列表顯示最新庫存
      await ProductCache.invalidate(sku.productId)

      return sku
    },

    // 批量更新 SKU 庫存
    batchUpdateSkuStock: async (
      _: any,
      { productId, updates }: { productId: string; updates: Array<{ skuId: string; stock: number }> },
      context: Context
    ) => {
      requireAdmin(context)

      // 驗證所有庫存不為負數
      for (const update of updates) {
        if (update.stock < 0) {
          throw new GraphQLError(`庫存不能為負數 (SKU ID: ${update.skuId})`)
        }
      }

      // 使用事務批量更新
      const updatedSkus = await prisma.$transaction(
        updates.map((update) =>
          prisma.productSku.update({
            where: { id: update.skuId },
            data: { stock: update.stock },
            include: {
              variant: true,
              sizeChart: true,
            },
          })
        )
      )

      // ✅ 清除產品快取，確保產品列表顯示最新庫存
      await ProductCache.invalidate(productId)

      return updatedSkus
    },

    // 自動生成產品的所有 SKU 組合
    generateSkus: async (
      _: any,
      { productId }: { productId: string },
      context: Context
    ) => {
      requireAdmin(context)

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          variants: { where: { isActive: true } },
          sizeCharts: { where: { isActive: true } },
        },
      })

      if (!product) {
        throw new GraphQLError('產品不存在')
      }

      if (product.variants.length === 0) {
        throw new GraphQLError('產品沒有顏色變體，請先新增顏色')
      }

      if (product.sizeCharts.length === 0) {
        throw new GraphQLError('產品沒有尺碼，請先新增尺碼')
      }

      let created = 0
      let skipped = 0
      const createdSkus: any[] = []

      for (const variant of product.variants) {
        for (const sizeChart of product.sizeCharts) {
          // 檢查是否已存在
          const existing = await prisma.productSku.findUnique({
            where: {
              productId_variantId_sizeChartId: {
                productId,
                variantId: variant.id,
                sizeChartId: sizeChart.id,
              },
            },
          })

          if (existing) {
            skipped++
            continue
          }

          // 創建 SKU
          const sku = await prisma.productSku.create({
            data: {
              productId,
              variantId: variant.id,
              sizeChartId: sizeChart.id,
              stock: 0,
              isActive: true,
            },
            include: {
              variant: true,
              sizeChart: true,
            },
          })

          createdSkus.push(sku)
          created++
        }
      }

      // ✅ 清除產品快取，確保產品列表顯示最新 SKU 資訊
      await ProductCache.invalidate(productId)

      return {
        created,
        skipped,
        skus: createdSkus,
      }
    },

    // 刪除 SKU
    deleteSku: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context)

      // 先獲取 productId 以便清除快取
      const sku = await prisma.productSku.findUnique({
        where: { id },
        select: { productId: true },
      })

      await prisma.productSku.delete({
        where: { id },
      })

      // ✅ 清除產品快取
      if (sku) {
        await ProductCache.invalidate(sku.productId)
      }

      return true
    },
  },

  // ProductSku 關聯解析
  ProductSku: {
    product: async (sku: any) => {
      if (sku.product) return sku.product
      return await prisma.product.findUnique({
        where: { id: sku.productId },
      })
    },
    variant: async (sku: any) => {
      if (sku.variant) return sku.variant
      return await prisma.productVariant.findUnique({
        where: { id: sku.variantId },
      })
    },
    sizeChart: async (sku: any) => {
      if (sku.sizeChart) return sku.sizeChart
      return await prisma.sizeChart.findUnique({
        where: { id: sku.sizeChartId },
      })
    },
  },
}
