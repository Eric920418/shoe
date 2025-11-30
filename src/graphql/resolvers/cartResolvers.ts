/**
 * 購物車相關的GraphQL Resolvers
 */

import { prisma } from '@/lib/prisma'
import {
  analyzeCartForBatching,
  applyQuantityAdjustments,
  applyStandardPackagingAdjustments,
  applyCombinedPackagingAdjustments,
} from '@/lib/cart-batching'

interface Context {
  user?: {
    userId: string
    email: string
    role: string
  }
}

// ✅ 抽離重複的 include 配置（減少程式碼重複）
const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          category: true,
          brand: true,
        },
      },
      variant: true,
      sizeChart: true,
      sku: true, // 加入 SKU 關聯
    },
  },
} as const

// ✅ 共用函數：獲取完整購物車資料
async function getCartWithItems(cartId: string) {
  return await prisma.cart.findUnique({
    where: { id: cartId },
    include: CART_INCLUDE,
  })
}

export const cartResolvers = {
  Query: {
    // 獲取當前用戶的購物車
    cart: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      try {
        // ✅ 使用共用函數
        let cart = await prisma.cart.findUnique({
          where: { userId: context.user.userId },
          include: CART_INCLUDE,
        })

        if (!cart) {
          // ✅ 檢查用戶是否存在（避免外鍵約束錯誤）
          const userExists = await prisma.user.findUnique({
            where: { id: context.user.userId },
            select: { id: true },
          })

          if (!userExists) {
            throw new Error('用戶不存在，請重新登入')
          }

          // 如果購物車不存在，創建一個新的
          const newCart = await prisma.cart.create({
            data: {
              userId: context.user.userId,
            },
          })
          cart = await getCartWithItems(newCart.id)
        }

        return cart
      } catch (error: any) {
        console.error('❌ 購物車查詢失敗:', error)

        // ✅ 處理外鍵約束錯誤
        if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
          throw new Error('用戶不存在，請重新登入')
        }

        // ✅ 處理用戶不存在錯誤
        if (error.message?.includes('用戶不存在')) {
          throw error
        }

        // 其他錯誤
        throw new Error(`購物車載入失敗: ${error.message}`)
      }
    },

    // 分析購物車並生成智能分單建議
    analyzeCartForBatching: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      try {
        const analysis = await analyzeCartForBatching(prisma, context.user.userId)
        return analysis
      } catch (error: any) {
        console.error('分析購物車失敗:', error)
        throw new Error(`分析購物車失敗: ${error.message}`)
      }
    },
  },

  Mutation: {
    // 加入購物車
    addToCart: async (_: any, args: any, context: Context) => {
      try {
        const {
          productId,
          variantId,
          sizeChartId,
          quantity,
          bundleId,
          isBundleItem,
          bundleItemPrice
        } = args

        console.log('🛒 加入購物車請求:', {
          productId,
          variantId,
          sizeChartId,
          quantity,
          bundleId,
          isBundleItem,
          bundleItemPrice
        })

        if (!context.user) {
          throw new Error('請先登入')
        }

        // 驗證產品是否存在
        const product = await prisma.product.findUnique({
          where: { id: productId },
        })

        if (!product) {
          throw new Error(`產品不存在 (ID: ${productId})`)
        }

        console.log('✅ 找到產品:', product.name)

        // 驗證尺碼是否存在
        const sizeChart = await prisma.sizeChart.findUnique({
          where: { id: sizeChartId },
        })

        if (!sizeChart) {
          throw new Error(`尺碼不存在 (ID: ${sizeChartId})`)
        }

        console.log('✅ 找到尺碼:', sizeChart.eu)

        // 查找對應的 SKU（顏色 × 尺碼組合）
        const sku = await prisma.productSku.findUnique({
          where: {
            productId_variantId_sizeChartId: {
              productId,
              variantId: variantId || '',
              sizeChartId,
            },
          },
        })

        if (!sku) {
          throw new Error(`此顏色尺碼組合暫無庫存 (顏色ID: ${variantId}, 尺碼ID: ${sizeChartId})`)
        }

        console.log('✅ 找到 SKU:', sku.id, '庫存:', sku.stock)

        if (sku.stock < quantity) {
          throw new Error(`庫存不足，目前僅剩 ${sku.stock} 件`)
        }

        // 獲取或創建購物車
        let cart = await prisma.cart.findUnique({
          where: { userId: context.user.userId },
        })

        if (!cart) {
          console.log('📦 創建新購物車')
          cart = await prisma.cart.create({
            data: { userId: context.user.userId },
          })
        }

        console.log('✅ 購物車 ID:', cart.id)

        // 檢查購物車中是否已有相同的商品（相同產品、變體、尺碼、SKU）
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            sizeChartId,
            skuId: sku.id,
          },
        })

        if (existingItem) {
          // 如果已存在，更新數量
          const newQuantity = existingItem.quantity + quantity

          if (sku.stock < newQuantity) {
            throw new Error(`庫存不足，目前僅剩 ${sku.stock} 件`)
          }

          console.log('🔄 更新購物車項目數量:', existingItem.quantity, '->', newQuantity)
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          })
        } else {
          // 如果不存在，新增購物車項目
          console.log('➕ 新增購物車項目')

          // 決定使用的價格：如果是組合商品且提供了組合價格，使用組合價格；否則使用產品原價
          const itemPrice = (isBundleItem && bundleItemPrice)
            ? bundleItemPrice
            : product.price

          console.log('💰 使用價格:', {
            isBundleItem,
            bundleItemPrice,
            productPrice: product.price,
            finalPrice: itemPrice
          })

          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              userId: context.user.userId,
              productId,
              variantId: variantId || null,
              sizeChartId,
              skuId: sku.id, // 關聯 SKU
              quantity,
              price: itemPrice,
              bundleId: bundleId || null,
              isBundleItem: isBundleItem || false,
              bundleItemPrice: bundleItemPrice || null,
            },
          })
        }

        // ✅ 返回更新後的購物車（使用共用函數）
        const updatedCart = await getCartWithItems(cart.id)
        console.log('✅ 購物車更新成功，項目數:', updatedCart?.items?.length || 0)
        return updatedCart
      } catch (error: any) {
        console.error('❌ 加入購物車失敗:', error.message)
        console.error('完整錯誤:', error)
        throw new Error(`加入購物車失敗: ${error.message}`)
      }
    },

    // 更新購物車商品數量
    updateCartItem: async (_: any, args: any, context: Context) => {
      const { cartItemId, quantity } = args

      if (!context.user) {
        throw new Error('請先登入')
      }

      // 驗證購物車項目是否屬於當前用戶
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: {
          cart: true,
          sizeChart: true,
          sku: true, // 加入 SKU
        },
      })

      if (!cartItem) {
        throw new Error('購物車項目不存在')
      }

      if (cartItem.cart.userId !== context.user.userId) {
        throw new Error('無權操作此購物車項目')
      }

      // 檢查 SKU 庫存（優先使用 SKU，向後相容使用 sizeChart）
      const availableStock = cartItem.sku?.stock ?? cartItem.sizeChart.stock
      if (availableStock < quantity) {
        throw new Error(`庫存不足，目前僅剩 ${availableStock} 件`)
      }

      // 更新數量
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      })

      // ✅ 返回更新後的購物車（使用共用函數）
      return await getCartWithItems(cartItem.cartId)
    },

    // 移除購物車商品
    removeFromCart: async (_: any, args: any, context: Context) => {
      const { cartItemId } = args

      if (!context.user) {
        throw new Error('請先登入')
      }

      // 驗證購物車項目是否屬於當前用戶
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true },
      })

      if (!cartItem) {
        throw new Error('購物車項目不存在')
      }

      if (cartItem.cart.userId !== context.user.userId) {
        throw new Error('無權操作此購物車項目')
      }

      // 刪除購物車項目
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      })

      // ✅ 返回更新後的購物車（使用共用函數）
      return await getCartWithItems(cartItem.cartId)
    },

    // 清空購物車
    clearCart: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      const cart = await prisma.cart.findUnique({
        where: { userId: context.user.userId },
      })

      if (!cart) {
        throw new Error('購物車不存在')
      }

      // 刪除所有購物車項目
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      // ✅ 返回清空後的購物車（使用共用函數）
      return await getCartWithItems(cart.id)
    },

    // 設定購物車項目的批次號
    setCartItemBatch: async (_: any, args: { cartItemId: string; batchNumber: number }, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      const { cartItemId, batchNumber } = args

      // 檢查購物車項目是否屬於當前用戶
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: cartItemId,
          userId: context.user.userId,
        },
      })

      if (!cartItem) {
        throw new Error('購物車項目不存在或無權限修改')
      }

      // 更新批次號
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { suggestedBatch: batchNumber },
      })

      // 返回更新後的購物車
      const cart = await prisma.cart.findUnique({
        where: { userId: context.user.userId },
        include: CART_INCLUDE,
      })

      return cart
    },

    // 自動優化購物車分批
    optimizeCartBatching: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      try {
        // 執行智能分單分析
        await analyzeCartForBatching(prisma, context.user.userId)

        // 返回更新後的購物車
        const cart = await prisma.cart.findUnique({
          where: { userId: context.user.userId },
          include: CART_INCLUDE,
        })

        return cart
      } catch (error: any) {
        console.error('優化購物車分批失敗:', error)
        throw new Error(`優化購物車分批失敗: ${error.message}`)
      }
    },

    // 套用智能數量調整（合併包裝用，向後相容）
    applySmartQuantityAdjustments: async (_: any, args: { packagingType?: string }, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      try {
        const packagingType = args.packagingType || 'COMBINED'
        let result

        if (packagingType === 'STANDARD') {
          // 單獨包裝：只保留一件
          result = await applyStandardPackagingAdjustments(prisma, context.user.userId)
        } else {
          // 合併包裝：調整到合併上限
          result = await applyCombinedPackagingAdjustments(prisma, context.user.userId)
        }

        if (!result.success) {
          throw new Error('套用數量調整失敗')
        }

        // 返回更新後的購物車
        const cart = await prisma.cart.findUnique({
          where: { userId: context.user.userId },
          include: CART_INCLUDE,
        })

        return {
          cart,
          adjustedItems: result.adjustedItems,
          removedItems: result.removedItems,
          message: result.message,
        }
      } catch (error: any) {
        console.error('套用數量調整失敗:', error)
        throw new Error(`套用數量調整失敗: ${error.message}`)
      }
    },
  },

  Cart: {
    // 計算購物車總金額（使用已 include 的 items，避免 N+1 查詢）
    total: (parent: any) => {
      if (!parent.items) return 0
      return parent.items.reduce((sum: number, item: any) => {
        return sum + item.price.toNumber() * item.quantity
      }, 0)
    },

    // 計算購物車總商品數量（使用已 include 的 items，避免 N+1 查詢）
    totalItems: (parent: any) => {
      if (!parent.items) return 0
      return parent.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    },
  },

  CartItem: {
    // 計算購物車項目小計
    subtotal: (parent: any) => {
      return parent.price.toNumber() * parent.quantity
    },
    // addedPrice 欄位（等同於 price，但前端代碼期望這個欄位名稱）
    addedPrice: (parent: any) => {
      return parent.price
    },
    // SKU 關聯解析
    sku: async (parent: any) => {
      if (parent.sku) return parent.sku
      if (!parent.skuId) return null
      return await prisma.productSku.findUnique({
        where: { id: parent.skuId },
        include: {
          variant: true,
          sizeChart: true,
        },
      })
    },
  },
}
