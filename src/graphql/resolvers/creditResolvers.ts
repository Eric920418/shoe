/**
 * 購物金 Resolvers
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'

interface GraphQLContext {
  user?: {
    userId: string
    email: string
    role: string
  } | null
}

export const creditResolvers = {
  Query: {
    // Admin: 獲取所有購物金記錄
    credits: async (
      _: any,
      {
        userId,
        source,
        isActive,
        page = 1,
        limit = 20,
      }: {
        userId?: string
        source?: string
        isActive?: boolean
        page?: number
        limit?: number
      },
      { user }: GraphQLContext
    ) => {
      // Check admin permission
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const where: any = {}

      if (userId) {
        where.userId = userId
      }

      if (source) {
        where.source = source
      }

      if (typeof isActive === 'boolean') {
        where.isActive = isActive
      }

      const total = await prisma.userCredit.count({ where })

      const credits = await prisma.userCredit.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })

      return {
        credits,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    },

    // 用戶查詢自己的購物金
    myCredits: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const now = new Date()
      return await prisma.userCredit.findMany({
        where: {
          userId: user.userId,
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      })
    },

    // 用戶查詢可用購物金總額
    availableCreditAmount: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const now = new Date()
      const credits = await prisma.userCredit.findMany({
        where: {
          userId: user.userId,
          isActive: true,
          isUsed: false,
          validFrom: { lte: now },
          validUntil: { gte: now },
          balance: { gt: 0 },
        },
      })

      const totalAmount = credits.reduce((sum, credit) => {
        return sum + Number(credit.balance)
      }, 0)

      return totalAmount
    },
  },

  Mutation: {
    // Admin: 發放購物金給用戶
    grantCredit: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        // 檢查用戶是否存在
        const targetUser = await prisma.user.findUnique({
          where: { id: input.userId },
        })

        if (!targetUser) {
          throw new GraphQLError('用戶不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        const credit = await prisma.userCredit.create({
          data: {
            userId: input.userId,
            amount: input.amount,
            balance: input.amount,
            source: input.source || 'ADMIN_GRANT',
            sourceId: input.sourceId,
            maxUsagePerOrder: input.maxUsagePerOrder,
            minOrderAmount: input.minOrderAmount,
            validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
            validUntil: new Date(input.validUntil),
            isActive: input.isActive !== false,
          },
        })

        return credit
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('發放購物金失敗:', error)
        throw new GraphQLError('發放購物金失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: 批量發放購物金（如：給所有會員）
    batchGrantCredit: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        // 根據條件查詢用戶
        const where: any = {}

        if (input.membershipTier) {
          where.membershipTier = input.membershipTier
        }

        if (input.minTotalSpent) {
          where.totalSpent = { gte: input.minTotalSpent }
        }

        const users = await prisma.user.findMany({
          where,
          select: { id: true },
        })

        // 批量創建購物金
        const credits = await Promise.all(
          users.map((targetUser) =>
            prisma.userCredit.create({
              data: {
                userId: targetUser.id,
                amount: input.amount,
                balance: input.amount,
                source: input.source || 'ADMIN_GRANT',
                sourceId: input.sourceId,
                maxUsagePerOrder: input.maxUsagePerOrder,
                minOrderAmount: input.minOrderAmount,
                validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
                validUntil: new Date(input.validUntil),
                isActive: true,
              },
            })
          )
        )

        return {
          count: credits.length,
          credits,
        }
      } catch (error) {
        console.error('批量發放購物金失敗:', error)
        throw new GraphQLError('批量發放購物金失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: 更新購物金
    updateCredit: async (
      _: any,
      { id, input }: { id: string; input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        const updateData: any = {}

        if (input.balance !== undefined) updateData.balance = input.balance
        if (input.isActive !== undefined) updateData.isActive = input.isActive
        if (input.validUntil !== undefined) updateData.validUntil = new Date(input.validUntil)

        const credit = await prisma.userCredit.update({
          where: { id },
          data: updateData,
        })

        return credit
      } catch (error) {
        console.error('更新購物金失敗:', error)
        throw new GraphQLError('更新購物金失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: 刪除購物金（停用）
    deleteCredit: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        await prisma.userCredit.update({
          where: { id },
          data: { isActive: false },
        })

        return true
      } catch (error) {
        console.error('刪除購物金失敗:', error)
        throw new GraphQLError('刪除購物金失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },
  },

  UserCredit: {
    user: async (credit: any) => {
      return await prisma.user.findUnique({
        where: { id: credit.userId },
      })
    },
  },
}
