/**
 * 優惠券 Resolvers
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

export const couponResolvers = {
  Query: {
    // Admin: 獲取所有優惠券（含停用、私人）
    coupons: async (
      _: any,
      {
        search,
        type,
        isActive,
        page = 1,
        limit = 20,
      }: {
        search?: string
        type?: string
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

      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (type) {
        where.type = type
      }

      if (typeof isActive === 'boolean') {
        where.isActive = isActive
      }

      const total = await prisma.coupon.count({ where })

      const coupons = await prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              userCoupons: true,
            },
          },
        },
      })

      return {
        coupons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    },

    // Admin: 獲取單個優惠券詳情
    couponById: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const coupon = await prisma.coupon.findUnique({
        where: { id },
        include: {
          userCoupons: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          _count: {
            select: {
              userCoupons: true,
            },
          },
        },
      })

      if (!coupon) {
        throw new GraphQLError('Coupon not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return coupon
    },

    // 獲取所有公開優惠券
    publicCoupons: async () => {
      const now = new Date()
      return await prisma.coupon.findMany({
        where: {
          isActive: true,
          isPublic: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      })
    },

    // 獲取用戶的優惠券
    myCoupons: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const userCoupons = await prisma.userCoupon.findMany({
        where: {
          userId: user.userId,
        },
        include: {
          coupon: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return userCoupons
    },

    // 獲取可用的優惠券（未使用且未過期）
    availableCoupons: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const now = new Date()
      const userCoupons = await prisma.userCoupon.findMany({
        where: {
          userId: user.userId,
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } }
          ],
        },
        include: {
          coupon: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      // 過濾掉優惠券本身已失效的
      return userCoupons.filter((uc) =>
        uc.coupon &&
        uc.coupon.isActive &&
        uc.coupon.validFrom <= now &&
        uc.coupon.validUntil >= now
      )
    },

    // 驗證優惠券碼（直接輸入代碼即可使用，不需要先領取）
    validateCoupon: async (
      _: any,
      { code, orderAmount }: { code: string; orderAmount: number },
      { user }: GraphQLContext
    ) => {
      // 允許訪客和會員都可以使用優惠券
      const now = new Date()
      const coupon = await prisma.coupon.findUnique({
        where: { code },
      })

      if (!coupon) {
        return {
          valid: false,
          message: '優惠券不存在',
        }
      }

      // 檢查優惠券是否啟用
      if (!coupon.isActive) {
        return {
          valid: false,
          message: '優惠券已停用',
        }
      }

      // 檢查有效期
      if (coupon.validFrom > now || coupon.validUntil < now) {
        return {
          valid: false,
          message: '優惠券已過期或尚未生效',
        }
      }

      // 檢查最小訂單金額
      if (coupon.minAmount && orderAmount < Number(coupon.minAmount)) {
        return {
          valid: false,
          message: `訂單金額需滿 NT$ ${Number(coupon.minAmount).toLocaleString()}`,
        }
      }

      // 檢查總使用次數
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return {
          valid: false,
          message: '優惠券已被搶光',
        }
      }

      // 檢查用戶使用次數限制（僅限會員）
      if (user && coupon.userLimit) {
        const userUsageCount = await prisma.order.count({
          where: {
            userId: user.userId,
            couponId: coupon.id,
            status: { notIn: ['CANCELLED'] },
          },
        })
        if (userUsageCount >= coupon.userLimit) {
          return {
            valid: false,
            message: `每人限用 ${coupon.userLimit} 次，您已達上限`,
          }
        }
      }

      // 計算折扣金額
      let discountAmount = 0
      switch (coupon.type) {
        case 'PERCENTAGE':
          discountAmount = orderAmount * (Number(coupon.value) / 100)
          if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount))
          }
          break
        case 'FIXED':
          discountAmount = Number(coupon.value)
          break
        case 'FREE_SHIPPING':
          // 運費折扣由結帳流程處理
          discountAmount = 0
          break
        default:
          break
      }

      return {
        valid: true,
        message: '優惠券可用',
        coupon,
        discountAmount,
      }
    },
  },

  Mutation: {
    // Admin: 創建優惠券
    createCoupon: async (
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
        // 檢查優惠券代碼是否已存在
        const existing = await prisma.coupon.findUnique({
          where: { code: input.code },
        })

        if (existing) {
          throw new GraphQLError('優惠券代碼已存在', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        const coupon = await prisma.coupon.create({
          data: {
            code: input.code,
            name: input.name,
            description: input.description,
            type: input.type,
            value: input.value,
            minAmount: input.minAmount,
            maxDiscount: input.maxDiscount,
            usageLimit: input.usageLimit,
            userLimit: input.userLimit,
            validFrom: new Date(input.validFrom),
            validUntil: new Date(input.validUntil),
            isActive: input.isActive ?? true,
            isPublic: input.isPublic ?? true,
            applicableCategories: input.applicableCategories || [],
            applicableProducts: input.applicableProducts || [],
            excludeProducts: input.excludeProducts || [],
          },
        })

        return coupon
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('創建優惠券失敗:', error)
        throw new GraphQLError('創建優惠券失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: 更新優惠券
    updateCoupon: async (
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

        if (input.name !== undefined) updateData.name = input.name
        if (input.description !== undefined) updateData.description = input.description
        if (input.type !== undefined) updateData.type = input.type
        if (input.value !== undefined) updateData.value = input.value
        if (input.minAmount !== undefined) updateData.minAmount = input.minAmount
        if (input.maxDiscount !== undefined) updateData.maxDiscount = input.maxDiscount
        if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit
        if (input.userLimit !== undefined) updateData.userLimit = input.userLimit
        if (input.validFrom !== undefined) updateData.validFrom = new Date(input.validFrom)
        if (input.validUntil !== undefined) updateData.validUntil = new Date(input.validUntil)
        if (input.isActive !== undefined) updateData.isActive = input.isActive
        if (input.isPublic !== undefined) updateData.isPublic = input.isPublic

        const coupon = await prisma.coupon.update({
          where: { id },
          data: updateData,
        })

        return coupon
      } catch (error) {
        console.error('更新優惠券失敗:', error)
        throw new GraphQLError('更新優惠券失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: 刪除優惠券（真正刪除）
    deleteCoupon: async (
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
        // 檢查優惠券是否存在
        const coupon = await prisma.coupon.findUnique({
          where: { id },
        })

        if (!coupon) {
          throw new GraphQLError('優惠券不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        // 檢查是否為鎖定的優惠券
        if (coupon.isLocked) {
          throw new GraphQLError('此優惠券已被系統鎖定，無法刪除。您只能編輯其內容。', {
            extensions: { code: 'FORBIDDEN' },
          })
        }

        // 檢查是否有訂單使用過此優惠券
        const ordersWithCoupon = await prisma.order.count({
          where: { couponId: id },
        })

        if (ordersWithCoupon > 0) {
          throw new GraphQLError(`此優惠券已被 ${ordersWithCoupon} 筆訂單使用，無法刪除。建議改用停用功能。`, {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 先刪除關聯的 userCoupons
        await prisma.userCoupon.deleteMany({
          where: { couponId: id },
        })

        // 刪除優惠券
        await prisma.coupon.delete({
          where: { id },
        })

        return true
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('刪除優惠券失敗:', error)
        throw new GraphQLError('刪除優惠券失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 領取優惠券
    claimCoupon: async (
      _: any,
      { code }: { code: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        const now = new Date()
        const coupon = await prisma.coupon.findUnique({
          where: { code },
        })

        if (!coupon) {
          throw new GraphQLError('優惠券不存在', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        if (!coupon.isActive) {
          throw new GraphQLError('優惠券已停用', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        if (!coupon.isPublic) {
          throw new GraphQLError('此優惠券不可公開領取', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        if (coupon.validFrom > now || coupon.validUntil < now) {
          throw new GraphQLError('優惠券已過期或尚未生效', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 檢查總使用次數
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new GraphQLError('優惠券已被搶光', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 檢查用戶是否已領取
        const existingUserCoupon = await prisma.userCoupon.findFirst({
          where: {
            userId: user.userId,
            couponId: coupon.id,
          },
        })

        if (existingUserCoupon) {
          throw new GraphQLError('您已經領取過此優惠券', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 檢查用戶領取次數限制
        if (coupon.userLimit) {
          const userCouponCount = await prisma.userCoupon.count({
            where: {
              userId: user.userId,
              couponId: coupon.id,
            },
          })

          if (userCouponCount >= coupon.userLimit) {
            throw new GraphQLError('已達領取上限', {
              extensions: { code: 'BAD_USER_INPUT' },
            })
          }
        }

        // 創建用戶優惠券
        const userCoupon = await prisma.userCoupon.create({
          data: {
            userId: user.userId,
            couponId: coupon.id,
            obtainedFrom: 'MANUAL_CLAIM',
          },
          include: {
            coupon: true,
          },
        })

        return userCoupon
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('領取優惠券失敗:', error)
        throw new GraphQLError('領取優惠券失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: 發放優惠券給指定用戶
    grantCouponToUser: async (
      _: any,
      { userId, couponId }: { userId: string; couponId: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        // 檢查用戶是否存在
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!targetUser) {
          throw new GraphQLError('用戶不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        // 檢查優惠券是否存在
        const coupon = await prisma.coupon.findUnique({
          where: { id: couponId },
        })

        if (!coupon) {
          throw new GraphQLError('優惠券不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        // 檢查用戶是否已有此優惠券
        const existingUserCoupon = await prisma.userCoupon.findFirst({
          where: {
            userId,
            couponId,
            isUsed: false,
          },
        })

        if (existingUserCoupon) {
          throw new GraphQLError('該用戶已擁有此優惠券', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 發放優惠券
        const userCoupon = await prisma.userCoupon.create({
          data: {
            userId,
            couponId,
            obtainedFrom: 'ADMIN_GRANT',
          },
          include: {
            coupon: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return userCoupon
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('發放優惠券失敗:', error)
        throw new GraphQLError('發放優惠券失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: 批量發放優惠券給多個用戶
    batchGrantCoupon: async (
      _: any,
      { userIds, couponId }: { userIds: string[]; couponId: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        // 檢查優惠券是否存在
        const coupon = await prisma.coupon.findUnique({
          where: { id: couponId },
        })

        if (!coupon) {
          throw new GraphQLError('優惠券不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        let successCount = 0
        let skipCount = 0
        const results: any[] = []

        for (const userId of userIds) {
          // 檢查用戶是否已有此優惠券
          const existing = await prisma.userCoupon.findFirst({
            where: {
              userId,
              couponId,
              isUsed: false,
            },
          })

          if (existing) {
            skipCount++
            continue
          }

          // 發放優惠券
          const userCoupon = await prisma.userCoupon.create({
            data: {
              userId,
              couponId,
              obtainedFrom: 'ADMIN_GRANT',
            },
          })

          results.push(userCoupon)
          successCount++
        }

        return {
          success: true,
          successCount,
          skipCount,
          message: `成功發放 ${successCount} 張優惠券，跳過 ${skipCount} 位已擁有的用戶`,
        }
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('批量發放優惠券失敗:', error)
        throw new GraphQLError('批量發放優惠券失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },
  },

  UserCoupon: {
    user: async (userCoupon: any) => {
      return await prisma.user.findUnique({
        where: { id: userCoupon.userId },
      })
    },
    coupon: async (userCoupon: any) => {
      return await prisma.coupon.findUnique({
        where: { id: userCoupon.couponId },
      })
    },
  },
}
