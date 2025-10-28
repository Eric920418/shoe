/**
 * Review Resolvers
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

export const reviewResolvers = {
  Query: {
    // Get product reviews
    productReviews: async (
      _: any,
      { productId, skip = 0, take = 20 }: { productId: string; skip?: number; take?: number }
    ) => {
      return await prisma.review.findMany({
        where: {
          productId,
          isApproved: true,
          isPublic: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })
    },

    // Get my reviews
    myReviews: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('Please login first', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return await prisma.review.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
      })
    },
  },

  Mutation: {
    // Create review
    createReview: async (
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
        // Check if already reviewed
        if (input.orderId) {
          const existing = await prisma.review.findUnique({
            where: {
              userId_productId_orderId: {
                userId: user.userId,
                productId: input.productId,
                orderId: input.orderId,
              },
            },
          })

          if (existing) {
            throw new GraphQLError('You have already reviewed this product', {
              extensions: { code: 'BAD_USER_INPUT' },
            })
          }
        }

        const review = await prisma.review.create({
          data: {
            userId: user.userId,
            productId: input.productId,
            rating: input.rating,
            title: input.title || null,
            content: input.content,
            images: input.images || [],
            orderId: input.orderId || null,
            sizeFit: input.sizeFit || null,
            boughtSize: input.boughtSize || null,
            verified: !!input.orderId,
            isApproved: false, // Requires approval
          },
          include: {
            product: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        })

        return review
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('Create review failed:', error)
        throw new GraphQLError('Create review failed', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },
  },

  Review: {
    user: async (review: any) => {
      return await prisma.user.findUnique({
        where: { id: review.userId },
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      })
    },
    product: async (review: any) => {
      return await prisma.product.findUnique({
        where: { id: review.productId },
      })
    },
  },
}
