import { GraphQLError } from 'graphql'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { Context } from '@/graphql/context'

export const homepageResolvers = {
  Query: {
    // 獲取首頁配置
    homepageConfigs: async (_: any, { isActive }: { isActive?: boolean }) => {
      const where = isActive !== undefined ? { isActive } : {}
      return prisma.homepageConfig.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取單個組件配置
    homepageConfig: async (_: any, { componentId }: { componentId: string }) => {
      return prisma.homepageConfig.findUnique({
        where: { componentId },
      })
    },

    // 獲取輪播圖
    heroSlides: async (_: any, { isActive }: { isActive?: boolean }) => {
      const now = new Date()
      const where: any = {}

      if (isActive !== undefined) {
        where.isActive = isActive
      }

      // 只顯示在有效期內的輪播圖
      where.OR = [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ]

      return prisma.heroSlide.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取促銷倒計時
    activeSaleCountdown: async () => {
      const now = new Date()
      return prisma.saleCountdown.findFirst({
        where: {
          isActive: true,
          endTime: { gt: now },
        },
        orderBy: { endTime: 'asc' },
      })
    },

    // 獲取服務保證項目
    guaranteeItems: async () => {
      return prisma.guaranteeItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取分類展示設定
    categoryDisplays: async () => {
      return prisma.categoryDisplay.findMany({
        where: { showOnHomepage: true },
        include: { category: true },
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 獲取限時搶購設定
    activeFlashSale: async () => {
      const now = new Date()
      return prisma.flashSaleConfig.findFirst({
        where: {
          isActive: true,
          startTime: { lte: now },
          endTime: { gt: now },
        },
      })
    },

    // 獲取今日特價
    todaysDeal: async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      return prisma.dailyDealConfig.findFirst({
        where: {
          isActive: true,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      })
    },

    // 獲取浮動促銷按鈕
    activeFloatingPromos: async () => {
      const now = new Date()
      return prisma.floatingPromo.findMany({
        where: {
          isActive: true,
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        },
      })
    },

    // 獲取超值優惠設定
    activeSuperDealSection: async () => {
      return prisma.superDealSection.findFirst({
        where: { isActive: true },
      })
    },

    // 獲取熱門產品設定
    popularProductsConfig: async () => {
      return prisma.popularProductsConfig.findFirst({
        where: { isActive: true },
      })
    },

    // 根據熱門產品設定獲取產品
    popularProducts: async () => {
      const config = await prisma.popularProductsConfig.findFirst({
        where: { isActive: true },
      })

      if (!config) {
        return []
      }

      // 根據算法獲取產品
      switch (config.algorithm) {
        case 'MANUAL':
          if (config.productIds) {
            const productIds = config.productIds as string[]
            return prisma.product.findMany({
              where: {
                id: { in: productIds },
                isActive: true,
              },
              include: {
                category: true,
                variants: true,
              },
              take: config.maxProducts,
            })
          }
          return []

        case 'SALES_VOLUME':
          // 根據銷量統計
          const timeRange = config.timeRange || 30
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - timeRange)

          const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
              quantity: true,
            },
            where: {
              order: {
                createdAt: { gte: startDate },
                status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
              },
            },
            orderBy: {
              _sum: {
                quantity: 'desc',
              },
            },
            take: config.maxProducts,
          })

          const productIds = topProducts.map(p => p.productId).filter(Boolean) as string[]
          return prisma.product.findMany({
            where: {
              id: { in: productIds },
              isActive: true,
            },
            include: {
              category: true,
              variants: true,
            },
          })

        case 'RATING':
          // 根據評分
          return prisma.product.findMany({
            where: {
              isActive: true,
              averageRating: { gte: 4.0 },
            },
            orderBy: [
              { averageRating: 'desc' },
              { totalReviews: 'desc' },
            ],
            include: {
              category: true,
              variants: true,
            },
            take: config.maxProducts,
          })

        case 'VIEW_COUNT':
          // 根據瀏覽次數（需要追蹤瀏覽數據）
          return prisma.product.findMany({
            where: { isActive: true },
            orderBy: { viewCount: 'desc' },
            include: {
              category: true,
              variants: true,
            },
            take: config.maxProducts,
          })

        case 'TRENDING':
          // 綜合算法（結合銷量、評分、瀏覽次數）
          // 這裡簡化實現，實際可以更複雜
          return prisma.product.findMany({
            where: {
              isActive: true,
              OR: [
                { isFeatured: true },
                { averageRating: { gte: 4.0 } },
                { totalReviews: { gte: 10 } },
              ],
            },
            orderBy: [
              { isFeatured: 'desc' },
              { averageRating: 'desc' },
              { totalReviews: 'desc' },
            ],
            include: {
              category: true,
              variants: true,
            },
            take: config.maxProducts,
          })

        default:
          return []
      }
    },
  },

  Mutation: {
    // 更新首頁配置
    updateHomepageConfig: async (
      _: any,
      { componentId, input }: { componentId: string; input: any },
      context: Context
    ) => {
      await requireAdmin(context)

      return prisma.homepageConfig.upsert({
        where: { componentId },
        update: input,
        create: {
          componentId,
          ...input,
        },
      })
    },

    // 批量更新首頁配置順序
    updateHomepageConfigOrder: async (
      _: any,
      { configs }: { configs: Array<{ componentId: string; sortOrder: number }> },
      context: Context
    ) => {
      await requireAdmin(context)

      const updates = configs.map(config =>
        prisma.homepageConfig.update({
          where: { componentId: config.componentId },
          data: { sortOrder: config.sortOrder },
        })
      )

      await prisma.$transaction(updates)
      return true
    },

    // 創建輪播圖
    createHeroSlide: async (_: any, { input }: { input: any }, context: Context) => {
      await requireAdmin(context)
      return prisma.heroSlide.create({ data: input })
    },

    // 更新輪播圖
    updateHeroSlide: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      await requireAdmin(context)
      return prisma.heroSlide.update({
        where: { id },
        data: input,
      })
    },

    // 刪除輪播圖
    deleteHeroSlide: async (_: any, { id }: { id: string }, context: Context) => {
      await requireAdmin(context)
      await prisma.heroSlide.delete({ where: { id } })
      return true
    },

    // 創建或更新促銷倒計時
    upsertSaleCountdown: async (_: any, { input }: { input: any }, context: Context) => {
      await requireAdmin(context)

      // 先停用其他活躍的倒計時
      await prisma.saleCountdown.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      // 創建新的倒計時
      return prisma.saleCountdown.create({
        data: { ...input, isActive: true },
      })
    },

    // 更新服務保證項目
    upsertGuaranteeItems: async (
      _: any,
      { items }: { items: any[] },
      context: Context
    ) => {
      await requireAdmin(context)

      // 刪除所有現有項目
      await prisma.guaranteeItem.deleteMany({})

      // 創建新項目
      const createdItems = await prisma.guaranteeItem.createMany({
        data: items.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      })

      return prisma.guaranteeItem.findMany({
        orderBy: { sortOrder: 'asc' },
      })
    },

    // 更新分類展示設定
    updateCategoryDisplay: async (
      _: any,
      { categoryId, input }: { categoryId: string; input: any },
      context: Context
    ) => {
      await requireAdmin(context)

      return prisma.categoryDisplay.upsert({
        where: { categoryId },
        update: input,
        create: {
          categoryId,
          ...input,
        },
        include: { category: true },
      })
    },

    // 創建或更新限時搶購
    upsertFlashSale: async (_: any, { input }: { input: any }, context: Context) => {
      await requireAdmin(context)

      // 停用其他活躍的限時搶購
      await prisma.flashSaleConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      return prisma.flashSaleConfig.create({
        data: { ...input, isActive: true },
      })
    },

    // 創建或更新每日特價
    upsertDailyDeal: async (
      _: any,
      { date, input }: { date: Date; input: any },
      context: Context
    ) => {
      await requireAdmin(context)

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      return prisma.dailyDealConfig.upsert({
        where: { date: startOfDay },
        update: input,
        create: {
          date: startOfDay,
          ...input,
        },
      })
    },

    // 創建浮動促銷按鈕
    createFloatingPromo: async (_: any, { input }: { input: any }, context: Context) => {
      await requireAdmin(context)
      return prisma.floatingPromo.create({ data: input })
    },

    // 更新浮動促銷按鈕
    updateFloatingPromo: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      await requireAdmin(context)
      return prisma.floatingPromo.update({
        where: { id },
        data: input,
      })
    },

    // 刪除浮動促銷按鈕
    deleteFloatingPromo: async (_: any, { id }: { id: string }, context: Context) => {
      await requireAdmin(context)
      await prisma.floatingPromo.delete({ where: { id } })
      return true
    },

    // 更新超值優惠設定
    upsertSuperDealSection: async (_: any, { input }: { input: any }, context: Context) => {
      await requireAdmin(context)

      // 停用其他活躍的設定
      await prisma.superDealSection.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      return prisma.superDealSection.create({
        data: { ...input, isActive: true },
      })
    },

    // 更新熱門產品設定
    upsertPopularProductsConfig: async (
      _: any,
      { input }: { input: any },
      context: Context
    ) => {
      await requireAdmin(context)

      // 停用其他活躍的設定
      await prisma.popularProductsConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      return prisma.popularProductsConfig.create({
        data: { ...input, isActive: true },
      })
    },
  },
}