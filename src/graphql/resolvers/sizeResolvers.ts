/**
 * 尺码Resolvers - 鞋店核心功能
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { ProductCache } from '@/lib/cache'

interface GraphQLContext {
  user?: { userId: string; email: string; role: string } | null
}

/**
 * 重新計算並更新產品的總庫存
 * 總庫存 = 所有尺碼的庫存總和
 */
async function updateProductTotalStock(productId: string) {
  // 查詢該產品的所有尺碼
  const sizeCharts = await prisma.sizeChart.findMany({
    where: { productId },
    select: { stock: true },
  })

  // 計算總庫存
  const totalStock = sizeCharts.reduce((sum, size) => sum + size.stock, 0)

  // 更新產品的總庫存
  await prisma.product.update({
    where: { id: productId },
    data: { stock: totalStock },
  })

  return totalStock
}

export const sizeResolvers = {
  Mutation: {
    // 創建尺碼表（管理員）
    createSizeChart: async (_: any, { input }: { input: any }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      const sizeChart = await prisma.sizeChart.create({
        data: input,
        include: {
          product: true,
        },
      })

      // ✅ 同步更新產品總庫存
      await updateProductTotalStock(input.productId)

      // ✅ 清除產品快取，確保產品列表顯示最新庫存
      await ProductCache.invalidate(input.productId)

      return sizeChart
    },

    // 更新尺碼表（管理員）
    updateSizeChart: async (_: any, { id, input }: { id: string; input: any }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 先獲取尺碼記錄以得到productId
      const existingSize = await prisma.sizeChart.findUnique({
        where: { id },
        select: { productId: true },
      })

      if (!existingSize) {
        throw new GraphQLError('尺碼記錄不存在', { extensions: { code: 'NOT_FOUND' } })
      }

      const sizeChart = await prisma.sizeChart.update({
        where: { id },
        data: input,
        include: {
          product: true,
        },
      })

      // ✅ 同步更新產品總庫存
      await updateProductTotalStock(existingSize.productId)

      // ✅ 清除產品快取，確保產品列表顯示最新庫存
      await ProductCache.invalidate(existingSize.productId)

      return sizeChart
    },

    // 刪除尺碼表（管理員）
    deleteSizeChart: async (_: any, { id }: { id: string }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 先獲取尺碼記錄以得到productId
      const existingSize = await prisma.sizeChart.findUnique({
        where: { id },
        select: { productId: true },
      })

      if (!existingSize) {
        throw new GraphQLError('尺碼記錄不存在', { extensions: { code: 'NOT_FOUND' } })
      }

      await prisma.sizeChart.delete({ where: { id } })

      // ✅ 同步更新產品總庫存
      await updateProductTotalStock(existingSize.productId)

      // ✅ 清除產品快取，確保產品列表顯示最新庫存
      await ProductCache.invalidate(existingSize.productId)

      return true
    },
  },

  SizeChart: {
    product: async (sizeChart: any) => {
      return await prisma.product.findUnique({
        where: { id: sizeChart.productId },
      })
    },
  },
}
