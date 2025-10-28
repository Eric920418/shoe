/**
 * 公告 Resolvers - 處理系統公告的 CRUD 操作
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

export const announcementResolvers = {
  Query: {
    // 獲取活躍的公告（前台用）
    activeAnnouncements: async () => {
      const now = new Date()
      return await prisma.announcement.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 5, // 最多顯示 5 則公告
      })
    },

    // 獲取所有公告（後台用）
    announcements: async (
      _: any,
      { skip = 0, take = 20, where }: { skip?: number; take?: number; where?: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const [total, items] = await Promise.all([
        prisma.announcement.count({ where }),
        prisma.announcement.findMany({
          where,
          skip,
          take,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
        }),
      ])

      return {
        items,
        total,
        hasMore: skip + take < total,
      }
    },

    // 獲取單個公告
    announcement: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const announcement = await prisma.announcement.findUnique({
        where: { id },
      })

      if (!announcement) {
        throw new GraphQLError('公告不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return announcement
    },
  },

  Mutation: {
    // 創建公告
    createAnnouncement: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          type: input.type || 'INFO',
          priority: input.priority ?? 0,
          isActive: input.isActive ?? true,
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          endDate: input.endDate ? new Date(input.endDate) : null,
          actionUrl: input.actionUrl || null,
          actionLabel: input.actionLabel || null,
          createdBy: user.userId,
        },
      })
    },

    // 更新公告
    updateAnnouncement: async (
      _: any,
      { id, input }: { id: string; input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const exists = await prisma.announcement.findUnique({
        where: { id },
      })

      if (!exists) {
        throw new GraphQLError('公告不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const updateData: any = {}

      if (input.title !== undefined) updateData.title = input.title
      if (input.content !== undefined) updateData.content = input.content
      if (input.type !== undefined) updateData.type = input.type
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.isActive !== undefined) updateData.isActive = input.isActive
      if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate)
      if (input.endDate !== undefined) {
        updateData.endDate = input.endDate ? new Date(input.endDate) : null
      }
      if (input.actionUrl !== undefined) updateData.actionUrl = input.actionUrl || null
      if (input.actionLabel !== undefined) updateData.actionLabel = input.actionLabel || null

      return await prisma.announcement.update({
        where: { id },
        data: updateData,
      })
    },

    // 刪除公告
    deleteAnnouncement: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const exists = await prisma.announcement.findUnique({
        where: { id },
      })

      if (!exists) {
        throw new GraphQLError('公告不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      await prisma.announcement.delete({
        where: { id },
      })

      return { success: true }
    },
  },
}
