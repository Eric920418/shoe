/**
 * 尺码Resolvers - 簡化版（只管理尺寸名稱）
 * 庫存由 SKU 矩陣統一管理
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { ProductCache } from '@/lib/cache'

interface GraphQLContext {
  user?: { userId: string; email: string; role: string } | null
}

interface CreateSizeChartInput {
  productId: string
  size: string
  sortOrder?: number
}

interface UpdateSizeChartInput {
  size?: string
  sortOrder?: number
  isActive?: boolean
}

export const sizeResolvers = {
  Mutation: {
    // 創建尺碼（管理員）
    createSizeChart: async (_: any, { input }: { input: CreateSizeChartInput }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 檢查產品是否存在
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
      })

      if (!product) {
        throw new GraphQLError('產品不存在', { extensions: { code: 'NOT_FOUND' } })
      }

      // 檢查尺寸是否已存在
      const existingSize = await prisma.sizeChart.findFirst({
        where: {
          productId: input.productId,
          size: input.size,
        },
      })

      if (existingSize) {
        throw new GraphQLError(`尺寸 "${input.size}" 已存在`, { extensions: { code: 'BAD_USER_INPUT' } })
      }

      // 取得目前最大的 sortOrder
      const maxSortOrder = await prisma.sizeChart.findFirst({
        where: { productId: input.productId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })

      const sizeChart = await prisma.sizeChart.create({
        data: {
          productId: input.productId,
          size: input.size,
          sortOrder: input.sortOrder ?? (maxSortOrder?.sortOrder ?? 0) + 1,
        },
        include: {
          product: true,
        },
      })

      // 清除產品快取
      await ProductCache.invalidate(input.productId)

      return sizeChart
    },

    // 更新尺碼（管理員）
    updateSizeChart: async (_: any, { id, input }: { id: string; input: UpdateSizeChartInput }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 先獲取尺碼記錄
      const existingSize = await prisma.sizeChart.findUnique({
        where: { id },
        select: { productId: true, size: true },
      })

      if (!existingSize) {
        throw new GraphQLError('尺碼記錄不存在', { extensions: { code: 'NOT_FOUND' } })
      }

      // 如果要更新尺寸，檢查是否有重複
      if (input.size && input.size !== existingSize.size) {
        const duplicate = await prisma.sizeChart.findFirst({
          where: {
            productId: existingSize.productId,
            size: input.size,
            id: { not: id },
          },
        })

        if (duplicate) {
          throw new GraphQLError(`尺寸 "${input.size}" 已存在`, { extensions: { code: 'BAD_USER_INPUT' } })
        }
      }

      const sizeChart = await prisma.sizeChart.update({
        where: { id },
        data: input,
        include: {
          product: true,
        },
      })

      // 清除產品快取
      await ProductCache.invalidate(existingSize.productId)

      return sizeChart
    },

    // 刪除尺碼（管理員）
    deleteSizeChart: async (_: any, { id }: { id: string }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      // 先獲取尺碼記錄
      const existingSize = await prisma.sizeChart.findUnique({
        where: { id },
        select: { productId: true },
      })

      if (!existingSize) {
        throw new GraphQLError('尺碼記錄不存在', { extensions: { code: 'NOT_FOUND' } })
      }

      // 檢查是否有 SKU 使用此尺碼
      const skuCount = await prisma.productSku.count({
        where: { sizeChartId: id },
      })

      if (skuCount > 0) {
        throw new GraphQLError(`此尺碼有 ${skuCount} 個 SKU 庫存記錄，請先刪除相關 SKU`, { extensions: { code: 'BAD_USER_INPUT' } })
      }

      await prisma.sizeChart.delete({ where: { id } })

      // 清除產品快取
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
