/**
 * User Resolvers
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

export const userResolvers = {
  User: {
    // 計算會員等級字串（用於相容舊的 membershipTier 查詢）
    membershipTier: async (parent: any) => {
      // 如果有 membershipTierConfig，返回其 slug
      if (parent.membershipTierConfig) {
        return parent.membershipTierConfig.slug?.toUpperCase()
      }

      // 否則查詢資料庫
      if (parent.membershipTierId) {
        const tier = await prisma.membershipTierConfig.findUnique({
          where: { id: parent.membershipTierId },
        })
        return tier?.slug?.toUpperCase() || null
      }

      return null
    },

    // 確保 membershipTierConfig 正確載入
    membershipTierConfig: async (parent: any) => {
      if (parent.membershipTierConfig) {
        return parent.membershipTierConfig
      }

      if (parent.membershipTierId) {
        return await prisma.membershipTierConfig.findUnique({
          where: { id: parent.membershipTierId },
        })
      }

      return null
    },
  },

  Query: {
    // Get current user info
    me: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return await prisma.user.findUnique({
        where: { id: user.userId },
        include: {
          addresses: {
            orderBy: { createdAt: 'desc' },
          },
          membershipTierConfig: true, // 載入會員等級配置
        },
      })
    },

    // Admin: Get all users with filters and pagination
    users: async (
      _: any,
      {
        search,
        role,
        membershipTierId,
        isActive,
        page = 1,
        limit = 20,
      }: {
        search?: string
        role?: string
        membershipTierId?: string
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

      // Build where clause
      const where: any = {}

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ]
      }

      if (role) {
        where.role = role
      }

      if (membershipTierId) {
        where.membershipTierId = membershipTierId
      }

      if (typeof isActive === 'boolean') {
        where.isActive = isActive
      }

      // Get total count
      const total = await prisma.user.count({ where })

      // Get paginated users
      const users = await prisma.user.findMany({
        where,
        include: {
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              addresses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    },

    // Admin: Get single user by ID
    userById: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      // Check admin permission
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const targetUser = await prisma.user.findUnique({
        where: { id },
        include: {
          addresses: true,
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          pointTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              addresses: true,
              cartItems: true,
              wishlistItems: true,
            },
          },
        },
      })

      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return targetUser
    },

    // Get user addresses
    myAddresses: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return await prisma.address.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      })
    },

    // Get single address
    address: async (_: any, { id }: { id: string }, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const address = await prisma.address.findUnique({
        where: { id },
      })

      if (!address) {
        throw new GraphQLError('Address not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      if (address.userId !== user.userId) {
        throw new GraphQLError('Access denied', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return address
    },
  },

  Mutation: {
    // Update profile
    updateProfile: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // 獲取當前用戶資料
        const currentUser = await prisma.user.findUnique({
          where: { id: user.userId },
        })

        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        // 檢測是否首次綁定真實信箱
        const isBindingRealEmail =
          input.email &&
          input.email.trim() !== '' &&
          !input.email.startsWith('line_') &&
          !input.email.endsWith('@temp.local') &&
          (!currentUser.email ||
           currentUser.email.startsWith('line_') ||
           currentUser.email.endsWith('@temp.local'))

        // 更新用戶資料
        const updatedUser = await prisma.user.update({
          where: { id: user.userId },
          data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            birthday: input.birthday,
            gender: input.gender,
          },
        })

        // 如果是首次綁定信箱，發放優惠券
        if (isBindingRealEmail) {
          try {
            // 檢查是否已經領取過綁定信箱優惠券
            const existingCoupon = await prisma.userCoupon.findFirst({
              where: {
                userId: user.userId,
                coupon: {
                  code: 'EMAIL_BINDING_100',
                },
              },
            })

            // 如果還沒領取過，發放優惠券
            if (!existingCoupon) {
              const emailBindingCoupon = await prisma.coupon.findUnique({
                where: { code: 'EMAIL_BINDING_100' },
              })

              if (emailBindingCoupon) {
                await prisma.userCoupon.create({
                  data: {
                    userId: user.userId,
                    couponId: emailBindingCoupon.id,
                    obtainedFrom: '綁定信箱獎勵',
                    expiresAt: emailBindingCoupon.validUntil,
                  },
                })

                console.log(`✅ 已為用戶 ${user.userId} 發放綁定信箱優惠券`)
              }
            }
          } catch (couponError) {
            // 優惠券發放失敗不影響用戶資料更新
            console.error('發放綁定信箱優惠券失敗:', couponError)
          }
        }

        return updatedUser
      } catch (error) {
        console.error('Update profile failed:', error)
        throw new GraphQLError('Update profile failed', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Admin: Update user (membership tier, role, status, points)
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: any },
      { user }: GraphQLContext
    ) => {
      // Check admin permission
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied. Admin permission required.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      try {
        const updateData: any = {}

        // Only ADMIN can change role
        if (input.role && user.role === 'ADMIN') {
          updateData.role = input.role
        }

        if (input.membershipTierId) {
          updateData.membershipTierId = input.membershipTierId
        }

        if (typeof input.membershipPoints === 'number') {
          updateData.membershipPoints = input.membershipPoints
        }

        if (typeof input.isActive === 'boolean') {
          updateData.isActive = input.isActive
        }

        if (input.name) {
          updateData.name = input.name
        }

        if (input.phone) {
          updateData.phone = input.phone
        }

        if (input.email) {
          updateData.email = input.email
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
        })

        return updatedUser
      } catch (error) {
        console.error('Admin update user failed:', error)
        throw new GraphQLError('Update user failed', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Create address
    createAddress: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // Unset other default addresses if this is default
        if (input.isDefault) {
          await prisma.address.updateMany({
            where: {
              userId: user.userId,
              isDefault: true,
            },
            data: {
              isDefault: false,
            },
          })
        }

        const address = await prisma.address.create({
          data: {
            userId: user.userId,
            name: input.name,
            phone: input.phone,
            country: input.country || 'Taiwan',
            city: input.city,
            district: input.district,
            street: input.street,
            zipCode: input.zipCode,
            isDefault: input.isDefault || false,
          },
        })

        return address
      } catch (error) {
        console.error('Create address failed:', error)
        throw new GraphQLError('Create address failed', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Update address
    updateAddress: async (
      _: any,
      { id, input }: { id: string; input: any },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // Verify ownership
        const existingAddress = await prisma.address.findUnique({
          where: { id },
        })

        if (!existingAddress) {
          throw new GraphQLError('Address not found', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        if (existingAddress.userId !== user.userId) {
          throw new GraphQLError('Access denied', {
            extensions: { code: 'FORBIDDEN' },
          })
        }

        // Unset other default addresses if this is default
        if (input.isDefault) {
          await prisma.address.updateMany({
            where: {
              userId: user.userId,
              isDefault: true,
              id: { not: id },
            },
            data: {
              isDefault: false,
            },
          })
        }

        const address = await prisma.address.update({
          where: { id },
          data: {
            name: input.name,
            phone: input.phone,
            country: input.country,
            city: input.city,
            district: input.district,
            street: input.street,
            zipCode: input.zipCode,
            isDefault: input.isDefault,
          },
        })

        return address
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('Update address failed:', error)
        throw new GraphQLError('Update address failed', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Delete address
    deleteAddress: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // Verify ownership
        const existingAddress = await prisma.address.findUnique({
          where: { id },
        })

        if (!existingAddress) {
          throw new GraphQLError('Address not found', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        if (existingAddress.userId !== user.userId) {
          throw new GraphQLError('Access denied', {
            extensions: { code: 'FORBIDDEN' },
          })
        }

        await prisma.address.delete({
          where: { id },
        })

        return true
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('Delete address failed:', error)
        throw new GraphQLError('Delete address failed', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // Set default address
    setDefaultAddress: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        // Verify ownership
        const existingAddress = await prisma.address.findUnique({
          where: { id },
        })

        if (!existingAddress) {
          throw new GraphQLError('Address not found', {
            extensions: { code: 'NOT_FOUND' },
          })
        }

        if (existingAddress.userId !== user.userId) {
          throw new GraphQLError('Access denied', {
            extensions: { code: 'FORBIDDEN' },
          })
        }

        // Unset other default addresses
        await prisma.address.updateMany({
          where: {
            userId: user.userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        })

        // Set new default
        const address = await prisma.address.update({
          where: { id },
          data: {
            isDefault: true,
          },
        })

        return address
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('Set default address failed:', error)
        throw new GraphQLError('Set default address failed', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },
  },
}
