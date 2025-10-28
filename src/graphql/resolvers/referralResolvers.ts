/**
 * 邀請碼 Resolvers - 處理邀請碼系統的業務邏輯
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

/**
 * 生成唯一的邀請碼
 */
function generateReferralCode(userName: string): string {
  // 取用戶名前3個字符（如果有）
  const prefix = userName.slice(0, 3).toUpperCase()
  // 生成6位隨機字符
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${random}`
}

export const referralResolvers = {
  Query: {
    // 獲取我的邀請碼
    myReferralCode: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // 查找用戶的活躍邀請碼
      let referralCode = await prisma.referralCode.findFirst({
        where: {
          userId: user.userId,
          isActive: true,
        },
        include: {
          usages: {
            include: {
              referee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  createdAt: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      // 如果沒有，自動創建一個
      if (!referralCode) {
        const userData = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { name: true },
        })

        const code = generateReferralCode(userData?.name || 'USER')

        referralCode = await prisma.referralCode.create({
          data: {
            userId: user.userId,
            code,
            rewardAmount: 100,
            referrerReward: 100,
          },
          include: {
            usages: {
              include: {
                referee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        })
      }

      return referralCode
    },

    // 驗證邀請碼
    validateReferralCode: async (_: any, { code }: { code: string }) => {
      const referralCode = await prisma.referralCode.findUnique({
        where: { code },
      })

      if (!referralCode) {
        return {
          valid: false,
          message: '邀請碼不存在',
        }
      }

      if (!referralCode.isActive) {
        return {
          valid: false,
          message: '邀請碼已停用',
        }
      }

      // 邀請碼永不過期，也沒有使用上限

      return {
        valid: true,
        message: '邀請碼有效',
        rewardAmount: referralCode.rewardAmount.toNumber(),
      }
    },

    // 獲取所有邀請碼（管理員）
    referralCodes: async (
      _: any,
      { skip = 0, take = 20 }: { skip?: number; take?: number },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const [total, items] = await Promise.all([
        prisma.referralCode.count(),
        prisma.referralCode.findMany({
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            usages: {
              include: {
                referee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ])

      return {
        items,
        total,
        hasMore: skip + take < total,
      }
    },

    // 獲取邀請統計
    referralStats: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const [totalReferrals, totalRewards, pendingRewards] = await Promise.all([
        // 總邀請人數
        prisma.referralUsage.count({
          where: { referrerId: user.userId },
        }),
        // 已發放獎勵總額
        prisma.referralUsage.count({
          where: {
            referrerId: user.userId,
            rewardGranted: true,
          },
        }),
        // 待發放獎勵
        prisma.referralUsage.count({
          where: {
            referrerId: user.userId,
            rewardGranted: false,
          },
        }),
      ])

      return {
        totalReferrals,
        totalRewards: totalRewards * 100, // 假設每次獎勵 100
        pendingRewards: pendingRewards * 100,
      }
    },
  },

  Mutation: {
    // 記錄邀請碼訪問（當用戶通過邀請連結訪問時調用）
    // 這個方法只記錄訪問，不立即發放獎勵
    recordReferralVisit: async (
      _: any,
      { code }: { code: string },
      { user }: GraphQLContext
    ) => {
      // 驗證邀請碼
      const referralCode = await prisma.referralCode.findUnique({
        where: { code },
      })

      if (!referralCode || !referralCode.isActive) {
        return { success: false }
      }

      // 邀請碼永不過期，也沒有使用上限

      // 如果用戶已登入，檢查是否是自己的邀請碼
      if (user && referralCode.userId === user.userId) {
        return { success: false }
      }

      return {
        success: true,
        referrerId: referralCode.userId,
      }
    },

    // 使用邀請碼（當用戶完成首次訂單時由系統自動調用）
    // 此方法僅供內部使用，由 orderResolvers 在訂單完成時調用
    useReferralCode: async (
      _: any,
      { code, userId }: { code: string; userId: string }
    ) => {
      // 驗證邀請碼
      const referralCode = await prisma.referralCode.findUnique({
        where: { code },
      })

      if (!referralCode || !referralCode.isActive) {
        return {
          success: false,
          message: '邀請碼無效',
          creditAmount: 0,
        }
      }

      // 檢查是否已使用過邀請碼
      const existingUsage = await prisma.referralUsage.findFirst({
        where: {
          refereeId: userId,
        },
      })

      if (existingUsage) {
        return {
          success: false,
          message: '已使用過邀請碼',
          creditAmount: 0,
        }
      }

      // 檢查是否是自己的邀請碼
      if (referralCode.userId === userId) {
        return {
          success: false,
          message: '不能使用自己的邀請碼',
          creditAmount: 0,
        }
      }

      // 創建使用記錄
      const usage = await prisma.referralUsage.create({
        data: {
          referralCodeId: referralCode.id,
          referrerId: referralCode.userId,
          refereeId: userId,
        },
      })

      // 更新邀請碼使用次數
      await prisma.referralCode.update({
        where: { id: referralCode.id },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      })

      // 只發放購物金給邀請人（被邀請人不知情）
      const referrerCredit = await prisma.userCredit.create({
        data: {
          userId: referralCode.userId,
          amount: referralCode.referrerReward,
          balance: referralCode.referrerReward,
          source: 'CAMPAIGN',
          sourceId: usage.id,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

      // 更新使用記錄
      await prisma.referralUsage.update({
        where: { id: usage.id },
        data: {
          rewardGranted: true,
          creditId: referrerCredit.id,
        },
      })

      return {
        success: true,
        message: '邀請獎勵已發放',
        creditAmount: referralCode.referrerReward.toNumber(),
      }
    },

    // 更新邀請碼設定（管理員）
    updateReferralCode: async (
      _: any,
      { id, input }: { id: string; input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const updateData: any = {}
      if (input.rewardAmount !== undefined) updateData.rewardAmount = input.rewardAmount
      if (input.referrerReward !== undefined) updateData.referrerReward = input.referrerReward
      if (input.isActive !== undefined) updateData.isActive = input.isActive

      return await prisma.referralCode.update({
        where: { id },
        data: updateData,
      })
    },
  },

  ReferralCode: {
    user: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      })
    },
  },
}
