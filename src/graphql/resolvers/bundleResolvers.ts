import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { Context } from '@/graphql/context'

export const bundleResolvers = {
  Query: {
    // 獲取所有組合套裝（後台管理用）
    productBundles: async (
      _: any,
      { isActive }: { isActive?: boolean },
      context: Context
    ) => {
      await requireAdmin(context)

      const where: any = {}
      if (isActive !== undefined) {
        where.isActive = isActive
      }

      return prisma.productBundle.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                },
              },
              variant: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      })
    },

    // 獲取單個組合套裝
    productBundle: async (_: any, { slug }: { slug: string }) => {
      return prisma.productBundle.findUnique({
        where: { slug },
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                  sizeCharts: true,
                },
              },
              variant: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
    },

    // 獲取正在進行中的組合套裝（前台顯示）
    activeBundles: async () => {
      const now = new Date()

      return prisma.productBundle.findMany({
        where: {
          isActive: true,
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                },
              },
              variant: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      })
    },

    // 獲取首頁展示的組合套裝
    homepageBundles: async () => {
      const now = new Date()

      return prisma.productBundle.findMany({
        where: {
          isActive: true,
          showOnHomepage: true,
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                },
              },
              variant: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
        ],
        take: 6, // 首頁最多顯示 6 個組合
      })
    },
  },

  Mutation: {
    // 創建組合套裝
    createProductBundle: async (
      _: any,
      { input }: { input: any },
      context: Context
    ) => {
      try {
        await requireAdmin(context)

        // 自動生成 slug（基於名稱 + 時間戳）
        const generateSlug = (name: string) => {
          const baseSlug = name
            .toLowerCase()
            .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-') // 支援中文
            .replace(/^-+|-+$/g, '') // 移除首尾的 -
          const timestamp = Date.now().toString().slice(-6) // 使用時間戳後6位
          return `${baseSlug}-${timestamp}`
        }

        let slug = input.slug || generateSlug(input.name)

        // 驗證 slug 唯一性，如果重複則添加隨機數
        let existing = await prisma.productBundle.findUnique({
          where: { slug },
        })

        if (existing) {
          // 如果 slug 已存在，添加隨機數
          const random = Math.floor(Math.random() * 10000)
          slug = `${slug}-${random}`
        }

        // 計算折扣金額和百分比
        const originalPrice = parseFloat(input.originalPrice)
        const bundlePrice = parseFloat(input.bundlePrice)
        const discount = originalPrice - bundlePrice
        const discountPercent = originalPrice > 0 ? (discount / originalPrice) * 100 : 0

        console.log('創建組合套裝:', {
          name: input.name,
          slug,
          originalPrice,
          bundlePrice,
          discount,
          discountPercent
        })

        // 創建組合套裝
        const bundle = await prisma.productBundle.create({
          data: {
            name: input.name,
            slug,
            description: input.description,
            originalPrice: input.originalPrice,
            bundlePrice: input.bundlePrice,
            discount,
            discountPercent,
            image: input.image,
            images: input.images || [],
            isActive: input.isActive !== undefined ? input.isActive : true,
            isFeatured: input.isFeatured || false,
            showOnHomepage: input.showOnHomepage !== undefined ? input.showOnHomepage : true,
            sortOrder: input.sortOrder || 0,
            startDate: input.startDate,
            endDate: input.endDate,
            maxPurchaseQty: input.maxPurchaseQty,
          },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        })

        console.log('組合套裝創建成功:', bundle.id)
        return bundle
      } catch (error) {
        console.error('創建組合套裝失敗:', error)

        // 處理 Prisma 錯誤
        if (error.code === 'P2002') {
          throw new GraphQLError(`組合套裝 slug 重複，請重試`)
        }

        if (error.code === 'P2003') {
          throw new GraphQLError(`無效的關聯資料（可能是產品或變體不存在）`)
        }

        // 如果是 GraphQLError 直接拋出
        if (error instanceof GraphQLError) {
          throw error
        }

        // 其他錯誤顯示完整訊息
        throw new GraphQLError(`創建組合套裝失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
      }
    },

    // 更新組合套裝
    updateProductBundle: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      await requireAdmin(context)

      // 如果更新了價格，重新計算折扣
      const updateData: any = { ...input }

      if (input.originalPrice !== undefined || input.bundlePrice !== undefined) {
        const bundle = await prisma.productBundle.findUnique({
          where: { id },
        })

        if (!bundle) {
          throw new GraphQLError(`組合套裝 ID "${id}" 不存在`)
        }

        const originalPrice = input.originalPrice !== undefined
          ? parseFloat(input.originalPrice)
          : parseFloat(bundle.originalPrice.toString())

        const bundlePrice = input.bundlePrice !== undefined
          ? parseFloat(input.bundlePrice)
          : parseFloat(bundle.bundlePrice.toString())

        updateData.discount = originalPrice - bundlePrice
        updateData.discountPercent = originalPrice > 0 ? ((originalPrice - bundlePrice) / originalPrice) * 100 : 0
      }

      return prisma.productBundle.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                },
              },
              variant: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
    },

    // 刪除組合套裝
    deleteProductBundle: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      await requireAdmin(context)

      await prisma.productBundle.delete({
        where: { id },
      })

      return true
    },

    // 添加產品到組合
    addBundleItem: async (
      _: any,
      { input }: { input: any },
      context: Context
    ) => {
      await requireAdmin(context)

      // 驗證產品存在
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
      })

      if (!product) {
        throw new GraphQLError(`產品 ID "${input.productId}" 不存在`)
      }

      // 如果指定了變體，驗證變體存在
      if (input.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: input.variantId },
        })

        if (!variant) {
          throw new GraphQLError(`產品變體 ID "${input.variantId}" 不存在`)
        }

        if (variant.productId !== input.productId) {
          throw new GraphQLError(`產品變體 ID "${input.variantId}" 不屬於產品 ID "${input.productId}"`)
        }
      }

      return prisma.bundleItem.create({
        data: {
          bundleId: input.bundleId,
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity || 1,
          allowVariantSelection: input.allowVariantSelection !== undefined
            ? input.allowVariantSelection
            : true,
          sortOrder: input.sortOrder || 0,
        },
        include: {
          product: {
            include: {
              variants: true,
            },
          },
          variant: true,
        },
      })
    },

    // 更新組合項目
    updateBundleItem: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      await requireAdmin(context)

      return prisma.bundleItem.update({
        where: { id },
        data: input,
        include: {
          product: {
            include: {
              variants: true,
            },
          },
          variant: true,
        },
      })
    },

    // 從組合中移除產品
    removeBundleItem: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      await requireAdmin(context)

      await prisma.bundleItem.delete({
        where: { id },
      })

      return true
    },
  },
}
