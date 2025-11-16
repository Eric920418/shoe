'use client'

/**
 * 訂單追蹤頁面 - 訪客和會員都可以使用
 */

import { useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { TRACK_ORDER } from '@/graphql/queries'
import Link from 'next/link'
import Image from 'next/image'
import MembershipBenefitsBanner from '@/components/common/MembershipBenefitsBanner'
import { useAuth } from '@/contexts/AuthContext'
import AccountHeader from '@/components/navigation/AccountHeader'

// 訂單狀態中文對應
const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待處理', color: 'text-yellow-600 bg-yellow-50' },
  CONFIRMED: { label: '已確認', color: 'text-blue-600 bg-blue-50' },
  PROCESSING: { label: '處理中', color: 'text-indigo-600 bg-indigo-50' },
  SHIPPED: { label: '已出貨', color: 'text-purple-600 bg-purple-50' },
  DELIVERED: { label: '已送達', color: 'text-green-600 bg-green-50' },
  COMPLETED: { label: '已完成', color: 'text-green-700 bg-green-100' },
  CANCELLED: { label: '已取消', color: 'text-red-600 bg-red-50' },
  REFUNDED: { label: '已退款', color: 'text-gray-600 bg-gray-50' },
}

const PAYMENT_STATUS_MAP: Record<string, string> = {
  PENDING: '待付款',
  PAID: '已付款',
  FAILED: '付款失敗',
  REFUNDED: '已退款',
  BANK_TRANSFER_PENDING: '待確認匯款',
  BANK_TRANSFER_VERIFIED: '已確認匯款',
}

export default function TrackOrderPage() {
  const { isAuthenticated } = useAuth()
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [trackOrder, { data, loading, error }] = useLazyQuery(TRACK_ORDER, {
    fetchPolicy: 'network-only',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 驗證
    const newErrors: Record<string, string> = {}

    if (!orderNumber.trim()) {
      newErrors.orderNumber = '請輸入訂單編號'
    }

    if (!phone.trim()) {
      newErrors.phone = '請輸入手機號碼'
    } else if (!/^09\d{8}$/.test(phone.trim())) {
      newErrors.phone = '請輸入有效的台灣手機號碼（例：0912345678）'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      trackOrder({
        variables: {
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        },
      })
    }
  }

  const order = data?.trackOrder

  return (
    <>
      <AccountHeader />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">訂單查詢</h1>
          <p className="text-gray-600">
            輸入訂單編號和手機號碼即可查詢訂單狀態
          </p>
        </div>

        {/* 查詢表單 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                訂單編號 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className={`w-full px-4 py-3 border-2 ${
                  errors.orderNumber ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                placeholder="例：ORD1234567890ABC"
              />
              {errors.orderNumber && (
                <p className="mt-2 text-sm text-red-600">{errors.orderNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                手機號碼 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-4 py-3 border-2 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                placeholder="0912345678"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                請輸入下單時填寫的手機號碼（訪客訂單）或收件手機號碼（會員訂單）
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '查詢中...' : '查詢訂單'}
            </button>
          </form>

          {/* 錯誤提示 */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error.message}</p>
            </div>
          )}
        </div>

        {/* 訪客提示：引導註冊 */}
        {!isAuthenticated && !order && (
          <MembershipBenefitsBanner variant="compact" />
        )}

        {/* 訂單結果 */}
        {order && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* 訂單標頭 */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  訂單編號：{order.orderNumber}
                </h2>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    ORDER_STATUS_MAP[order.status]?.color || 'text-gray-600 bg-gray-100'
                  }`}
                >
                  {ORDER_STATUS_MAP[order.status]?.label || order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">下單時間</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">付款狀態</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {PAYMENT_STATUS_MAP[order.paymentStatus] || order.paymentStatus}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">付款方式</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {order.paymentMethod === 'BANK_TRANSFER'
                      ? '銀行轉帳'
                      : order.paymentMethod === 'LINE_PAY'
                      ? 'LINE Pay'
                      : order.paymentMethod === 'CASH_ON_DELIVERY'
                      ? '貨到付款'
                      : order.paymentMethod}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">訂單金額</span>
                  <p className="font-bold text-xl text-gray-900 mt-1">
                    NT$ {order.total.toLocaleString()}
                  </p>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">物流追蹤號碼：</span>
                    {order.trackingNumber}
                  </p>
                </div>
              )}
            </div>

            {/* 訂單明細 */}
            <div className="px-8 py-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">訂單明細</h3>
              <div className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden rounded-lg">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          無圖
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-gray-600 mt-1">顏色：{item.variantName}</p>
                      )}
                      {item.sizeEu && (
                        <p className="text-sm text-gray-600">尺碼：EU {item.sizeEu}</p>
                      )}
                      <p className="text-sm text-gray-600">數量：{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        NT$ {item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 價格摘要 */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">小計</span>
                  <span className="text-gray-900">NT$ {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">運費</span>
                  <span className="text-gray-900">
                    {order.shippingFee > 0
                      ? `NT$ ${order.shippingFee.toLocaleString()}`
                      : '免運費'}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">折扣</span>
                    <span className="text-green-600">-NT$ {order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-4 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-900">總計</span>
                  <span className="text-2xl font-bold text-gray-900">
                    NT$ {order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 配送資訊 */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">配送資訊</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="text-gray-500">收件人：</span>
                  {order.shippingName}
                </p>
                <p>
                  <span className="text-gray-500">手機：</span>
                  {order.shippingPhone}
                </p>
                <p>
                  <span className="text-gray-500">地址：</span>
                  {order.shippingCity}
                  {order.shippingDistrict}
                  {order.shippingStreet}
                  {order.shippingZipCode && ` (${order.shippingZipCode})`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 返回按鈕 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
