'use client'

/**
 * 訂單列表頁 - 顯示用戶所有訂單
 */

import { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GET_MY_ORDERS, DELETE_ORDER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import AccountHeader from '@/components/navigation/AccountHeader'

// 訂單狀態配置
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: '待確認', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  CONFIRMED: { label: '已確認', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  PROCESSING: { label: '處理中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  SHIPPED: { label: '已出貨', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: '已完成', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: '已取消', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

// 支付狀態配置
const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待付款', color: 'text-yellow-600' },
  PAID: { label: '已付款', color: 'text-green-600' },
  FAILED: { label: '付款失敗', color: 'text-red-600' },
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // 檢查認證狀態，未登入則跳轉
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      alert('請先登入')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, error, refetch } = useQuery(GET_MY_ORDERS, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [deleteOrder, { loading: deleting }] = useMutation(DELETE_ORDER, {
    onCompleted: () => {
      alert('訂單已刪除')
      refetch()
    },
    onError: (error) => {
      console.error('刪除訂單失敗:', error)
      alert(error.message || '刪除訂單失敗，請稍後再試')
    },
  })

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`確定要刪除訂單 ${orderNumber} 嗎？此操作無法復原。`)) {
      return
    }

    try {
      await deleteOrder({
        variables: {
          id: orderId,
        },
      })
    } catch (error) {
      console.error('刪除訂單失敗:', error)
    }
  }

  // 載入中狀態
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
          <p className="text-gray-600">正在獲取訂單資料
</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600 mb-2">載入失敗</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  const orders = data?.myOrders || []

  // 空訂單狀態
  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">尚無任何訂單</h1>
          <p className="text-gray-600 mb-8">開始選購您喜歡的商品吧！</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            開始選購
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <AccountHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的訂單</h1>
        <p className="text-gray-600 mt-2">共 {orders.length} 筆訂單</p>
      </div>

      {/* 訂單列表 */}
      <div className="space-y-4">
        {orders.map((order: any) => {
          const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
          const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING

          return (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* 訂單標頭 */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div>
                      <span className="text-sm text-gray-600">訂單編號: </span>
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                      >
                        {order.orderNumber}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`text-xs font-medium ${paymentConfig.color}`}>
                        {paymentConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 訂單內容 */}
              <div className="px-6 py-4">
                {/* 產品列表 */}
                <div className="space-y-3 mb-4">
                  {order.items.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.productImage || item.product?.images?.[0] ? (
                          <img
                            src={item.productImage || item.product.images[0]}
                            alt={item.productName || item.product?.name || '產品'}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            無圖片
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.productName || item.product?.name || '未知產品'}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {item.sizeEu && <span>尺碼: EU {item.sizeEu}</span>}
                          {item.color && <span className="ml-3">顏色: {item.color}</span>}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          數量: {item.quantity} × NT$ {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      還有 {order.items.length - 3} 件產品...
                    </p>
                  )}
                </div>

                {/* 訂單摘要與操作 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-200 gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-sm text-gray-600">配送地址: </span>
                      <span className="text-sm font-medium text-gray-900">
                        {order.shippingCity} {order.shippingDistrict}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">訂單總額</p>
                      <p className="text-xl font-bold text-primary-600">
                        NT$ {order.total.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/orders/${order.id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        查看詳情
                      </Link>

                      {order.status !== 'CANCELLED' &&
                        order.status !== 'COMPLETED' &&
                        order.status !== 'SHIPPED' &&
                        order.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            disabled={deleting}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            刪除訂單
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
    </>
  )
}
