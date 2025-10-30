/**
 * 購物車相關的GraphQL Resolvers
 */

import { prisma } from '@/lib/prisma'

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

      // ✅ 使用共用函數
      let cart = await prisma.cart.findUnique({
        where: { userId: context.user.userId },
        include: CART_INCLUDE,
      })

      if (!cart) {
        // 如果購物車不存在，創建一個新的
        const newCart = await prisma.cart.create({
          data: {
            userId: context.user.userId,
          },
        })
        cart = await getCartWithItems(newCart.id)
      }

      return cart
    },
  },

  Mutation: {
    // 加入購物車
    addToCart: async (_: any, args: any, context: Context) => {
      try {
        const { productId, variantId, sizeChartId, quantity } = args

        console.log('🛒 加入購物車請求:', { productId, variantId, sizeChartId, quantity })

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

        // 驗證尺碼是否存在且有庫存
        const sizeChart = await prisma.sizeChart.findUnique({
          where: { id: sizeChartId },
        })

        if (!sizeChart) {
          throw new Error(`尺碼不存在 (ID: ${sizeChartId})`)
        }

        console.log('✅ 找到尺碼:', sizeChart.eu, '庫存:', sizeChart.stock)

        if (sizeChart.stock < quantity) {
          throw new Error(`庫存不足，目前僅剩 ${sizeChart.stock} 件`)
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

        // 檢查購物車中是否已有相同的商品（相同產品、變體、尺碼）
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            sizeChartId,
          },
        })

        if (existingItem) {
          // 如果已存在，更新數量
          const newQuantity = existingItem.quantity + quantity

          if (sizeChart.stock < newQuantity) {
            throw new Error(`庫存不足，目前僅剩 ${sizeChart.stock} 件`)
          }

          console.log('🔄 更新購物車項目數量:', existingItem.quantity, '->', newQuantity)
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          })
        } else {
          // 如果不存在，新增購物車項目
          console.log('➕ 新增購物車項目')
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              userId: context.user.userId,
              productId,
              variantId: variantId || null,
              sizeChartId,
              quantity,
              price: product.price,
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
        },
      })

      if (!cartItem) {
        throw new Error('購物車項目不存在')
      }

      if (cartItem.cart.userId !== context.user.userId) {
        throw new Error('無權操作此購物車項目')
      }

      // 檢查庫存
      if (cartItem.sizeChart.stock < quantity) {
        throw new Error(`庫存不足，目前僅剩 ${cartItem.sizeChart.stock} 件`)
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
  },
}
