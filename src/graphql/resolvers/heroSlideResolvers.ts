/**
 * 首頁輪播圖 Resolvers - 處理首頁輪播圖的 CRUD 操作
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

interface CreateHeroSlideInput {
  title: string
  subtitle?: string
  description?: string
  image: string
  cta: string
  link: string
  sortOrder?: number
  isActive?: boolean
}

interface UpdateHeroSlideInput {
  title?: string
  subtitle?: string
  description?: string
  image?: string
  cta?: string
  link?: string
  sortOrder?: number
  isActive?: boolean
}

export const heroSlideResolvers = {
  Query: {
    // 獲取所有輪播圖（後台用）
    heroSlides: async (
      _: any,
      __: any,
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足：需要管理員權限', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.heroSlide.findMany({
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取啟用的輪播圖（前台用）
    activeHeroSlides: async () => {
      return await prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取單個輪播圖
    heroSlide: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足：需要管理員權限', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const slide = await prisma.heroSlide.findUnique({
        where: { id },
      })

      if (!slide) {
        throw new GraphQLError('輪播圖不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return slide
    },
  },

  Mutation: {
    // 創建輪播圖
    createHeroSlide: async (
      _: any,
      { input }: { input: CreateHeroSlideInput },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足：需要管理員權限', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 如果沒有指定 sortOrder，自動設為最大值 + 1
      let sortOrder = input.sortOrder ?? 0
      if (sortOrder === 0) {
        const maxSlide = await prisma.heroSlide.findFirst({
          orderBy: { sortOrder: 'desc' },
        })
        sortOrder = (maxSlide?.sortOrder ?? 0) + 1
      }

      return await prisma.heroSlide.create({
        data: {
          title: input.title,
          subtitle: input.subtitle || null,
          description: input.description || null,
          image: input.image,
          cta: input.cta,
          link: input.link,
          sortOrder,
          isActive: input.isActive ?? true,
        },
      })
    },

    // 更新輪播圖
    updateHeroSlide: async (
      _: any,
      { id, input }: { id: string; input: UpdateHeroSlideInput },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足：需要管理員權限', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const exists = await prisma.heroSlide.findUnique({
        where: { id },
      })

      if (!exists) {
        throw new GraphQLError('輪播圖不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const updateData: any = {}

      if (input.title !== undefined) updateData.title = input.title
      if (input.subtitle !== undefined) updateData.subtitle = input.subtitle || null
      if (input.description !== undefined) updateData.description = input.description || null
      if (input.image !== undefined) updateData.image = input.image
      if (input.cta !== undefined) updateData.cta = input.cta
      if (input.link !== undefined) updateData.link = input.link
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder
      if (input.isActive !== undefined) updateData.isActive = input.isActive

      return await prisma.heroSlide.update({
        where: { id },
        data: updateData,
      })
    },

    // 刪除輪播圖
    deleteHeroSlide: async (
      _: any,
      { id }: { id: string },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足：需要管理員權限', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const exists = await prisma.heroSlide.findUnique({
        where: { id },
      })

      if (!exists) {
        throw new GraphQLError('輪播圖不存在', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      await prisma.heroSlide.delete({
        where: { id },
      })

      return true
    },

    // 重新排序輪播圖
    reorderHeroSlides: async (
      _: any,
      { ids }: { ids: string[] },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足：需要管理員權限', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // 批量更新排序
      await Promise.all(
        ids.map((id, index) =>
          prisma.heroSlide.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      )

      // 返回更新後的列表
      return await prisma.heroSlide.findMany({
        where: { id: { in: ids } },
        orderBy: { sortOrder: 'asc' },
      })
    },
  },
}
