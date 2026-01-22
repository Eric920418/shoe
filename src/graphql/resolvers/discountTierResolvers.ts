import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { Context } from '@/graphql/context'

export const discountTierResolvers = {
  Query: {
    // 獲取所有滿額折扣階梯
    discountTiers: async () => {
      return prisma.discountTierConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取單個滿額折扣階梯
    discountTier: async (_: any, { id }: { id: string }) => {
      return prisma.discountTierConfig.findUnique({
        where: { id },
      })
    },

    // 獲取所有額外優惠
    additionalOffers: async () => {
      return prisma.additionalOfferConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取單個額外優惠
    additionalOffer: async (_: any, { id }: { id: string }) => {
      return prisma.additionalOfferConfig.findUnique({
        where: { id },
      })
    },

    // 獲取滿額折扣頁面完整設定
    discountPageConfig: async () => {
      const [tiers, additionalOffers] = await Promise.all([
        prisma.discountTierConfig.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.additionalOfferConfig.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
      ])

      return {
        tiers,
        additionalOffers,
      }
    },
  },

  Mutation: {
    // 創建滿額折扣階梯
    createDiscountTier: async (_: any, { input }: { input: any }, context: Context) => {
      requireAdmin(context)

      // 獲取當前最大 sortOrder
      const maxSortOrder = await prisma.discountTierConfig.aggregate({
        _max: { sortOrder: true },
      })

      return prisma.discountTierConfig.create({
        data: {
          minAmount: input.minAmount,
          discount: input.discount,
          title: input.title,
          description: input.description,
          benefits: input.benefits || [],
          bgColor: input.bgColor || 'from-green-500 to-teal-500',
          sortOrder: input.sortOrder ?? ((maxSortOrder._max.sortOrder || 0) + 1),
          isActive: input.isActive ?? true,
        },
      })
    },

    // 更新滿額折扣階梯
    updateDiscountTier: async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.discountTierConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('滿額折扣階梯不存在')
      }

      return prisma.discountTierConfig.update({
        where: { id },
        data: {
          ...(input.minAmount !== undefined && { minAmount: input.minAmount }),
          ...(input.discount !== undefined && { discount: input.discount }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.benefits !== undefined && { benefits: input.benefits }),
          ...(input.bgColor !== undefined && { bgColor: input.bgColor }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      })
    },

    // 刪除滿額折扣階梯
    deleteDiscountTier: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.discountTierConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('滿額折扣階梯不存在')
      }

      await prisma.discountTierConfig.delete({ where: { id } })
      return true
    },

    // 創建額外優惠
    createAdditionalOffer: async (_: any, { input }: { input: any }, context: Context) => {
      requireAdmin(context)

      // 獲取當前最大 sortOrder
      const maxSortOrder = await prisma.additionalOfferConfig.aggregate({
        _max: { sortOrder: true },
      })

      return prisma.additionalOfferConfig.create({
        data: {
          icon: input.icon,
          title: input.title,
          description: input.description,
          sortOrder: input.sortOrder ?? ((maxSortOrder._max.sortOrder || 0) + 1),
          isActive: input.isActive ?? true,
        },
      })
    },

    // 更新額外優惠
    updateAdditionalOffer: async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.additionalOfferConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('額外優惠不存在')
      }

      return prisma.additionalOfferConfig.update({
        where: { id },
        data: {
          ...(input.icon !== undefined && { icon: input.icon }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      })
    },

    // 刪除額外優惠
    deleteAdditionalOffer: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.additionalOfferConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('額外優惠不存在')
      }

      await prisma.additionalOfferConfig.delete({ where: { id } })
      return true
    },
  },
}
