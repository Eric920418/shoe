import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { Context } from '@/graphql/context'

export const rewardsPageResolvers = {
  Query: {
    // 獲取所有回饋福利
    rewardBenefits: async () => {
      return prisma.rewardBenefitConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取單個回饋福利
    rewardBenefit: async (_: any, { id }: { id: string }) => {
      return prisma.rewardBenefitConfig.findUnique({
        where: { id },
      })
    },

    // 獲取所有使用說明
    rewardUsageNotes: async () => {
      return prisma.rewardUsageNoteConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取單個使用說明
    rewardUsageNote: async (_: any, { id }: { id: string }) => {
      return prisma.rewardUsageNoteConfig.findUnique({
        where: { id },
      })
    },

    // 獲取購物金回饋頁面完整設定
    rewardsPageConfig: async () => {
      const [benefits, usageNotes, membershipTiers] = await Promise.all([
        prisma.rewardBenefitConfig.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.rewardUsageNoteConfig.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.membershipTierConfig.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
      ])

      return {
        benefits,
        usageNotes,
        membershipTiers,
      }
    },
  },

  Mutation: {
    // 創建回饋福利
    createRewardBenefit: async (_: any, { input }: { input: any }, context: Context) => {
      requireAdmin(context)

      const maxSortOrder = await prisma.rewardBenefitConfig.aggregate({
        _max: { sortOrder: true },
      })

      return prisma.rewardBenefitConfig.create({
        data: {
          icon: input.icon,
          title: input.title,
          description: input.description,
          sortOrder: input.sortOrder ?? ((maxSortOrder._max.sortOrder || 0) + 1),
          isActive: input.isActive ?? true,
        },
      })
    },

    // 更新回饋福利
    updateRewardBenefit: async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.rewardBenefitConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('回饋福利不存在')
      }

      return prisma.rewardBenefitConfig.update({
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

    // 刪除回饋福利
    deleteRewardBenefit: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.rewardBenefitConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('回饋福利不存在')
      }

      await prisma.rewardBenefitConfig.delete({ where: { id } })
      return true
    },

    // 創建使用說明
    createRewardUsageNote: async (_: any, { input }: { input: any }, context: Context) => {
      requireAdmin(context)

      const maxSortOrder = await prisma.rewardUsageNoteConfig.aggregate({
        _max: { sortOrder: true },
      })

      return prisma.rewardUsageNoteConfig.create({
        data: {
          content: input.content,
          sortOrder: input.sortOrder ?? ((maxSortOrder._max.sortOrder || 0) + 1),
          isActive: input.isActive ?? true,
        },
      })
    },

    // 更新使用說明
    updateRewardUsageNote: async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.rewardUsageNoteConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('使用說明不存在')
      }

      return prisma.rewardUsageNoteConfig.update({
        where: { id },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      })
    },

    // 刪除使用說明
    deleteRewardUsageNote: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context)

      const existing = await prisma.rewardUsageNoteConfig.findUnique({ where: { id } })
      if (!existing) {
        throw new GraphQLError('使用說明不存在')
      }

      await prisma.rewardUsageNoteConfig.delete({ where: { id } })
      return true
    },
  },
}
