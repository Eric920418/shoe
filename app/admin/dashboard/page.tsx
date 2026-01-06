/**
 * 後台儀表板 - 手機優先設計
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { GET_DASHBOARD_STATS, GET_RECENT_ORDERS, GET_ADMIN_UNREAD_MESSAGE_COUNT } from '@/graphql/queries'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function DashboardPage() {
  const [showFullStats, setShowFullStats] = useState(false)

  // 獲取統計數據
  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'network-only', // 每次都重新獲取最新數據
  })

  // 獲取近期訂單
  const { data: ordersData, loading: ordersLoading } = useQuery(GET_RECENT_ORDERS, {
    variables: { limit: 5 },
    fetchPolicy: 'network-only',
  })

  // 獲取管理員未讀訊息數
  const { data: unreadData } = useQuery(GET_ADMIN_UNREAD_MESSAGE_COUNT, {
    fetchPolicy: 'network-only',
    pollInterval: 30000, // 每 30 秒輪詢一次
  })

  const unreadCount = unreadData?.adminUnreadMessageCount || 0

  const stats = statsData?.dashboardStats || {
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    ordersToday: 0,
    revenueToday: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    revenueGrowth: 0,
    newUsersThisMonth: 0,
  }

  const recentOrders = ordersData?.recentOrders || []

  const quickActions = [
    { label: '新增產品', icon: '➕', href: '/admin/products/new', color: 'bg-blue-500', badge: 0 },
    { label: '處理訂單', icon: '📦', href: '/admin/orders', color: 'bg-green-500', badge: 0 },
    { label: '發送優惠', icon: '🎫', href: '/admin/coupons', color: 'bg-purple-500', badge: 0 },
    { label: '查看聊天', icon: '💬', href: '/admin/chats', color: 'bg-pink-500', badge: unreadCount },
  ]

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PAID: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
  }

  const statusLabels = {
    PENDING: '待處理',
    PAID: '已付款',
    SHIPPED: '已發貨',
    DELIVERED: '已送達',
  }

  // 載入狀態
  if (statsLoading || ordersLoading) {
    return (
      <div className="space-y-4 lg:space-y-6 -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 -mx-4 px-4 lg:mx-0 lg:px-0">
      {/* 頁面標題 - 手機版精簡 */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">儀表板</h1>
        <p className="text-sm lg:text-lg text-gray-600 mt-1">
          今日營收：<span className="font-semibold text-green-600">${stats.revenueToday.toLocaleString()}</span>
        </p>
      </div>

      {/* 快速操作按鈕 - 手機版專屬 */}
      <div className="lg:hidden">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">快速操作</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="relative flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className={`relative w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                <span className="text-lg">{action.icon}</span>
                {action.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                    {action.badge > 99 ? '99+' : action.badge}
                  </span>
                )}
              </div>
              <span className="text-xs text-center text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 關鍵指標 - 手機版摺疊式設計 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => setShowFullStats(!showFullStats)}
          className="lg:hidden w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <h2 className="text-base font-semibold text-gray-900">業務統計</h2>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${showFullStats ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 主要指標 - 始終顯示 */}
        <div className="grid grid-cols-2 gap-px bg-gray-200">
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600">今日訂單</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.ordersToday}</p>
                <p className="text-xs text-orange-600 mt-1">{stats.pendingOrders} 待處理</p>
              </div>
              <span className="text-2xl lg:hidden">📦</span>
            </div>
          </div>
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600">總營業額</p>
                <p className="text-xl lg:text-3xl font-bold text-gray-900 mt-1">
                  ${stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000).toFixed(1)}K` : stats.totalRevenue.toLocaleString()}
                </p>
                <p className={`text-xs mt-1 ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
                </p>
              </div>
              <span className="text-2xl lg:hidden">💰</span>
            </div>
          </div>
        </div>

        {/* 次要指標 - 手機版可摺疊 */}
        <div className={`grid grid-cols-2 gap-px bg-gray-200 ${showFullStats || 'lg:grid'} ${!showFullStats && 'hidden lg:grid'}`}>
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600">總產品數</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
                <p className="text-xs text-orange-600 mt-1">{stats.lowStockProducts} 低庫存</p>
              </div>
              <span className="text-2xl lg:hidden">👟</span>
            </div>
          </div>
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600">總用戶數</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                <p className="text-xs text-blue-600 mt-1">+{stats.newUsersThisMonth} 本月</p>
              </div>
              <span className="text-2xl lg:hidden">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* 最近訂單 - 手機版卡片式顯示 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base lg:text-xl font-semibold text-gray-900">最近訂單</h2>
            <Link href="/admin/orders" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
        </div>

        {/* 手機版 - 卡片列表 */}
        <div className="lg:hidden divide-y divide-gray-200">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>暫無訂單</p>
            </div>
          ) : (
            recentOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">{order.customer}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.createdAt), 'MM/dd HH:mm', { locale: zhTW })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-lg font-semibold text-gray-900">${order.total.toLocaleString()}</p>
                  <Link href={`/admin/orders/${order.id}`} className="text-sm text-primary-600 font-medium">
                    查看詳情
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 桌面版 - 表格 */}
        <div className="hidden lg:block">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>暫無訂單</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">訂單編號</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客戶</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.customer}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${order.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'MM/dd HH:mm', { locale: zhTW })}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 快速連結 - 桌面版顯示 */}
      <div className="hidden lg:grid grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`relative w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white`}>
                <span className="text-xl">{action.icon}</span>
                {action.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 animate-pulse">
                    {action.badge > 99 ? '99+' : action.badge}
                  </span>
                )}
              </div>
              <span className="font-medium text-gray-900">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}