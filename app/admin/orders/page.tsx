'use client'

/**
 * 後台訂單管理頁面
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

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待處理', color: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: '已付款', color: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: '已發貨', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: '已送達', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: '已退款', color: 'bg-gray-100 text-gray-700' },
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

  // 更新訂單狀態
  const handleUpdateStatus = (orderId: string, orderNumber: string) => {
    // TODO: 實現狀態更新對話框
    alert(`更新訂單 ${orderNumber} 的狀態`)
  }

  // 查看訂單詳情
  const handleViewDetails = (orderId: string) => {
    // TODO: 實現訂單詳情頁面或彈窗
    alert(`查看訂單詳情: ${orderId}`)
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
          <p className="text-gray-600 mt-1">管理所有訂單和配送狀態</p>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">全部訂單</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {mockOrders.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">待處理</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {mockOrders.filter((o) => o.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">已付款</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {mockOrders.filter((o) => o.status === 'PAID').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">已發貨</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {mockOrders.filter((o) => o.status === 'SHIPPED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">已完成</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {mockOrders.filter((o) => o.status === 'DELIVERED').length}
          </p>
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 搜尋框 */}
          <div>
            <input
              type="text"
              placeholder="搜尋訂單號、客戶名稱或郵箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 狀態篩選 */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部狀態</option>
              <option value="PENDING">待處理</option>
              <option value="PAID">已付款</option>
              <option value="SHIPPED">已發貨</option>
              <option value="DELIVERED">已送達</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-900 font-medium">
            已選擇 {selectedOrders.length} 個訂單
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              批量導出
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              取消選擇
            </button>
          </div>
        </div>
      )}

      {/* 訂單表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrders.length === filteredOrders.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  訂單號
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  客戶
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  商品數
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  付款狀態
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  訂單狀態
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  建立時間
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {searchQuery || filterStatus !== 'all'
                      ? '沒有符合條件的訂單'
                      : '暫無訂單數據'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.customer.name}</p>
                        <p className="text-sm text-gray-500">{order.customer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {order.items} 件
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">
                        NT$ {order.total.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-sm font-medium ${
                          paymentStatusLabels[order.paymentStatus].color
                        }`}
                      >
                        {paymentStatusLabels[order.paymentStatus].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          statusLabels[order.status].color
                        }`}
                      >
                        {statusLabels[order.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {order.createdAt}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          查看
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(order.id, order.orderNumber)
                          }
                          className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          更新
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {filteredOrders.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              顯示 {filteredOrders.length} 個訂單中的 1-{filteredOrders.length}
            </div>
            <div className="flex gap-2">
              <button
                disabled
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-400 cursor-not-allowed"
              >
                上一頁
              </button>
              <button className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm">
                1
              </button>
              <button
                disabled
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-400 cursor-not-allowed"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
