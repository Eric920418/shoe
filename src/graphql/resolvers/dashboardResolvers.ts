/**
 * Dashboard Resolvers - 儀表板統計數據
 */

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { startOfDay, startOfMonth, subMonths } from 'date-fns'

export const dashboardResolvers = {
  Query: {
    /**
     * 儀表板統計數據（管理員專用）
     */
    dashboardStats: async (_: any, __: any, context: any) => {
      requireAdmin(context)

      const now = new Date()
      const today = startOfDay(now)
      const thisMonth = startOfMonth(now)
      const lastMonth = startOfMonth(subMonths(now, 1))

      // 並行查詢所有統計數據以提高效能
      const [
        totalOrders,
        totalRevenue,
        totalProducts,
        totalUsers,
        ordersToday,
        revenueToday,
        pendingOrders,
        lowStockProducts,
        revenueThisMonth,
        revenueLastMonth,
        newUsersThisMonth,
      ] = await Promise.all([
        // 總訂單數
        prisma.order.count(),

        // 總營收（只計算已付款的訂單）
        prisma.order.aggregate({
          where: {
            paymentStatus: {
              in: ['PAID', 'BANK_TRANSFER_VERIFIED'],
            },
          },
          _sum: {
            total: true,
          },
        }),

        // 總產品數（活躍產品）
        prisma.product.count({
          where: {
            isActive: true,
          },
        }),

        // 總用戶數
        prisma.user.count(),

        // 今日訂單數
        prisma.order.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),

        // 今日營收
        prisma.order.aggregate({
          where: {
            paymentStatus: {
              in: ['PAID', 'BANK_TRANSFER_VERIFIED'],
            },
            createdAt: {
              gte: today,
            },
          },
          _sum: {
            total: true,
          },
        }),

        // 待處理訂單數（PENDING 狀態）
        prisma.order.count({
          where: {
            status: 'PENDING',
          },
        }),

        // 低庫存產品數（庫存 <= 10）
        prisma.product.count({
          where: {
            isActive: true,
            OR: [
              {
                // 檢查產品總庫存
                stock: {
                  lte: 10,
                },
              },
            ],
          },
        }),

        // 本月營收
        prisma.order.aggregate({
          where: {
            paymentStatus: {
              in: ['PAID', 'BANK_TRANSFER_VERIFIED'],
            },
            createdAt: {
              gte: thisMonth,
            },
          },
          _sum: {
            total: true,
          },
        }),

        // 上月營收
        prisma.order.aggregate({
          where: {
            paymentStatus: {
              in: ['PAID', 'BANK_TRANSFER_VERIFIED'],
            },
            createdAt: {
              gte: lastMonth,
              lt: thisMonth,
            },
          },
          _sum: {
            total: true,
          },
        }),

        // 本月新用戶數
        prisma.user.count({
          where: {
            createdAt: {
              gte: thisMonth,
            },
          },
        }),
      ])

      // 計算營收增長率
      const thisMonthRevenue = revenueThisMonth._sum.total || 0
      const lastMonthRevenue = revenueLastMonth._sum.total || 0
      let revenueGrowth = 0

      if (lastMonthRevenue > 0) {
        revenueGrowth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      }

      return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalProducts,
        totalUsers,
        ordersToday,
        revenueToday: revenueToday._sum.total || 0,
        pendingOrders,
        lowStockProducts,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10, // 保留一位小數
        newUsersThisMonth,
      }
    },

    /**
     * 近期訂單列表（管理員專用）
     */
    recentOrders: async (_: any, args: { limit?: number }, context: any) => {
      requireAdmin(context)

      const limit = args.limit || 5

      const orders = await prisma.order.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      })

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user?.name || order.guestName || '訪客',
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
      }))
    },
  },
}
