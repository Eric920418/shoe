/**
 * 尺码Resolvers - 鞋店核心功能
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'

interface GraphQLContext {
  user?: { userId: string; email: string; role: string } | null
}

export const sizeResolvers = {
  Mutation: {
    // 創建尺碼表（管理員）
    createSizeChart: async (_: any, { input }: { input: any }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      return await prisma.sizeChart.create({
        data: input,
        include: {
          product: true,
        },
      })
    },

    // 更新尺碼表（管理員）
    updateSizeChart: async (_: any, { id, input }: { id: string; input: any }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      return await prisma.sizeChart.update({
        where: { id },
        data: input,
        include: {
          product: true,
        },
      })
    },

    // 刪除尺碼表（管理員）
    deleteSizeChart: async (_: any, { id }: { id: string }, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', { extensions: { code: 'FORBIDDEN' } })
      }

      await prisma.sizeChart.delete({ where: { id } })
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
