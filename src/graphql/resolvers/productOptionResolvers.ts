/**
 * ProductOption Resolvers - 產品選項管理（鞋型、閉合方式、產品特性）
 */

import { prisma } from '@/lib/prisma'
import { ProductOptionType } from '@prisma/client'

interface Context {
  userId?: string
  userRole?: string
}

// 檢查管理員權限
function requireAdmin(context: Context) {
  if (!context.userId || context.userRole !== 'ADMIN') {
    throw new Error('需要管理員權限')
  }
}

export const productOptionResolvers = {
  Query: {
    // 取得所有產品選項（可按類型篩選）
    productOptions: async (_: any, { type }: { type?: ProductOptionType }) => {
      const where: any = { isActive: true }
      if (type) {
        where.type = type
      }

      return prisma.productOption.findMany({
        where,
        orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      })
    },

    // 取得鞋型選項
    shoeTypeOptions: async () => {
      return prisma.productOption.findMany({
        where: { type: 'SHOE_TYPE', isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    },

    // 取得閉合方式選項
    closureOptions: async () => {
      return prisma.productOption.findMany({
        where: { type: 'CLOSURE', isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    },

    // 取得產品特性選項
    featureOptions: async () => {
      return prisma.productOption.findMany({
        where: { type: 'FEATURE', isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    },
  },

  Mutation: {
    // 創建產品選項
    createProductOption: async (
      _: any,
      { input }: { input: { type: ProductOptionType; name: string; sortOrder?: number } },
      context: Context
    ) => {
      requireAdmin(context)

      // 檢查是否已存在相同類型和名稱的選項
      const existing = await prisma.productOption.findFirst({
        where: {
          type: input.type,
          name: input.name,
        },
      })

      if (existing) {
        throw new Error(`已存在相同的選項: ${input.name}`)
      }

      // 取得該類型的最大排序號
      const maxSortOrder = await prisma.productOption.aggregate({
        where: { type: input.type },
        _max: { sortOrder: true },
      })

      return prisma.productOption.create({
        data: {
          type: input.type,
          name: input.name,
          sortOrder: input.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
        },
      })
    },

    // 更新產品選項
    updateProductOption: async (
      _: any,
      { id, input }: { id: string; input: { name?: string; sortOrder?: number; isActive?: boolean } },
      context: Context
    ) => {
      requireAdmin(context)

      const option = await prisma.productOption.findUnique({
        where: { id },
      })

      if (!option) {
        throw new Error('找不到該選項')
      }

      // 如果修改名稱，檢查是否與其他選項重複
      if (input.name && input.name !== option.name) {
        const existing = await prisma.productOption.findFirst({
          where: {
            type: option.type,
            name: input.name,
            id: { not: id },
          },
        })

        if (existing) {
          throw new Error(`已存在相同的選項: ${input.name}`)
        }
      }

      return prisma.productOption.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      })
    },

    // 刪除產品選項
    deleteProductOption: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context)

      const option = await prisma.productOption.findUnique({
        where: { id },
      })

      if (!option) {
        throw new Error('找不到該選項')
      }

      await prisma.productOption.delete({
        where: { id },
      })

      return true
    },
  },
}
