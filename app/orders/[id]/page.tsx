'use client'

/**
 * 訂單詳情頁
 */

import { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_ORDER, CANCEL_ORDER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

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

// 支付方式配置
const PAYMENT_METHOD_CONFIG: Record<string, string> = {
  BANK_TRANSFER: '銀行轉帳',
  LINE_PAY: 'LINE Pay',
  CASH_ON_DELIVERY: '貨到付款',
  CREDIT_CARD: '信用卡',
  NEWEBPAY: '藍新金流',
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // 檢查認證狀態
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      alert('請先登入')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const { data, loading, error, refetch } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    skip: !isAuthenticated || !orderId,
    fetchPolicy: 'network-only',
  })

  const [cancelOrder, { loading: cancelling }] = useMutation(CANCEL_ORDER, {
    onCompleted: () => {
      alert('訂單已取消')
      refetch()
    },
    onError: (error) => {
      console.error('取消訂單失敗:', error)
      alert(error.message || '取消訂單失敗，請稍後再試')
    },
  })

  const handleCancelOrder = async () => {
    if (!order) return

    if (!confirm(`確定要取消訂單 ${order.orderNumber} 嗎？`)) {
      return
    }

    try {
      await cancelOrder({
        variables: {
          id: order.id,
        },
      })
    } catch (error) {
      console.error('取消訂單失敗:', error)
    }
  }

  // 處理重新付款
  const handleRetryPayment = async () => {
    if (!order) return

    try {
      // 呼叫藍新金流 API 重新創建支付
      const response = await fetch('/api/newebpay/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentTypes: ['CREDIT_CARD', 'VACC', 'CVS', 'BARCODE', 'WEBATM'],
          itemDesc: `訂單 ${order.orderNumber}`,
        }),
      })

      const paymentData = await response.json()

      if (paymentData.success) {
        // 動態建立表單並提交到藍新金流
        const { mpgUrl, formData } = paymentData.data

        const form = document.createElement('form')
        form.method = 'POST'
        form.action = mpgUrl
        form.style.display = 'none'

        Object.entries(formData).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value as string
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      } else {
        throw new Error(paymentData.error || '創建支付失敗')
      }
    } catch (error) {
      console.error('重新付款失敗:', error)
      alert('重新付款失敗，請稍後再試')
    }
  }

  // 載入中狀態
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
          <p className="text-gray-600">正在獲取訂單資料</p>
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
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              重新載入
            </button>
            <Link
              href="/orders"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              返回列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const order = data?.order

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">找不到訂單</div>
          <Link
            href="/orders"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            返回列表
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING
  const paymentMethodLabel = PAYMENT_METHOD_CONFIG[order.paymentMethod] || order.paymentMethod

  // 判斷是否可以重新付款
  const canRetryPayment =
    order.paymentMethod === 'NEWEBPAY' &&
    order.paymentStatus === 'PENDING' &&
    order.status !== 'CANCELLED' &&
    order.status !== 'COMPLETED'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 標題列 */}
      <div className="mb-8">
        <Link href="/orders" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← 返回訂單列表
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">訂單詳情</h1>
            <p className="text-gray-600 mt-2">訂單編號: {order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`text-sm font-medium ${paymentConfig.color}`}>
              {paymentConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側內容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 商品列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">訂購商品</h2>

            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                  <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.productImage || item.product?.images?.[0] ? (
                      <Image
                        src={item.productImage || item.product.images[0]}
                        alt={item.productName || item.product?.name || '商品'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        無圖片
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {item.productName || item.product?.name || '未知商品'}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {item.sizeEu && (
                        <div>尺碼: EU {item.sizeEu}</div>
                      )}
                      {item.color && (
                        <div>顏色: {item.color}</div>
                      )}
                      {item.sku && (
                        <div className="text-xs">SKU: {item.sku}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">數量: {item.quantity}</p>
                    <p className="text-sm font-medium text-gray-900">
                      NT$ {item.price.toLocaleString()}
                    </p>
                    <p className="text-base font-bold text-gray-900 mt-2">
                      NT$ {item.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 收件資訊 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">收件資訊</h2>

            <div className="space-y-3">
              <div className="flex">
                <span className="w-24 text-gray-600">收件人:</span>
                <span className="font-medium text-gray-900">{order.shippingName}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-gray-600">聯絡電話:</span>
                <span className="font-medium text-gray-900">{order.shippingPhone}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-gray-600">收件地址:</span>
                <span className="font-medium text-gray-900">
                  {order.shippingCountry} {order.shippingCity} {order.shippingDistrict}{' '}
                  {order.shippingStreet}
                  {order.shippingZipCode && ` (${order.shippingZipCode})`}
                </span>
              </div>
              {order.notes && (
                <div className="flex">
                  <span className="w-24 text-gray-600">訂單備註:</span>
                  <span className="text-gray-900">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側摘要 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4 space-y-6">
            {/* 金額摘要 */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">金額摘要</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>商品小計</span>
                  <span>NT$ {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>運費</span>
                  <span>
                    {order.shippingFee === 0 ? (
                      <span className="text-green-600">免運費</span>
                    ) : (
                      `NT$ ${order.shippingFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>折扣</span>
                    <span>-NT$ {order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">訂單總計</span>
                    <span className="text-2xl font-bold text-primary-600">
                      NT$ {order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 支付資訊 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">支付資訊</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">支付方式</span>
                  <span className="font-medium text-gray-900">{paymentMethodLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">支付狀態</span>
                  <span className={`font-medium ${paymentConfig.color}`}>
                    {paymentConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 訂單時間 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">訂單時間</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">建立時間</span>
                  <span className="text-gray-900">
                    {new Date(order.createdAt).toLocaleString('zh-TW')}
                  </span>
                </div>
              </div>
            </div>

            {/* 重新付款按鈕 */}
            {canRetryPayment && (
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleRetryPayment}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  前往付款
                </button>
              </div>
            )}

            {/* 取消訂單按鈕 */}
            {order.status !== 'CANCELLED' &&
              order.status !== 'COMPLETED' &&
              order.status !== 'SHIPPED' && (
                <div className={canRetryPayment ? '' : 'pt-6 border-t border-gray-200'}>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                  >
                    {cancelling ? '處理中...' : '取消訂單'}
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
