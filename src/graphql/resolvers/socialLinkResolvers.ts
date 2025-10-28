/**
 * 社群連結 Resolvers
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

export const socialLinkResolvers = {
  Query: {
    socialLinks: async () => {
      return await prisma.socialLink.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    allSocialLinks: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.socialLink.findMany({
        orderBy: { sortOrder: 'asc' },
      })
    },
  },

  Mutation: {
    createSocialLink: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.socialLink.create({
        data: input,
      })
    },

    updateSocialLink: async (
      _: any,
      { id, input }: { id: string; input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.socialLink.update({
        where: { id },
        data: input,
      })
    },

    deleteSocialLink: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      await prisma.socialLink.delete({ where: { id } })
      return { success: true }
    },
  },
}
