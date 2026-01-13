/**
 * 訂單 Resolvers - 處理訂單創建和管理
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import {
  calculateMembershipTier,
  calculateCreditReward,
  isFreeShipping,
} from '@/lib/membership'

/**
 * 扣減 SKU 庫存
 * @param orderId 訂單ID
 */
async function deductSkuStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) return

  for (const item of order.items) {
    if (item.skuId) {
      await prisma.productSku.update({
        where: { id: item.skuId },
        data: {
          stock: { decrement: item.quantity },
        },
      })
      console.log(`📦 扣減庫存: SKU ${item.skuId}, 數量 -${item.quantity}`)
    }
  }
}

/**
 * 恢復 SKU 庫存（訂單取消時）
 * @param orderId 訂單ID
 */
async function restoreSkuStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) return

  for (const item of order.items) {
    if (item.skuId) {
      await prisma.productSku.update({
        where: { id: item.skuId },
        data: {
          stock: { increment: item.quantity },
        },
      })
      console.log(`📦 恢復庫存: SKU ${item.skuId}, 數量 +${item.quantity}`)
    }
  }
}

interface GraphQLContext {
  user?: {
    userId: string
    email: string
    role: string
  } | null
}

/**
 * 處理訂單完成後的會員升級和購物金回饋
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
        totalSpent: true,
        totalOrders: true,
        isFirstTimeBuyer: true,
        firstPurchaseAt: true,
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

    // 4. 計算本次訂單可獲得的購物金回饋（每 100 元 = 1 元購物金）
    const creditReward = calculateCreditReward(total, newTier)

    // 5. 更新用戶資訊（不再更新 membershipPoints）
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalSpent: newTotalSpent,
        totalOrders: currentUser.totalOrders + 1,
        membershipTierId: newTier.id,
        isFirstTimeBuyer: false,
        firstPurchaseAt: currentUser.isFirstTimeBuyer ? new Date() : currentUser.firstPurchaseAt,
      },
    })

    // 6. 發放購物金回饋（如果有的話）
    if (creditReward > 0) {
      // 設定購物金有效期（一年）
      const validUntil = new Date()
      validUntil.setFullYear(validUntil.getFullYear() + 1)

      await prisma.userCredit.create({
        data: {
          userId,
          amount: creditReward,
          balance: creditReward,
          source: 'CAMPAIGN', // 使用 CAMPAIGN 作為訂單回饋來源
          sourceId: orderId,
          validFrom: new Date(),
          validUntil,
          isActive: true,
          isUsed: false,
        },
      })

      console.log(
        `💰 用戶 ${userId} 訂單完成，獲得 $${creditReward} 購物金回饋（訂單金額：$${total}）`
      )
    }

    // 7. 如果會員等級提升，發放升級獎勵購物金
    if (newTier.id !== oldTierId) {
      const bonusCredit = newTier.birthdayGift?.toNumber() || 50 // 使用等級設定的獎勵，或預設 50 元

      const validUntil = new Date()
      validUntil.setFullYear(validUntil.getFullYear() + 1)

      await prisma.userCredit.create({
        data: {
          userId,
          amount: bonusCredit,
          balance: bonusCredit,
          source: 'CAMPAIGN',
          sourceId: `upgrade-${newTier.id}`,
          validFrom: new Date(),
          validUntil,
          isActive: true,
          isUsed: false,
        },
      })

      console.log(
        `✨ 用戶 ${userId} 升級至 ${newTier.name}，獲得 $${bonusCredit} 升級獎勵購物金`
      )
    }

    console.log(
      `✅ 訂單完成處理成功：用戶 ${userId}，購物金回饋 $${creditReward}，當前會員等級：${newTier.name}`
    )
  } catch (error) {
    console.error('處理訂單完成邏輯時發生錯誤:', error)
    // 不拋出錯誤，避免影響訂單狀態更新
  }
}

export const orderResolvers = {
  Query: {
    // 訪客訂單追蹤（不需要登入）
    trackOrder: async (
      _: any,
      { orderNumber, phone }: { orderNumber: string; phone: string }
    ) => {
      // 驗證手機號碼格式
      if (!/^09\d{8}$/.test(phone)) {
        throw new GraphQLError('請輸入有效的台灣手機號碼（格式：0912345678）', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          OR: [
            { guestPhone: phone }, // 訪客訂單
            { shippingPhone: phone }, // 會員訂單也可以用收件手機查詢
          ],
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                },
              },
              variant: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!order) {
        throw new GraphQLError('找不到符合的訂單，請確認訂單編號和手機號碼是否正確', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return order
    },

    // 獲取我的訂單列表（✅ 優化：減少不必要的關聯載入 + 支援分頁）
    myOrders: async (
      _: any,
      {
        skip = 0,
        take = 50, // 預設每次載入 50 筆，防止一次載入過多
      }: {
        skip?: number
        take?: number
      } = {},
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // ✅ 訂單列表頁面只需要基本資料，不需要載入完整的產品詳情
      // ✅ 加入分頁參數，避免一次載入數百筆訂單
      return await prisma.order.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(take, 100), // 最多一次載入 100 筆，防止濫用
        include: {
          items: {
            // ✅ 只選擇必要欄位，不載入整個 product 關聯
            select: {
              id: true,
              quantity: true,
              price: true,
              subtotal: true,
              productName: true,
              productImage: true,
              sizeEu: true,
              color: true,
            },
          },
          // ✅ 不載入 address，訂單列表不需要
        },
      })
    },

    // 獲取單個訂單詳情（支持 id 或 orderNumber 查詢）
    order: async (_: any, { id, orderNumber }: { id?: string; orderNumber?: string }, { user }: GraphQLContext) => {
      if (!id && !orderNumber) {
        throw new GraphQLError('請提供訂單 ID 或訂單編號', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      // 構建查詢條件
      const whereCondition = id ? { id } : { orderNumber }

      const order = await prisma.order.findFirst({
        where: whereCondition,
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
              variant: true,
            },
          },
          address: true,
          payment: true, // 包含支付資訊
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

      if (!order) {
        throw new GraphQLError('訂單不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 訪客訂單（無 userId）允許查看
      // 會員訂單需要驗證身份：必須是訂單擁有者或管理員
      if (order.userId) {
        if (!user) {
          throw new GraphQLError('請先登入', {
            extensions: { code: 'UNAUTHENTICATED' },
          })
        }
        if (order.userId !== user.userId && user.role !== 'ADMIN') {
          throw new GraphQLError('無權查看此訂單', {
            extensions: { code: 'FORBIDDEN' },
          })
        }
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
      // 判斷是否為訪客模式
      const isGuest = !user || input.isGuest

      // 訪客模式驗證
      if (isGuest) {
        if (!input.guestName || !input.guestPhone) {
          throw new GraphQLError('訪客結帳必須提供姓名和手機號碼', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 驗證手機號碼格式
        if (!/^09\d{8}$/.test(input.guestPhone)) {
          throw new GraphQLError('請輸入有效的台灣手機號碼（格式：0912345678）', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 訪客不能使用購物金和積分
        if (input.creditsToUse || input.pointsToUse) {
          throw new GraphQLError('訪客結帳無法使用購物金和積分，請先註冊會員', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }
      }

      try {
        let cartItems: any[] = []

        // ✅ 判斷是否使用 input.items（直接購買模式、訪客模式、或明確傳入 items）
        const useInputItems = isGuest || (input.items && input.items.length > 0 && !input.selectedCartItemIds)

        // 會員模式且不是直接購買：從購物車獲取商品
        if (!isGuest && user && !useInputItems) {
          // ✅ 支持選擇性結帳：如果提供了 selectedCartItemIds，只獲取指定的購物車項目
          const whereCondition: any = { userId: user.userId }
          if (input.selectedCartItemIds && input.selectedCartItemIds.length > 0) {
            whereCondition.id = { in: input.selectedCartItemIds }
          }

          const dbCartItems = await prisma.cartItem.findMany({
            where: whereCondition,
            include: {
              product: {
                include: {
                },
              },
              variant: true,
              sizeChart: true, // ✅ 加入 sizeChart 關聯以獲取尺寸
              sku: true, // 加入 SKU 關聯
            },
          })

          if (!dbCartItems || dbCartItems.length === 0) {
            throw new GraphQLError('購物車是空的或選中的商品不存在', {
              extensions: { code: 'BAD_USER_INPUT' },
            })
          }

          // 無限庫存模式：不檢查庫存限制

          // 將數據庫購物車轉換為統一格式（添加 addedPrice 和 skuId 字段）
          cartItems = dbCartItems.map((item) => ({
            ...item,
            skuId: item.skuId, // 保留 SKU ID
            addedPrice: item.variant
              ? item.product.price.toNumber() + item.variant.priceAdjustment.toNumber()
              : item.product.price.toNumber(),
          }))
        }
        // 訪客模式或直接購買模式：從 input.items 獲取商品
        else {
          if (!input.items || input.items.length === 0) {
            throw new GraphQLError('訂單商品不能為空', {
              extensions: { code: 'BAD_USER_INPUT' },
            })
          }

          // 將 input.items 轉換為與 cartItems 相同的格式
          for (const item of input.items) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
            })

            if (!product) {
              throw new GraphQLError(`產品不存在（ID: ${item.productId}）`, {
                extensions: { code: 'NOT_FOUND' },
              })
            }

            let variant = null
            if (item.variantId) {
              variant = await prisma.productVariant.findUnique({
                where: { id: item.variantId },
              })
            }

            // 查詢 sizeChart（用於獲取尺寸）
            let sizeChart = null
            if (item.sizeChartId) {
              sizeChart = await prisma.sizeChart.findUnique({
                where: { id: item.sizeChartId },
              })
            }

            // 查找 SKU（可選，用於記錄）
            let sku = null
            if (item.variantId && item.sizeChartId) {
              sku = await prisma.productSku.findUnique({
                where: {
                  productId_variantId_sizeChartId: {
                    productId: item.productId,
                    variantId: item.variantId,
                    sizeChartId: item.sizeChartId,
                  },
                },
              })
            }

            // 無限庫存模式：不檢查庫存限制

            cartItems.push({
              productId: product.id,
              product,
              variantId: item.variantId,
              variant,
              sizeChartId: item.sizeChartId,
              sizeChart, // ✅ 加入 sizeChart
              skuId: sku?.id || null, // 加入 SKU ID
              quantity: item.quantity,
              sizeEu: item.sizeEu,
              addedPrice: variant ? product.price.toNumber() + variant.priceAdjustment.toNumber() : product.price,
            })
          }
        }

        // 計算總金額
        const subtotal = cartItems.reduce((sum, item) => {
          const price = typeof item.addedPrice === 'number' ? item.addedPrice : item.addedPrice.toNumber()
          return sum + price * item.quantity
        }, 0)

        // 根據配送方式計算基礎運費
        let shippingFee = 0
        switch (input.shippingMethod) {
          case 'CVS_PICKUP':
            shippingFee = 49 // 超商取貨統一運費 49 元
            break
          case 'HOME_DELIVERY':
            shippingFee = 120
            break
          case 'SELF_PICKUP':
            shippingFee = 0
            break
          default:
            shippingFee = 49
        }

        // 檢查會員免運門檻
        if (!isGuest && user && shippingFee > 0) {
          // 獲取用戶的會員等級配置
          const userWithTier = await prisma.user.findUnique({
            where: { id: user.userId },
            include: { membershipTierConfig: true },
          })

          if (userWithTier?.membershipTierConfig) {
            // 使用會員等級的免運門檻判斷是否免運
            const qualifiesForFreeShipping = isFreeShipping(subtotal, userWithTier.membershipTierConfig)
            if (qualifiesForFreeShipping) {
              console.log(`🚚 會員 ${user.userId} 達到免運門檻 $${userWithTier.membershipTierConfig.freeShippingThreshold}，訂單小計 $${subtotal}，免除運費 $${shippingFee}`)
              shippingFee = 0
            }
          }
        }
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

        console.log('=== 第 1 層：建立訂單 ===');
        console.log('訂單編號:', orderNumber);
        console.log('input.shippingMethod:', input.shippingMethod, '(type:', typeof input.shippingMethod, ')');
        console.log('運費:', shippingFee);
        console.log('========================');

        // 確保總額不為負數
        const finalTotal = Math.max(0, total)

        // 創建訂單
        const order = await prisma.order.create({
          data: {
            userId: isGuest ? null : user?.userId,
            // 訪客資訊
            guestName: isGuest ? input.guestName : null,
            guestPhone: isGuest ? input.guestPhone : null,
            guestEmail: isGuest ? input.guestEmail : null,
            orderNumber,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
            subtotal,
            shippingFee,
            discount,
            total: finalTotal,
            shippingMethod: input.shippingMethod, // 不設預設值，必須明確傳入
            shippingName: input.shippingName,
            shippingPhone: input.shippingPhone,
            shippingCountry: input.shippingCountry || null,
            shippingCity: input.shippingCity || null,
            shippingDistrict: input.shippingDistrict || null,
            shippingStreet: input.shippingStreet || null,
            shippingZipCode: input.shippingZipCode || null,
            notes: input.notes ? `${input.notes}${creditsUsed > 0 ? `\n[使用購物金：$${creditsUsed}]` : ''}` : creditsUsed > 0 ? `[使用購物金：$${creditsUsed}]` : null,
            items: {
              create: cartItems.map((item) => {
                // ✅ 優先使用變體圖片，沒有才使用產品主圖
                const getItemImage = () => {
                  if (item.variant?.colorImage) return item.variant.colorImage
                  if (item.variant?.images) {
                    const variantImages = typeof item.variant.images === 'string'
                      ? JSON.parse(item.variant.images)
                      : item.variant.images
                    if (Array.isArray(variantImages) && variantImages.length > 0) {
                      return variantImages[0]
                    }
                  }
                  return item.product.images?.[0] || null
                }
                // ✅ 優先使用 sizeChart.size，沒有才使用 sizeEu
                const getSizeEu = () => {
                  if (item.sizeChart?.size) return item.sizeChart.size
                  return item.sizeEu || null
                }
                return {
                  productId: item.productId,
                  productName: item.product.name,
                  productImage: getItemImage(),
                  variantId: item.variantId,
                  variantName: item.variant?.color || null,
                  sizeEu: getSizeEu(),
                  color: item.variant?.color || null,
                  quantity: item.quantity,
                  price: item.addedPrice,
                  subtotal: (typeof item.addedPrice === 'number' ? item.addedPrice : item.addedPrice.toNumber()) * item.quantity,
                  sku: item.variant?.sku || item.product.sku,
                  skuId: item.skuId || null, // 關聯 SKU
                }
              }),
            },
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    },
                },
                variant: true,
              },
            },
          },
        })

        // ✅ 清空已結帳的購物車項目（僅會員模式）
        // 如果是選擇性結帳，只刪除已結帳的商品；否則清空整個購物車
        if (!isGuest && user) {
          if (input.selectedCartItemIds && input.selectedCartItemIds.length > 0) {
            // 選擇性結帳：只刪除選中的購物車項目
            await prisma.cartItem.deleteMany({
              where: {
                userId: user.userId,
                id: { in: input.selectedCartItemIds },
              },
            })
          } else {
            // 全部結帳：清空整個購物車
            await prisma.cartItem.deleteMany({
              where: { userId: user.userId },
            })
          }
        }

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

    // 取消訂單（保留原有功能）
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

      // 如果訂單已付款，需要恢復 SKU 庫存
      const wasPaid = order.paymentStatus === 'PAID'

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

      // 恢復 SKU 庫存（僅當訂單已付款時）
      if (wasPaid) {
        await restoreSkuStock(id)
        console.log(`✅ 訂單 ${id} 已取消，SKU 庫存已恢復`)
      }

      return updatedOrder
    },

    // 刪除訂單（新增：直接刪除未付款訂單）
    deleteOrder: async (
      _: any,
      { id }: { id: string },
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
        throw new GraphQLError('無權刪除此訂單', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      if (order.status === 'COMPLETED' || order.status === 'SHIPPED') {
        throw new GraphQLError('訂單已出貨或完成，無法刪除', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      if (order.paymentStatus === 'PAID') {
        throw new GraphQLError('已付款訂單無法刪除，請聯繫客服', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      // 檢查是否已列印寄件單
      if (order.shippingLabelPrintedAt) {
        throw new GraphQLError('此訂單已列印寄件單，無法刪除。如需取消請聯繫客服', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      // 刪除訂單項目
      await prisma.orderItem.deleteMany({
        where: { orderId: id },
      })

      // 刪除相關的支付記錄
      await prisma.payment.deleteMany({
        where: { orderId: id },
      })

      // 刪除訂單
      await prisma.order.delete({
        where: { id },
      })

      return { success: true, message: '訂單已刪除' }
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

          // 處理邀請碼獎勵（每筆訂單都發放）
          try {
            const { processReferralReward } = await import('./referralResolvers')
            await processReferralReward({
              userId: order.userId,
              orderId: order.id,
              orderAmount: order.total.toNumber(),
            })
          } catch (error) {
            // 邀請碼處理失敗不影響訂單完成流程
            console.error('處理邀請碼獎勵失敗:', error)
          }
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
