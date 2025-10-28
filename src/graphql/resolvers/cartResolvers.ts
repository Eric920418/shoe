/**
 * 購物車相關的GraphQL Resolvers
 */

import { prisma } from '@/lib/prisma'

interface Context {
  user?: {
    id: string
    email: string
  }
}

export const cartResolvers = {
  Query: {
    // 獲取當前用戶的購物車
    cart: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      const cart = await prisma.cart.findUnique({
        where: { userId: context.user.id },
        include: {
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
        },
      })

      if (!cart) {
        // 如果購物車不存在，創建一個新的
        return await prisma.cart.create({
          data: {
            userId: context.user.id,
            items: {
              create: [],
            },
          },
          include: {
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
          },
        })
      }

      return cart
    },
  },

  Mutation: {
    // 加入購物車
    addToCart: async (_: any, args: any, context: Context) => {
      const { productId, variantId, sizeChartId, quantity } = args

      if (!context.user) {
        throw new Error('請先登入')
      }

      // 驗證產品是否存在
      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product) {
        throw new Error('產品不存在')
      }

      // 驗證尺碼是否存在且有庫存
      const sizeChart = await prisma.sizeChart.findUnique({
        where: { id: sizeChartId },
      })

      if (!sizeChart) {
        throw new Error('尺碼不存在')
      }

      if (sizeChart.stock < quantity) {
        throw new Error(`庫存不足，目前僅剩 ${sizeChart.stock} 件`)
      }

      // 獲取或創建購物車
      let cart = await prisma.cart.findUnique({
        where: { userId: context.user.id },
      })

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: context.user.id },
        })
      }

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

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        })
      } else {
        // 如果不存在，新增購物車項目
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            sizeChartId,
            quantity,
            price: product.price,
          },
        })
      }

      // 返回更新後的購物車
      return await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
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
        },
      })
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

      if (cartItem.cart.userId !== context.user.id) {
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

      // 返回更新後的購物車
      return await prisma.cart.findUnique({
        where: { id: cartItem.cartId },
        include: {
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
        },
      })
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

      if (cartItem.cart.userId !== context.user.id) {
        throw new Error('無權操作此購物車項目')
      }

      // 刪除購物車項目
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      })

      // 返回更新後的購物車
      return await prisma.cart.findUnique({
        where: { id: cartItem.cartId },
        include: {
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
        },
      })
    },

    // 清空購物車
    clearCart: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('請先登入')
      }

      const cart = await prisma.cart.findUnique({
        where: { userId: context.user.id },
      })

      if (!cart) {
        throw new Error('購物車不存在')
      }

      // 刪除所有購物車項目
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      // 返回清空後的購物車
      return await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
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
        },
      })
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
