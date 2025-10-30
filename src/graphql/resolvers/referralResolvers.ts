/**
 * 邀請碼 Resolvers - 處理邀請碼系統的業務邏輯
 * 支援每筆訂單獎勵 + 後台可配置
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
 * 生成唯一的邀請碼（完全隨機，不包含個人資料）
 */
async function generateUniqueReferralCode(): Promise<string> {
  // 可用字符：大寫字母和數字，排除容易混淆的字符 (0, O, 1, I, L)
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  const codeLength = 8

  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    // 生成隨機邀請碼
    let code = ''
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length)
      code += chars[randomIndex]
    }

    // 檢查是否已存在
    const existing = await prisma.referralCode.findUnique({
      where: { code },
    })

    if (!existing) {
      return code
    }

    attempts++
  }

  throw new Error('無法生成唯一邀請碼，請稍後再試')
}

/**
 * 獲取邀請碼全局設定
 */
async function getReferralSettings() {
  let settings = await prisma.referralSettings.findFirst()

  // 如果沒有設定，創建預設設定
  if (!settings) {
    settings = await prisma.referralSettings.create({
      data: {
        id: 'default_settings',
        isEnabled: true,
        rewardAmount: 100,
        minOrderAmount: 0,
        maxRewardsPerReferee: 0, // 0 = 無限制
        rewardType: 'FIXED',
        rewardPercentage: 0,
        creditValidityDays: 365,
        description: '邀請碼系統預設設定',
      },
    })
  }

  return settings
}

/**
 * 計算獎勵金額
 */
function calculateRewardAmount(settings: any, orderAmount: number): number {
  if (settings.rewardType === 'PERCENTAGE') {
    // 百分比模式
    let reward = orderAmount * (settings.rewardPercentage.toNumber() / 100)
    // 檢查是否有最大獎勵限制
    if (settings.maxRewardPerOrder) {
      reward = Math.min(reward, settings.maxRewardPerOrder.toNumber())
    }
    return reward
  } else {
    // 固定金額模式
    return settings.rewardAmount.toNumber()
  }
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
        const code = await generateUniqueReferralCode()

        referralCode = await prisma.referralCode.create({
          data: {
            userId: user.userId,
            code,
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

      // 獲取當前設定
      const settings = await getReferralSettings()

      return {
        ...referralCode,
        referrerReward: settings.rewardAmount.toNumber(),
      }
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

      const settings = await getReferralSettings()

      return {
        valid: true,
        message: '邀請碼有效',
        rewardAmount: settings.rewardAmount.toNumber(),
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

      // 獲取邀請碼
      const referralCode = await prisma.referralCode.findFirst({
        where: { userId: user.userId },
      })

      if (!referralCode) {
        return {
          totalReferrals: 0,
          totalRewards: 0,
          pendingRewards: 0,
        }
      }

      const [totalReferrals, grantedUsages, pendingUsages] = await Promise.all([
        // 總邀請人數（去重）
        prisma.referralUsage.groupBy({
          by: ['refereeId'],
          where: { referrerId: user.userId },
        }).then((result) => result.length),

        // 已發放獎勵
        prisma.referralUsage.findMany({
          where: {
            referrerId: user.userId,
            rewardGranted: true,
          },
          select: {
            rewardAmount: true,
          },
        }),

        // 待發放獎勵
        prisma.referralUsage.findMany({
          where: {
            referrerId: user.userId,
            rewardGranted: false,
          },
          select: {
            rewardAmount: true,
          },
        }),
      ])

      const totalRewards = grantedUsages.reduce(
        (sum, usage) => sum + usage.rewardAmount.toNumber(),
        0
      )
      const pendingRewards = pendingUsages.reduce(
        (sum, usage) => sum + usage.rewardAmount.toNumber(),
        0
      )

      return {
        totalReferrals,
        totalRewards,
        pendingRewards,
      }
    },

    // 獲取邀請碼全局設定（管理員）
    referralSettings: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const settings = await getReferralSettings()
      return settings
    },

    // 獲取邀請碼全局統計（管理員）
    referralGlobalStats: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 總用戶數
      const totalUsers = await prisma.user.count()

      // 總邀請碼數量
      const totalReferralCodes = await prisma.referralCode.count()

      // 總邀請人數（去重）
      const uniqueReferees = await prisma.referralUsage.groupBy({
        by: ['refereeId'],
      })
      const totalReferrals = uniqueReferees.length

      // 成功訂單數（已發放獎勵的）
      const successfulOrders = await prisma.referralUsage.count({
        where: {
          rewardGranted: true,
          orderId: { not: null },
        },
      })

      // 總獎勵金額
      const grantedRewards = await prisma.referralUsage.findMany({
        where: { rewardGranted: true },
        select: { rewardAmount: true },
      })
      const totalRewardAmount = grantedRewards.reduce(
        (sum, r) => sum + r.rewardAmount.toNumber(),
        0
      )

      // 待發放獎勵金額
      const pendingRewards = await prisma.referralUsage.findMany({
        where: { rewardGranted: false },
        select: { rewardAmount: true },
      })
      const pendingRewardAmount = pendingRewards.reduce(
        (sum, r) => sum + r.rewardAmount.toNumber(),
        0
      )

      // 平均每筆訂單獎勵
      const averageRewardPerOrder =
        successfulOrders > 0 ? totalRewardAmount / successfulOrders : 0

      // 前 10 名邀請者
      const topReferrersData = await prisma.referralUsage.groupBy({
        by: ['referrerId'],
        where: { rewardGranted: true },
        _count: { refereeId: true },
        _sum: { rewardAmount: true },
        orderBy: { _sum: { rewardAmount: 'desc' } },
        take: 10,
      })

      const topReferrers = await Promise.all(
        topReferrersData.map(async (item) => {
          const user = await prisma.user.findUnique({
            where: { id: item.referrerId },
            select: { name: true },
          })
          return {
            userId: item.referrerId,
            userName: user?.name || '未知用戶',
            referralCount: item._count.refereeId,
            totalRewards: item._sum.rewardAmount?.toNumber() || 0,
          }
        })
      )

      return {
        totalUsers,
        totalReferralCodes,
        totalReferrals,
        successfulOrders,
        totalRewardAmount,
        pendingRewardAmount,
        averageRewardPerOrder,
        topReferrers,
      }
    },
  },

  Mutation: {
    // 更新邀請碼全局設定（管理員）
    updateReferralSettings: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 獲取或創建設定
      let settings = await prisma.referralSettings.findFirst()

      if (!settings) {
        // 如果不存在，創建新設定
        settings = await prisma.referralSettings.create({
          data: {
            id: 'default_settings',
            ...input,
          },
        })
      } else {
        // 更新現有設定
        settings = await prisma.referralSettings.update({
          where: { id: settings.id },
          data: input,
        })
      }

      return settings
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

      return await prisma.referralCode.update({
        where: { id },
        data: input,
      })
    },
  },

  ReferralCode: {
    user: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      })
    },

    usages: async (parent: any) => {
      return await prisma.referralUsage.findMany({
        where: { referralCodeId: parent.id },
        orderBy: { createdAt: 'desc' },
      })
    },
  },

  ReferralUsage: {
    referralCode: async (parent: any) => {
      return await prisma.referralCode.findUnique({
        where: { id: parent.referralCodeId },
      })
    },

    referrer: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.referrerId },
      })
    },

    referee: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.refereeId },
      })
    },
  },
}

// ============================================
// 內部使用的函數（不暴露給 GraphQL API）
// ============================================

/**
 * 綁定用戶到邀請碼（註冊時調用）
 * 創建初始的邀請關係記錄，但不發放獎勵
 */
export async function bindUserToReferralCode({
  userId,
  referralCode,
}: {
  userId: string
  referralCode: string
}) {
  try {
    // 驗證邀請碼
    const referral = await prisma.referralCode.findUnique({
      where: { code: referralCode },
    })

    if (!referral || !referral.isActive) {
      console.log(`邀請碼無效或已停用: ${referralCode}`)
      return { success: false, message: '邀請碼無效' }
    }

    // 檢查是否是自己的邀請碼
    if (referral.userId === userId) {
      console.log('不能使用自己的邀請碼')
      return { success: false, message: '不能使用自己的邀請碼' }
    }

    // 檢查是否已經綁定過邀請碼
    const existing = await prisma.referralUsage.findFirst({
      where: { refereeId: userId },
    })

    if (existing) {
      console.log('用戶已經綁定過邀請碼')
      return { success: false, message: '已綁定過邀請碼' }
    }

    // 創建邀請關係記錄（不發放獎勵，等訂單完成時發放）
    await prisma.referralUsage.create({
      data: {
        referralCodeId: referral.id,
        referrerId: referral.userId,
        refereeId: userId,
        rewardGranted: false, // 註冊時不發放，等訂單完成
        rewardAmount: 0, // 訂單完成時才計算
      },
    })

    console.log(`用戶 ${userId} 成功綁定邀請碼: ${referralCode}`)
    return { success: true, message: '邀請碼綁定成功' }
  } catch (error) {
    console.error('綁定邀請碼失敗:', error)
    return { success: false, message: '綁定失敗' }
  }
}

/**
 * 處理邀請碼獎勵（由訂單系統內部調用）
 * 這個函數不應該暴露為 GraphQL mutation
 */
export async function processReferralReward({
  userId,
  orderId,
  orderAmount,
}: {
  userId: string
  orderId: string
  orderAmount: number
}) {
      // 獲取設定
      const settings = await getReferralSettings()

      // 檢查系統是否啟用
      if (!settings.isEnabled) {
        return {
          success: false,
          message: '邀請碼系統已停用',
          rewardAmount: 0,
        }
      }

      // 檢查訂單金額是否達到門檻
      if (orderAmount < settings.minOrderAmount.toNumber()) {
        return {
          success: false,
          message: `訂單金額未達門檻 $${settings.minOrderAmount}`,
          rewardAmount: 0,
        }
      }

      // 檢查用戶是否有被邀請記錄
      const existingUsage = await prisma.referralUsage.findFirst({
        where: {
          refereeId: userId,
        },
        include: {
          referralCode: true,
        },
      })

      if (!existingUsage) {
        // 沒有使用過邀請碼
        return {
          success: false,
          message: '用戶未使用邀請碼',
          rewardAmount: 0,
        }
      }

      const referralCode = existingUsage.referralCode

      // 檢查邀請碼是否有效
      if (!referralCode.isActive) {
        return {
          success: false,
          message: '邀請碼已停用',
          rewardAmount: 0,
        }
      }

      // 檢查是否已經為這筆訂單發放過獎勵
      const existingOrderReward = await prisma.referralUsage.findFirst({
        where: {
          orderId,
        },
      })

      if (existingOrderReward) {
        return {
          success: false,
          message: '該訂單已發放過獎勵',
          rewardAmount: 0,
        }
      }

      // 檢查獎勵次數上限（如果設定了）
      if (settings.maxRewardsPerReferee > 0) {
        const rewardCount = await prisma.referralUsage.count({
          where: {
            refereeId: userId,
            rewardGranted: true,
          },
        })

        if (rewardCount >= settings.maxRewardsPerReferee) {
          return {
            success: false,
            message: `已達到獎勵次數上限 (${settings.maxRewardsPerReferee} 次)`,
            rewardAmount: 0,
          }
        }
      }

      // 計算獎勵金額
      const rewardAmount = calculateRewardAmount(settings, orderAmount)

      // 創建使用記錄
      const usage = await prisma.referralUsage.create({
        data: {
          referralCodeId: referralCode.id,
          referrerId: referralCode.userId,
          refereeId: userId,
          orderId,
          orderAmount,
          rewardAmount,
          rewardGranted: false,
        },
      })

      // 發放購物金給邀請人
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + settings.creditValidityDays)

      const referrerCredit = await prisma.userCredit.create({
        data: {
          userId: referralCode.userId,
          amount: rewardAmount,
          balance: rewardAmount,
          source: 'CAMPAIGN',
          sourceId: usage.id,
          validFrom: new Date(),
          validUntil,
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

      // 更新邀請碼統計
      await prisma.referralCode.update({
        where: { id: referralCode.id },
        data: {
          usedCount: {
            increment: 1,
          },
          totalRewards: {
            increment: rewardAmount,
          },
        },
      })

      return {
        success: true,
        message: `邀請獎勵已發放：$${rewardAmount}`,
        rewardAmount,
      }
}
