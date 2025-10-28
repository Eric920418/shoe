/**
 * 訂單 Resolvers - 處理訂單創建和管理
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import {
  calculateMembershipTier,
  calculatePointsEarned,
} from '@/lib/membership'

interface GraphQLContext {
  user?: {
    userId: string
    email: string
    role: string
  } | null
}

/**
 * 處理訂單完成後的會員升級和積分累積
 * @param userId 用戶ID
 * @param orderId 訂單ID
 * @param orderTotal 訂單總金額
 */
async function processCompletedOrder(
  userId: string,
  orderId: string,
  orderTotal: number | any
) {
  try {
    const total = typeof orderTotal === 'number' ? orderTotal : orderTotal.toNumber()

    // 1. 獲取用戶當前資訊
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        membershipTierId: true,
        membershipPoints: true,
        totalSpent: true,
        totalOrders: true,
        isFirstTimeBuyer: true,
      },
    })

    if (!currentUser) {
      console.error('用戶不存在，無法處理訂單完成邏輯')
      return
    }

    // 2. 計算新的總消費金額
    const newTotalSpent = currentUser.totalSpent.toNumber() + total

    // 3. 根據新的總消費金額計算會員等級
    const newTier = await calculateMembershipTier(newTotalSpent)
    const oldTierId = currentUser.membershipTierId

    // 4. 計算本次訂單可獲得的積分
    const pointsEarned = calculatePointsEarned(total, newTier)

    // 5. 計算新的積分總額
    const newPoints = currentUser.membershipPoints + pointsEarned

    // 6. 更新用戶資訊
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalSpent: newTotalSpent,
        totalOrders: currentUser.totalOrders + 1,
        membershipTierId: newTier.id,
        membershipPoints: newPoints,
        isFirstTimeBuyer: false,
        firstPurchaseAt: currentUser.isFirstTimeBuyer ? new Date() : currentUser.firstPurchaseAt,
      },
    })

    // 7. 記錄積分交易
    await prisma.pointTransaction.create({
      data: {
        userId,
        type: 'ORDER_REWARD',
        amount: pointsEarned,
        orderId,
        description: `訂單完成獲得積分（訂單編號：${orderId.slice(0, 8)}...）`,
      },
    })

    // 8. 如果會員等級提升，記錄額外的獎勵積分
    if (newTier.id !== oldTierId) {
      const bonusPoints = 100 // 升級獎勵：100 積分
      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipPoints: {
            increment: bonusPoints,
          },
        },
      })

      await prisma.pointTransaction.create({
        data: {
          userId,
          type: 'CAMPAIGN_REWARD',
          amount: bonusPoints,
          description: `恭喜升級至 ${newTier} 會員！獲得升級獎勵`,
        },
      })

      console.log(
        `✨ 用戶 ${userId} 從 ${oldTier} 升級至 ${newTier}，獲得 ${bonusPoints} 升級獎勵積分`
      )
    }

    console.log(
      `✅ 訂單完成處理成功：用戶 ${userId} 獲得 ${pointsEarned} 積分，當前會員等級：${newTier}`
    )
  } catch (error) {
    console.error('處理訂單完成邏輯時發生錯誤:', error)
    // 不拋出錯誤，避免影響訂單狀態更新
  }
}

export const orderResolvers = {
  Query: {
    // 獲取我的訂單列表
    myOrders: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return await prisma.order.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                },
              },
              variant: true,
            },
          },
          address: true,
        },
      })
    },

    // 獲取單個訂單詳情
    order: async (_: any, { id }: { id: string }, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                },
              },
              variant: true,
            },
          },
          address: true,
        },
      })

      if (!order) {
        throw new GraphQLError('訂單不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 確保只能查看自己的訂單
      if (order.userId !== user.userId && user.role !== 'ADMIN') {
        throw new GraphQLError('無權查看此訂單', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return order
    },

    // 獲取所有訂單（管理員）
    orders: async (
      _: any,
      { skip = 0, take = 50, where }: { skip?: number; take?: number; where?: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.order.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      })
    },
  },

  Mutation: {
    // 創建訂單
    createOrder: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // 獲取購物車項目
        const cartItems = await prisma.cartItem.findMany({
          where: { userId: user.userId },
          include: {
            product: {
              include: {
                brand: true,
              },
            },
            variant: true,
          },
        })

        if (!cartItems || cartItems.length === 0) {
          throw new GraphQLError('購物車是空的', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 計算總金額
        const subtotal = cartItems.reduce((sum, item) => {
          return sum + item.addedPrice.toNumber() * item.quantity
        }, 0)

        const shippingFee = 0 // 免運費
        let discount = 0
        let creditsUsed = 0

        // 處理購物金折抵
        if (input.creditsToUse && input.creditsToUse > 0) {
          const now = new Date()
          // 獲取用戶可用的購物金
          const availableCredits = await prisma.userCredit.findMany({
            where: {
              userId: user.userId,
              isActive: true,
              isUsed: false,
              validFrom: { lte: now },
              validUntil: { gte: now },
              balance: { gt: 0 },
            },
            orderBy: { validUntil: 'asc' }, // 優先使用即將過期的
          })

          let remainingCreditsToUse = input.creditsToUse
          const creditUpdates: Array<{ id: string; amountUsed: number }> = []

          for (const credit of availableCredits) {
            if (remainingCreditsToUse <= 0) break

            const currentBalance = credit.balance.toNumber()

            // 檢查單筆訂單使用限制
            let maxCanUse = currentBalance
            if (credit.maxUsagePerOrder) {
              maxCanUse = Math.min(maxCanUse, credit.maxUsagePerOrder.toNumber())
            }

            // 檢查最低訂單金額限制
            if (credit.minOrderAmount && subtotal < credit.minOrderAmount.toNumber()) {
              continue // 跳過此購物金
            }

            const amountToUse = Math.min(remainingCreditsToUse, maxCanUse)

            creditUpdates.push({
              id: credit.id,
              amountUsed: amountToUse,
            })

            creditsUsed += amountToUse
            remainingCreditsToUse -= amountToUse
          }

          // 驗證是否能使用請求的購物金金額
          if (creditsUsed < input.creditsToUse) {
            throw new GraphQLError(
              `可用購物金不足。您有 $${creditsUsed.toFixed(0)} 可用，但請求使用 $${input.creditsToUse.toFixed(0)}`,
              { extensions: { code: 'BAD_USER_INPUT' } }
            )
          }

          // 更新購物金餘額
          for (const update of creditUpdates) {
            const credit = availableCredits.find((c) => c.id === update.id)!
            const newBalance = credit.balance.toNumber() - update.amountUsed

            await prisma.userCredit.update({
              where: { id: update.id },
              data: {
                balance: newBalance,
                isUsed: newBalance <= 0,
              },
            })
          }

          discount += creditsUsed
        }

        const total = subtotal + shippingFee - discount

        // 生成訂單編號
        const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`

        // 確保總額不為負數
        const finalTotal = Math.max(0, total)

        // 創建訂單
        const order = await prisma.order.create({
          data: {
            userId: user.userId,
            orderNumber,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
            subtotal,
            shippingFee,
            discount,
            total: finalTotal,
            shippingName: input.shippingName,
            shippingPhone: input.shippingPhone,
            shippingCountry: input.shippingCountry || '台灣',
            shippingCity: input.shippingCity,
            shippingDistrict: input.shippingDistrict || '',
            shippingStreet: input.shippingStreet,
            shippingZipCode: input.shippingZipCode || '',
            notes: input.notes ? `${input.notes}${creditsUsed > 0 ? `\n[使用購物金：$${creditsUsed}]` : ''}` : creditsUsed > 0 ? `[使用購物金：$${creditsUsed}]` : null,
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.images?.[0] || null,
                variantId: item.variantId,
                variantName: item.variant?.color || null,
                sizeEu: item.sizeEu,
                color: item.variant?.color || null,
                quantity: item.quantity,
                price: item.addedPrice,
                subtotal: item.addedPrice.toNumber() * item.quantity,
                sku: item.variant?.sku || item.product.sku,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    brand: true,
                  },
                },
                variant: true,
              },
            },
          },
        })

        // 清空購物車
        await prisma.cartItem.deleteMany({
          where: { userId: user.userId },
        })

        return order
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('創建訂單錯誤:', error)
        throw new GraphQLError('創建訂單失敗，請稍後再試', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 取消訂單
    cancelOrder: async (
      _: any,
      { id, reason }: { id: string; reason?: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!order) {
        throw new GraphQLError('訂單不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      if (order.userId !== user.userId && user.role !== 'ADMIN') {
        throw new GraphQLError('無權取消此訂單', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      if (order.status === 'CANCELLED') {
        throw new GraphQLError('訂單已取消', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      if (order.status === 'COMPLETED' || order.status === 'SHIPPED') {
        throw new GraphQLError('訂單已出貨或完成，無法取消', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      // 更新訂單狀態
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelReason: reason || null,
          cancelledAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      })

      return updatedOrder
    },

    // 更新訂單狀態（管理員）
    updateOrderStatus: async (
      _: any,
      { id, status }: { id: string; status: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        // 獲取訂單資訊
        const order = await prisma.order.findUnique({
          where: { id },
          include: {
            items: true,
          },
        })

        if (!order) {
          throw new GraphQLError('訂單不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        // 更新訂單狀態
        const updatedOrder = await prisma.order.update({
          where: { id },
          data: { status },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        })

        // 如果訂單狀態變更為「已完成」，則執行會員升級和積分累積邏輯
        if (status === 'COMPLETED' && order.userId) {
          await processCompletedOrder(order.userId, order.id, order.total)
        }

        return updatedOrder
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('更新訂單狀態錯誤:', error)
        throw new GraphQLError('更新訂單狀態失敗', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },
  },
}
