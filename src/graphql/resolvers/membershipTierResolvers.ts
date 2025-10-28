/**
 * 會員等級管理 GraphQL Resolvers
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import {
  getAllMembershipTiers,
  clearMembershipTierCache,
  recalculateAllUsersMembershipTiers,
} from '@/lib/membership'

export const membershipTierResolvers = {
  Query: {
    /**
     * 查詢所有會員等級配置
     */
    membershipTiers: async (_: any, __: any, context: any) => {
      return await getAllMembershipTiers(true) // 強制刷新快取
    },

    /**
     * 查詢單個會員等級配置
     */
    membershipTier: async (_: any, { id }: { id: string }, context: any) => {
      const tier = await prisma.membershipTierConfig.findUnique({
        where: { id },
      })

      if (!tier) {
        throw new GraphQLError(`找不到會員等級：${id}`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return tier
    },
  },

  Mutation: {
    /**
     * 創建新的會員等級
     */
    createMembershipTier: async (
      _: any,
      {
        input,
      }: {
        input: {
          name: string
          slug: string
          minSpent: number
          maxSpent?: number | null
          discount?: number
          pointsMultiplier?: number
          freeShippingThreshold?: number
          birthdayGift?: number
          sortOrder: number
          color?: string | null
          icon?: string | null
          description?: string | null
        }
      },
      context: any
    ) => {
      // 檢查權限
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('只有管理員可以創建會員等級', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 檢查 slug 是否已存在
      const existingTier = await prisma.membershipTierConfig.findUnique({
        where: { slug: input.slug },
      })

      if (existingTier) {
        throw new GraphQLError(`會員等級標識符 "${input.slug}" 已存在，請使用不同的標識符`, {
          extensions: { code: 'DUPLICATE_SLUG' },
        })
      }

      // 檢查名稱是否已存在
      const existingName = await prisma.membershipTierConfig.findUnique({
        where: { name: input.name },
      })

      if (existingName) {
        throw new GraphQLError(`會員等級名稱 "${input.name}" 已存在`, {
          extensions: { code: 'DUPLICATE_NAME' },
        })
      }

      // 創建新等級
      const newTier = await prisma.membershipTierConfig.create({
        data: {
          name: input.name,
          slug: input.slug,
          minSpent: input.minSpent,
          maxSpent: input.maxSpent,
          discount: input.discount || 0,
          pointsMultiplier: input.pointsMultiplier || 1.0,
          freeShippingThreshold: input.freeShippingThreshold || 0,
          birthdayGift: input.birthdayGift || 0,
          sortOrder: input.sortOrder,
          color: input.color,
          icon: input.icon,
          description: input.description,
        },
      })

      // 清除快取
      clearMembershipTierCache()

      return newTier
    },

    /**
     * 更新會員等級配置
     */
    updateMembershipTier: async (
      _: any,
      {
        id,
        input,
      }: {
        id: string
        input: {
          name?: string
          slug?: string
          minSpent?: number
          maxSpent?: number | null
          discount?: number
          pointsMultiplier?: number
          freeShippingThreshold?: number
          birthdayGift?: number
          sortOrder?: number
          color?: string | null
          icon?: string | null
          description?: string | null
          isActive?: boolean
        }
      },
      context: any
    ) => {
      // 檢查權限
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('只有管理員可以更新會員等級', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 檢查等級是否存在
      const existingTier = await prisma.membershipTierConfig.findUnique({
        where: { id },
      })

      if (!existingTier) {
        throw new GraphQLError(`找不到會員等級：${id}`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 如果更新 slug，檢查是否重複
      if (input.slug && input.slug !== existingTier.slug) {
        const duplicateSlug = await prisma.membershipTierConfig.findUnique({
          where: { slug: input.slug },
        })

        if (duplicateSlug) {
          throw new GraphQLError(`會員等級標識符 "${input.slug}" 已存在`, {
            extensions: { code: 'DUPLICATE_SLUG' },
          })
        }
      }

      // 如果更新名稱，檢查是否重複
      if (input.name && input.name !== existingTier.name) {
        const duplicateName = await prisma.membershipTierConfig.findUnique({
          where: { name: input.name },
        })

        if (duplicateName) {
          throw new GraphQLError(`會員等級名稱 "${input.name}" 已存在`, {
            extensions: { code: 'DUPLICATE_NAME' },
          })
        }
      }

      // 更新等級
      const updatedTier = await prisma.membershipTierConfig.update({
        where: { id },
        data: {
          ...input,
        },
      })

      // 清除快取
      clearMembershipTierCache()

      return updatedTier
    },

    /**
     * 刪除會員等級
     */
    deleteMembershipTier: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      // 檢查權限
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('只有管理員可以刪除會員等級', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 檢查是否有用戶使用此等級
      const usersCount = await prisma.user.count({
        where: { membershipTierId: id },
      })

      if (usersCount > 0) {
        throw new GraphQLError(
          `無法刪除此會員等級，因為有 ${usersCount} 位用戶正在使用此等級。請先將這些用戶移動到其他等級。`,
          {
            extensions: { code: 'HAS_USERS' },
          }
        )
      }

      // 刪除等級
      await prisma.membershipTierConfig.delete({
        where: { id },
      })

      // 清除快取
      clearMembershipTierCache()

      return true
    },

    /**
     * 重新計算所有用戶的會員等級
     * （當門檻變更時使用）
     */
    recalculateAllMembershipTiers: async (
      _: any,
      __: any,
      context: any
    ) => {
      // 檢查權限
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('只有管理員可以重新計算會員等級', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 執行重算
      const updatedCount = await recalculateAllUsersMembershipTiers()

      return {
        success: true,
        message: `成功重新計算 ${updatedCount} 位用戶的會員等級`,
        updatedCount,
      }
    },
  },
}
