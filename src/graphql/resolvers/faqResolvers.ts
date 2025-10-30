/**
 * FAQ Resolvers - 處理常見問題的 CRUD 操作
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

interface GraphQLContext {
  user?: {
    userId: string
    email: string
    role: string
  } | null
}

export const faqResolvers = {
  Query: {
    // 獲取已發布的 FAQ（前台用）
    faqs: async (
      _: any,
      { category }: { category?: string }
    ) => {
      return await prisma.faq.findMany({
        where: {
          isPublished: true,
          ...(category && { category }),
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ],
      })
    },

    // 獲取所有 FAQ（後台用）
    allFaqs: async (
      _: any,
      { skip = 0, take = 50, category }: { skip?: number; take?: number; category?: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const where: any = {}
      if (category) {
        where.category = category
      }

      const [total, items] = await Promise.all([
        prisma.faq.count({ where }),
        prisma.faq.findMany({
          where,
          skip,
          take,
          orderBy: [
            { sortOrder: 'asc' },
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

    // 獲取單個 FAQ
    faq: async (
      _: any,
      { id, slug }: { id?: string; slug?: string }
    ) => {
      if (!id && !slug) {
        throw new GraphQLError('必須提供 id 或 slug', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      const faq = await prisma.faq.findUnique({
        where: id ? { id } : { slug },
      })

      if (!faq) {
        throw new GraphQLError('FAQ 不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // 增加瀏覽次數
      await prisma.faq.update({
        where: { id: faq.id },
        data: { viewCount: { increment: 1 } },
      })

      return faq
    },

    // 獲取 FAQ 分類列表
    faqCategories: async () => {
      const faqs = await prisma.faq.findMany({
        where: {
          isPublished: true,
          category: { not: null },
        },
        select: { category: true },
        distinct: ['category'],
      })

      return faqs.map(f => f.category).filter(Boolean)
    },
  },

  Mutation: {
    // 創建 FAQ
    createFaq: async (
      _: any,
      { input }: { input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 自動生成 slug
      let slug = input.slug || slugify(input.question)

      // 檢查 slug 是否已存在
      const existing = await prisma.faq.findUnique({
        where: { slug },
      })

      if (existing) {
        // 如果存在，添加時間戳
        slug = `${slug}-${Date.now()}`
      }

      return await prisma.faq.create({
        data: {
          question: input.question,
          answer: input.answer,
          category: input.category || null,
          slug,
          sortOrder: input.sortOrder ?? 0,
          isPublished: input.isPublished ?? true,
        },
      })
    },

    // 更新 FAQ
    updateFaq: async (
      _: any,
      { id, input }: { id: string; input: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const exists = await prisma.faq.findUnique({
        where: { id },
      })

      if (!exists) {
        throw new GraphQLError('FAQ 不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const updateData: any = {}

      if (input.question !== undefined) updateData.question = input.question
      if (input.answer !== undefined) updateData.answer = input.answer
      if (input.category !== undefined) updateData.category = input.category || null
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder
      if (input.isPublished !== undefined) updateData.isPublished = input.isPublished

      // 如果更新了問題，重新生成 slug
      if (input.question && !input.slug) {
        let newSlug = slugify(input.question)
        const slugExists = await prisma.faq.findUnique({
          where: { slug: newSlug },
        })
        if (slugExists && slugExists.id !== id) {
          newSlug = `${newSlug}-${Date.now()}`
        }
        updateData.slug = newSlug
      } else if (input.slug) {
        updateData.slug = input.slug
      }

      return await prisma.faq.update({
        where: { id },
        data: updateData,
      })
    },

    // 刪除 FAQ
    deleteFaq: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const exists = await prisma.faq.findUnique({
        where: { id },
      })

      if (!exists) {
        throw new GraphQLError('FAQ 不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      await prisma.faq.delete({
        where: { id },
      })

      return { success: true }
    },

    // 標記 FAQ 為有用
    markFaqHelpful: async (
      _: any,
      { id }: { id: string }
    ) => {
      const faq = await prisma.faq.findUnique({
        where: { id },
      })

      if (!faq) {
        throw new GraphQLError('FAQ 不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return await prisma.faq.update({
        where: { id },
        data: { helpfulCount: { increment: 1 } },
      })
    },
  },
}
