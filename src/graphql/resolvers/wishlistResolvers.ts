/**
 * Wishlist Resolvers - 願望清單系統
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

export const wishlistResolvers = {
  Query: {
    // 獲取我的願望清單
    myWishlist: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入才能查看願望清單', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        const wishlistItems = await prisma.wishlistItem.findMany({
          where: {
            userId: user.userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                variants: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
                sizeCharts: {
                  where: { isActive: true },
                  orderBy: { eu: 'asc' },
                },
              },
            },
          },
        })

        return wishlistItems
      } catch (error) {
        console.error('獲取願望清單失敗:', error)
        throw new GraphQLError(`獲取願望清單失敗：${error instanceof Error ? error.message : '未知錯誤'}`, {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 檢查產品是否在願望清單中
    isInWishlist: async (
      _: any,
      { productId }: { productId: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        return false
      }

      try {
        const exists = await prisma.wishlistItem.findUnique({
          where: {
            userId_productId: {
              userId: user.userId,
              productId,
            },
          },
        })

        return !!exists
      } catch (error) {
        console.error('檢查願望清單失敗:', error)
        return false
      }
    },
  },

  Mutation: {
    // 添加產品到願望清單
    addToWishlist: async (
      _: any,
      { productId }: { productId: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入才能添加到願望清單', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // 檢查產品是否存在且有效
        const product = await prisma.product.findUnique({
          where: { id: productId },
        })

        if (!product) {
          throw new GraphQLError('產品不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        if (!product.isActive) {
          throw new GraphQLError('此產品已下架，無法添加到願望清單', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 檢查是否已經在願望清單中
        const existing = await prisma.wishlistItem.findUnique({
          where: {
            userId_productId: {
              userId: user.userId,
              productId,
            },
          },
        })

        if (existing) {
          // 如果已存在，直接返回現有記錄
          return existing
        }

        // 創建新的願望清單項目
        const wishlistItem = await prisma.wishlistItem.create({
          data: {
            userId: user.userId,
            productId,
          },
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                variants: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
                sizeCharts: {
                  where: { isActive: true },
                  orderBy: { eu: 'asc' },
                },
              },
            },
          },
        })

        // 更新產品的收藏數
        await prisma.product.update({
          where: { id: productId },
          data: {
            favoriteCount: {
              increment: 1,
            },
          },
        })

        return wishlistItem
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('添加到願望清單失敗:', error)
        throw new GraphQLError(`添加到願望清單失敗：${error instanceof Error ? error.message : '未知錯誤'}`, {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 從願望清單移除產品（通過 wishlistItem ID）
    removeFromWishlist: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入才能移除願望清單項目', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // 查找並驗證所有權
        const wishlistItem = await prisma.wishlistItem.findUnique({
          where: { id },
        })

        if (!wishlistItem) {
          throw new GraphQLError('願望清單項目不存在', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        if (wishlistItem.userId !== user.userId) {
          throw new GraphQLError('您無權移除此項目', {
            extensions: { code: 'FORBIDDEN' },
          })
        }

        // 刪除願望清單項目
        await prisma.wishlistItem.delete({
          where: { id },
        })

        // 更新產品的收藏數
        await prisma.product.update({
          where: { id: wishlistItem.productId },
          data: {
            favoriteCount: {
              decrement: 1,
            },
          },
        })

        return true
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('移除願望清單項目失敗:', error)
        throw new GraphQLError(`移除願望清單項目失敗：${error instanceof Error ? error.message : '未知錯誤'}`, {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 從願望清單移除產品（通過 productId）
    removeFromWishlistByProduct: async (
      _: any,
      { productId }: { productId: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入才能移除願望清單項目', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // 查找項目
        const wishlistItem = await prisma.wishlistItem.findUnique({
          where: {
            userId_productId: {
              userId: user.userId,
              productId,
            },
          },
        })

        if (!wishlistItem) {
          // 如果不存在，視為成功
          return true
        }

        // 刪除願望清單項目
        await prisma.wishlistItem.delete({
          where: {
            userId_productId: {
              userId: user.userId,
              productId,
            },
          },
        })

        // 更新產品的收藏數
        await prisma.product.update({
          where: { id: productId },
          data: {
            favoriteCount: {
              decrement: 1,
            },
          },
        })

        return true
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('移除願望清單項目失敗:', error)
        throw new GraphQLError(`移除願望清單項目失敗：${error instanceof Error ? error.message : '未知錯誤'}`, {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 清空願望清單
    clearWishlist: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入才能清空願望清單', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // 獲取所有產品 ID 以更新收藏數
        const wishlistItems = await prisma.wishlistItem.findMany({
          where: {
            userId: user.userId,
          },
          select: {
            productId: true,
          },
        })

        // 刪除所有願望清單項目
        await prisma.wishlistItem.deleteMany({
          where: {
            userId: user.userId,
          },
        })

        // 批量更新產品的收藏數
        for (const item of wishlistItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              favoriteCount: {
                decrement: 1,
              },
            },
          })
        }

        return true
      } catch (error) {
        console.error('清空願望清單失敗:', error)
        throw new GraphQLError(`清空願望清單失敗：${error instanceof Error ? error.message : '未知錯誤'}`, {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 切換願望清單狀態（添加/移除）
    toggleWishlist: async (
      _: any,
      { productId }: { productId: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入才能使用願望清單', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // 檢查是否已在願望清單中
        const existing = await prisma.wishlistItem.findUnique({
          where: {
            userId_productId: {
              userId: user.userId,
              productId,
            },
          },
        })

        if (existing) {
          // 已存在，移除
          await prisma.wishlistItem.delete({
            where: {
              userId_productId: {
                userId: user.userId,
                productId,
              },
            },
          })

          await prisma.product.update({
            where: { id: productId },
            data: {
              favoriteCount: {
                decrement: 1,
              },
            },
          })

          return {
            isInWishlist: false,
            message: '已從願望清單移除',
          }
        } else {
          // 不存在，添加
          const product = await prisma.product.findUnique({
            where: { id: productId },
          })

          if (!product) {
            throw new GraphQLError('產品不存在', {
              extensions: { code: 'NOT_FOUND' },
            })
          }

          if (!product.isActive) {
            throw new GraphQLError('此產品已下架，無法添加到願望清單', {
              extensions: { code: 'BAD_USER_INPUT' },
            })
          }

          await prisma.wishlistItem.create({
            data: {
              userId: user.userId,
              productId,
            },
          })

          await prisma.product.update({
            where: { id: productId },
            data: {
              favoriteCount: {
                increment: 1,
              },
            },
          })

          return {
            isInWishlist: true,
            message: '已添加到願望清單',
          }
        }
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('切換願望清單失敗:', error)
        throw new GraphQLError(`切換願望清單失敗：${error instanceof Error ? error.message : '未知錯誤'}`, {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },
  },

  WishlistItem: {
    user: async (wishlistItem: any) => {
      return await prisma.user.findUnique({
        where: { id: wishlistItem.userId },
      })
    },
    product: async (wishlistItem: any) => {
      return await prisma.product.findUnique({
        where: { id: wishlistItem.productId },
        include: {
          brand: true,
          category: true,
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          sizeCharts: {
            where: { isActive: true },
            orderBy: { eu: 'asc' },
          },
        },
      })
    },
  },
}
