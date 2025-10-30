/**
 * Email Campaign Resolvers - 郵件行銷活動
 */

import { prisma } from '@/lib/prisma'
import { GraphQLError } from 'graphql'
import { EmailCampaignStatus, EmailLogStatus } from '@prisma/client'
import { sendEmail, generateEmailTemplate } from '@/lib/email'
import crypto from 'crypto'

/**
 * 檢查是否為管理員
 */
function requireAdmin(context: any) {
  if (!context.user || context.user.role !== 'ADMIN') {
    throw new GraphQLError('需要管理員權限才能執行此操作', {
      extensions: { code: 'FORBIDDEN' },
    })
  }
}

/**
 * 生成退訂 token
 */
function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export const emailCampaignResolvers = {
  Query: {
    /**
     * 查詢所有郵件活動（分頁）
     */
    emailCampaigns: async (
      _: any,
      args: {
        status?: EmailCampaignStatus
        page?: number
        limit?: number
      },
      context: any
    ) => {
      requireAdmin(context)

      const page = args.page || 1
      const limit = args.limit || 20
      const skip = (page - 1) * limit

      const where: any = {}
      if (args.status) {
        where.status = args.status
      }

      const [items, total] = await Promise.all([
        prisma.emailCampaign.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.emailCampaign.count({ where }),
      ])

      return {
        items,
        total,
        hasMore: skip + items.length < total,
      }
    },

    /**
     * 查詢單個郵件活動
     */
    emailCampaign: async (_: any, { id }: { id: string }, context: any) => {
      requireAdmin(context)

      const campaign = await prisma.emailCampaign.findUnique({
        where: { id },
        include: {
          emailLogs: {
            take: 100, // 限制最多顯示 100 條記錄
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!campaign) {
        throw new GraphQLError('找不到該郵件活動', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return campaign
    },

    /**
     * 預覽郵件發送統計（不實際發送）
     */
    emailPreviewStats: async (
      _: any,
      { targetAudience }: { targetAudience: any },
      context: any
    ) => {
      requireAdmin(context)

      // 查詢符合條件的用戶數量
      const where: any = {
        email: { not: null }, // 必須有郵件地址
        isActive: true,       // 帳戶必須啟用
      }

      // 如果有目標受眾條件，應用篩選
      if (targetAudience?.membershipTierId) {
        where.membershipTierId = targetAudience.membershipTierId
      }
      if (targetAudience?.minTotalSpent !== undefined) {
        where.totalSpent = { gte: targetAudience.minTotalSpent }
      }
      if (targetAudience?.maxTotalSpent !== undefined) {
        where.totalSpent = { ...where.totalSpent, lte: targetAudience.maxTotalSpent }
      }

      const [totalRecipients, subscribedUsers] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({
          where: { ...where, marketingEmailOptIn: true },
        }),
      ])

      return {
        totalRecipients,
        subscribedUsers,
      }
    },
  },

  Mutation: {
    /**
     * 創建郵件活動
     */
    createEmailCampaign: async (
      _: any,
      {
        input,
      }: {
        input: {
          name: string
          subject: string
          htmlContent: string
          textContent?: string
          targetAudience?: any
          scheduledAt?: Date
        }
      },
      context: any
    ) => {
      requireAdmin(context)

      const campaign = await prisma.emailCampaign.create({
        data: {
          name: input.name,
          subject: input.subject,
          htmlContent: input.htmlContent,
          textContent: input.textContent,
          targetAudience: input.targetAudience || {},
          scheduledAt: input.scheduledAt,
          status: EmailCampaignStatus.DRAFT,
          createdBy: context.user.id,
        },
      })

      return campaign
    },

    /**
     * 更新郵件活動
     */
    updateEmailCampaign: async (
      _: any,
      {
        id,
        input,
      }: {
        id: string
        input: {
          name?: string
          subject?: string
          htmlContent?: string
          textContent?: string
          targetAudience?: any
          scheduledAt?: Date
          status?: EmailCampaignStatus
        }
      },
      context: any
    ) => {
      requireAdmin(context)

      const campaign = await prisma.emailCampaign.findUnique({
        where: { id },
      })

      if (!campaign) {
        throw new GraphQLError('找不到該郵件活動', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 如果活動已發送，不允許修改內容
      if (campaign.status === EmailCampaignStatus.SENT) {
        throw new GraphQLError('已發送的郵件活動無法修改', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      const updated = await prisma.emailCampaign.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.subject && { subject: input.subject }),
          ...(input.htmlContent && { htmlContent: input.htmlContent }),
          ...(input.textContent !== undefined && { textContent: input.textContent }),
          ...(input.targetAudience !== undefined && { targetAudience: input.targetAudience }),
          ...(input.scheduledAt !== undefined && { scheduledAt: input.scheduledAt }),
          ...(input.status && { status: input.status }),
        },
      })

      return updated
    },

    /**
     * 發送郵件活動
     */
    sendEmailCampaign: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      requireAdmin(context)

      const campaign = await prisma.emailCampaign.findUnique({
        where: { id },
      })

      if (!campaign) {
        throw new GraphQLError('找不到該郵件活動', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      if (campaign.status === EmailCampaignStatus.SENT) {
        throw new GraphQLError('該郵件活動已發送', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      // 標記為發送中
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: EmailCampaignStatus.SENDING },
      })

      // 查詢符合條件的用戶
      const where: any = {
        email: { not: null },
        isActive: true,
        marketingEmailOptIn: true, // 僅發送給同意接收的用戶
      }

      const targetAudience = campaign.targetAudience as any
      if (targetAudience?.membershipTierId) {
        where.membershipTierId = targetAudience.membershipTierId
      }
      if (targetAudience?.minTotalSpent !== undefined) {
        where.totalSpent = { gte: targetAudience.minTotalSpent }
      }
      if (targetAudience?.maxTotalSpent !== undefined) {
        where.totalSpent = { ...where.totalSpent, lte: targetAudience.maxTotalSpent }
      }

      const recipients = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          unsubscribeToken: true,
        },
      })

      // 為沒有 unsubscribeToken 的用戶生成 token
      for (const user of recipients) {
        if (!user.unsubscribeToken) {
          const token = generateUnsubscribeToken()
          await prisma.user.update({
            where: { id: user.id },
            data: { unsubscribeToken: token },
          })
          user.unsubscribeToken = token
        }
      }

      // 創建郵件發送記錄
      const emailLogs = recipients.map((user) => ({
        campaignId: campaign.id,
        userId: user.id,
        email: user.email!,
        status: EmailLogStatus.PENDING,
      }))

      await prisma.emailLog.createMany({ data: emailLogs })

      // 批量發送郵件（異步）
      setImmediate(async () => {
        let successCount = 0
        let failedCount = 0

        for (const user of recipients) {
          try {
            const htmlContent = generateEmailTemplate({
              title: campaign.subject,
              content: campaign.htmlContent,
              unsubscribeToken: user.unsubscribeToken || undefined,
            })

            const result = await sendEmail({
              to: user.email!,
              subject: campaign.subject,
              html: htmlContent,
              text: campaign.textContent,
            })

            if (result.success) {
              successCount++
              await prisma.emailLog.updateMany({
                where: {
                  campaignId: campaign.id,
                  userId: user.id,
                },
                data: {
                  status: EmailLogStatus.SENT,
                  sentAt: new Date(),
                },
              })
            } else {
              failedCount++
              await prisma.emailLog.updateMany({
                where: {
                  campaignId: campaign.id,
                  userId: user.id,
                },
                data: {
                  status: EmailLogStatus.FAILED,
                  errorMessage: result.error || '發送失敗',
                },
              })
            }

            // 每封郵件之間延遲 1 秒，避免觸發 SMTP 限制
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error: any) {
            failedCount++
            console.error(`發送郵件失敗 (用戶: ${user.id}):`, error)
            await prisma.emailLog.updateMany({
              where: {
                campaignId: campaign.id,
                userId: user.id,
              },
              data: {
                status: EmailLogStatus.FAILED,
                errorMessage: error.message || '未知錯誤',
              },
            })
          }
        }

        // 更新活動狀態
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: EmailCampaignStatus.SENT,
            sentAt: new Date(),
            totalRecipients: recipients.length,
            successCount,
            failedCount,
          },
        })
      })

      // 立即返回（不等待發送完成）
      return prisma.emailCampaign.update({
        where: { id },
        data: {
          totalRecipients: recipients.length,
        },
      })
    },

    /**
     * 刪除郵件活動
     */
    deleteEmailCampaign: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      requireAdmin(context)

      const campaign = await prisma.emailCampaign.findUnique({
        where: { id },
      })

      if (!campaign) {
        throw new GraphQLError('找不到該郵件活動', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      await prisma.emailCampaign.delete({
        where: { id },
      })

      return true
    },

    /**
     * 用戶更新郵件訂閱設定
     */
    updateEmailSubscription: async (
      _: any,
      { subscribed }: { subscribed: boolean },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('請先登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const user = await prisma.user.update({
        where: { id: context.user.id },
        data: {
          marketingEmailOptIn: subscribed,
          marketingEmailOptInAt: subscribed ? new Date() : null,
          unsubscribeToken: subscribed ? generateUnsubscribeToken() : null,
        },
      })

      return user
    },

    /**
     * 退訂郵件（使用 token）
     */
    unsubscribeEmail: async (_: any, { token }: { token: string }) => {
      const user = await prisma.user.findUnique({
        where: { unsubscribeToken: token },
      })

      if (!user) {
        throw new GraphQLError('無效的退訂連結', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          marketingEmailOptIn: false,
          marketingEmailOptInAt: null,
        },
      })

      return true
    },
  },

  // 欄位解析器
  EmailCampaign: {
    emailLogs: async (parent: any) => {
      if (parent.emailLogs) {
        return parent.emailLogs
      }
      return prisma.emailLog.findMany({
        where: { campaignId: parent.id },
        orderBy: { createdAt: 'desc' },
      })
    },
  },

  EmailLog: {
    campaign: async (parent: any) => {
      if (parent.campaign) {
        return parent.campaign
      }
      return prisma.emailCampaign.findUnique({
        where: { id: parent.campaignId },
      })
    },
    user: async (parent: any) => {
      if (parent.user) {
        return parent.user
      }
      return prisma.user.findUnique({
        where: { id: parent.userId },
      })
    },
  },
}
