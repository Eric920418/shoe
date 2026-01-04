/**
 * 聊天室 Resolvers - 處理客服聊天功能
 *
 * 安全措施：對用戶輸入進行 HTML 清理，防止 XSS
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { sanitizeHtml } from '@/lib/security'

interface GraphQLContext {
  user?: {
    userId: string
    email: string
    role: string
  } | null
}

export const chatResolvers = {
  Query: {
    // 獲取我的對話列表（用戶）
    myConversations: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return await prisma.conversation.findMany({
        where: { userId: user.userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }, // 按時間順序顯示所有訊息
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      })
    },

    // 獲取所有對話（管理員）
    allConversations: async (
      _: any,
      { skip = 0, take = 20, status }: { skip?: number; take?: number; status?: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const where: any = {}
      if (status) {
        where.status = status
      }

      const [items, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          skip,
          take,
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
        }),
        prisma.conversation.count({ where }),
      ])

      return {
        items,
        total,
        hasMore: skip + take < total,
      }
    },

    // 獲取對話詳情
    conversation: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      })

      if (!conversation) {
        throw new GraphQLError('對話不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 檢查權限：只能查看自己的對話或管理員可查看所有
      if (conversation.userId !== user.userId && user.role !== 'ADMIN') {
        throw new GraphQLError('無權查看此對話', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 標記未讀訊息為已讀
      if (user.role === 'ADMIN') {
        // 管理員標記用戶訊息為已讀
        await prisma.message.updateMany({
          where: {
            conversationId: id,
            senderType: 'USER',
            isRead: false,
          },
          data: { isRead: true },
        })
      } else {
        // 用戶標記管理員訊息為已讀
        await prisma.message.updateMany({
          where: {
            conversationId: id,
            senderType: 'ADMIN',
            isRead: false,
          },
          data: { isRead: true },
        })
      }

      return conversation
    },
  },

  Mutation: {
    // 創建新對話（用戶）
    createConversation: async (
      _: any,
      { subject, message, imageUrl }: { subject?: string; message: string; imageUrl?: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // 安全措施：清理用戶輸入，防止 XSS
      const sanitizedSubject = subject ? sanitizeHtml(subject) : '新的諮詢'
      const sanitizedMessage = sanitizeHtml(message)

      // 創建對話
      const conversation = await prisma.conversation.create({
        data: {
          userId: user.userId,
          subject: sanitizedSubject,
          messages: {
            create: {
              senderId: user.userId,
              senderType: 'USER',
              content: sanitizedMessage,
              imageUrl: imageUrl || null,
            },
          },
        },
        include: {
          messages: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return conversation
    },

    // 發送訊息
    sendMessage: async (
      _: any,
      { conversationId, content, imageUrl }: { conversationId: string; content: string; imageUrl?: string },
      { user }: GraphQLContext
    ) => {
      if (!user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // 獲取對話
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      })

      if (!conversation) {
        throw new GraphQLError('對話不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 檢查權限
      if (conversation.userId !== user.userId && user.role !== 'ADMIN') {
        throw new GraphQLError('無權在此對話中發送訊息', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 安全措施：清理用戶輸入，防止 XSS
      const sanitizedContent = sanitizeHtml(content)

      // 創建訊息
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: user.userId,
          senderType: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
          content: sanitizedContent,
          imageUrl: imageUrl || null,
        },
      })

      // 更新對話的最後訊息時間
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      })

      return message
    },

    // 更新對話狀態（管理員）
    updateConversationStatus: async (
      _: any,
      { id, status }: { id: string; status: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.conversation.update({
        where: { id },
        data: { status: status as any },
      })
    },
  },

  Conversation: {
    unreadCount: async (parent: any, _: any, { user }: GraphQLContext) => {
      if (!user) return 0

      // 計算未讀訊息數
      const senderType = user.role === 'ADMIN' ? 'USER' : 'ADMIN'

      return await prisma.message.count({
        where: {
          conversationId: parent.id,
          senderType,
          isRead: false,
        },
      })
    },
  },
}
