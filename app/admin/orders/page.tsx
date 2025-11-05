'use client'

/**
 * 後台訂單管理頁面 - 手機優先設計
 */

import { useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  items: number
  total: number
  status: string
  paymentStatus: string
  shippingStatus: string
  createdAt: string
}

// TODO: 從GraphQL API獲取訂單數據
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-20251020-001',
    customer: {
      name: '王小明',
      email: 'wang@example.com',
    },
    items: 2,
    total: 8900,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    shippingStatus: 'NOT_SHIPPED',
    createdAt: '2025-10-20 14:30',
  },
  {
    id: '2',
    orderNumber: 'ORD-20251020-002',
    customer: {
      name: '李大華',
      email: 'li@example.com',
    },
    items: 1,
    total: 4500,
    status: 'PAID',
    paymentStatus: 'PAID',
    shippingStatus: 'PREPARING',
    createdAt: '2025-10-20 13:15',
  },
  {
    id: '3',
    orderNumber: 'ORD-20251019-045',
    customer: {
      name: '張三',
      email: 'zhang@example.com',
    },
    items: 3,
    total: 12000,
    status: 'SHIPPED',
    paymentStatus: 'PAID',
    shippingStatus: 'SHIPPED',
    createdAt: '2025-10-19 16:20',
  },
  {
    id: '4',
    orderNumber: 'ORD-20251019-032',
    customer: {
      name: '陳小姐',
      email: 'chen@example.com',
    },
    items: 1,
    total: 3200,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    shippingStatus: 'DELIVERED',
    createdAt: '2025-10-18 10:45',
  },
  {
    id: '5',
    orderNumber: 'ORD-20251018-023',
    customer: {
      name: '林先生',
      email: 'lin@example.com',
    },
    items: 2,
    total: 5600,
    status: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    shippingStatus: 'CANCELLED',
    createdAt: '2025-10-18 09:30',
  },
]

const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: '待處理', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  PAID: { label: '已付款', color: 'bg-blue-100 text-blue-700', icon: '💳' },
  SHIPPED: { label: '已發貨', color: 'bg-purple-100 text-purple-700', icon: '🚚' },
  DELIVERED: { label: '已送達', color: 'bg-green-100 text-green-700', icon: '✅' },
  CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-700', icon: '❌' },
  REFUNDED: { label: '已退款', color: 'bg-gray-100 text-gray-700', icon: '💸' },
}

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待付款', color: 'text-yellow-600' },
  PAID: { label: '已付款', color: 'text-green-600' },
  FAILED: { label: '付款失敗', color: 'text-red-600' },
  REFUNDED: { label: '已退款', color: 'text-gray-600' },
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // 篩選訂單
  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // 切換訂單選擇
  const toggleOrderSelection = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]
    )
  }

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id))
    }
  }

  // 批量操作
  const handleBatchAction = (action: string) => {
    if (selectedOrders.length === 0) {
      alert('請先選擇訂單')
      return
    }
    alert(`對 ${selectedOrders.length} 個訂單執行: ${action}`)
  }

  return (
    <div className="space-y-4 lg:space-y-6 -mx-4 px-4 lg:mx-0 lg:px-0">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">訂單管理</h1>
        <p className="text-sm lg:text-base text-gray-600 mt-1">
          共 <span className="font-semibold">{filteredOrders.length}</span> 筆訂單
        </p>
      </div>

      {/* 手機版 - 統計摘要 */}
      <div className="lg:hidden grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-2xl font-bold text-yellow-600">8</p>
          <p className="text-xs text-gray-600 mt-1">待處理</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-2xl font-bold text-blue-600">12</p>
          <p className="text-xs text-gray-600 mt-1">處理中</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
          <p className="text-2xl font-bold text-green-600">35</p>
          <p className="text-xs text-gray-600 mt-1">已完成</p>
        </div>
      </div>

      {/* 搜尋和篩選區 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* 搜尋框 */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜尋訂單編號、客戶名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {/* 手機版篩選按鈕 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2"
          >
            <span>篩選</span>
            {filterStatus !== 'all' && (
              <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">1</span>
            )}
          </button>
        </div>

        {/* 篩選選項 - 手機版可摺疊 */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-3`}>
          {/* 狀態篩選 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {Object.entries(statusLabels).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  filterStatus === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{value.icon}</span>
                <span>{value.label}</span>
              </button>
            ))}
          </div>

          {/* 批量操作 - 桌面版顯示 */}
          <div className="hidden lg:flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-600">
                {selectedOrders.length > 0
                  ? `已選擇 ${selectedOrders.length} 個訂單`
                  : '全選'}
              </span>
            </div>
            {selectedOrders.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBatchAction('export')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  匯出
                </button>
                <button
                  onClick={() => handleBatchAction('print')}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  列印
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 訂單列表 - 手機版卡片式 */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* 訂單標題區 */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">{order.createdAt}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusLabels[order.status].color}`}>
                  {statusLabels[order.status].icon} {statusLabels[order.status].label}
                </span>
              </div>
            </div>

            {/* 訂單詳情 */}
            <div className="p-4 space-y-3">
              {/* 客戶資訊 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                  <p className="text-xs text-gray-500">{order.customer.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">${order.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{order.items} 件商品</p>
                </div>
              </div>

              {/* 狀態指示器 */}
              <div className="flex gap-2 text-xs">
                <span className={`${paymentStatusLabels[order.paymentStatus].color}`}>
                  {paymentStatusLabels[order.paymentStatus].label}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {order.shippingStatus === 'NOT_SHIPPED' ? '未發貨' :
                   order.shippingStatus === 'PREPARING' ? '準備中' :
                   order.shippingStatus === 'SHIPPED' ? '已發貨' :
                   order.shippingStatus === 'DELIVERED' ? '已送達' : '已取消'}
                </span>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">
                  查看詳情
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                  更新狀態
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                  ⋮
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 桌面版表格 */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">訂單編號</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客戶</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品數</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">付款狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">訂單狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">建立時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.items} 件</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${order.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${paymentStatusLabels[order.paymentStatus].color}`}>
                      {paymentStatusLabels[order.paymentStatus].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusLabels[order.status].color}`}>
                      {statusLabels[order.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        查看
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 text-sm">
                        編輯
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分頁控制 */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            顯示第 1 到 {filteredOrders.length} 筆，共 {filteredOrders.length} 筆
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              上一頁
            </button>
            <button className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              下一頁
            </button>
          </div>
        </div>
      </div>

      {/* 手機版載入更多 */}
      <div className="lg:hidden flex justify-center py-4">
        <button className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
          載入更多訂單
        </button>
      </div>

      {/* 手機版浮動操作按鈕 */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <button className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-2xl">➕</span>
        </button>
      </div>
    </div>
  )
}