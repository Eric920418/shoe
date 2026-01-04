'use client'

/**
 * 管理員訂單詳情頁
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_ORDER, UPDATE_ORDER_STATUS } from '@/graphql/queries'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// 訂單狀態配置
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: '待確認', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  CONFIRMED: { label: '已確認', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  PROCESSING: { label: '處理中', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  SHIPPED: { label: '已出貨', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: '已完成', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: '已取消', color: 'text-red-700', bgColor: 'bg-red-100' },
  REFUNDED: { label: '已退款', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

// 支付狀態配置
const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待付款', color: 'text-yellow-600' },
  PAID: { label: '已付款', color: 'text-green-600' },
  FAILED: { label: '付款失敗', color: 'text-red-600' },
  REFUNDED: { label: '已退款', color: 'text-gray-600' },
  BANK_TRANSFER_PENDING: { label: '等待轉帳', color: 'text-yellow-600' },
  BANK_TRANSFER_VERIFIED: { label: '轉帳已確認', color: 'text-green-600' },
}

// 支付方式配置
const PAYMENT_METHOD_CONFIG: Record<string, string> = {
  BANK_TRANSFER: '銀行轉帳',
  LINE_PAY: 'LINE Pay',
  CASH_ON_DELIVERY: '貨到付款',
  CREDIT_CARD: '信用卡',
  NEWEBPAY: '藍新金流',
}

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string
  const [isPrinting, setIsPrinting] = useState(false)
  const [logisticsInfo, setLogisticsInfo] = useState<any>(null)
  const [isQueryingLogistics, setIsQueryingLogistics] = useState(false)

  const { data, loading, error, refetch } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    skip: !orderId,
    fetchPolicy: 'network-only',
  })

  const [updateOrderStatus, { loading: updating }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: () => {
      toast.success('訂單狀態已更新')
      refetch()
    },
    onError: (error) => {
      console.error('更新訂單狀態失敗:', error)
      toast.error(error.message || '更新訂單狀態失敗，請稍後再試')
    },
  })

  // 自動查詢物流資訊
  useEffect(() => {
    if (!orderId || !data?.order) return

    const fetchLogistics = async () => {
      setIsQueryingLogistics(true)
      try {
        const response = await fetch('/api/admin/logistics/query-shipment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
          }),
        })

        const result = await response.json()

        if (response.ok && result.data) {
          console.log('物流查詢結果:', result)
          setLogisticsInfo(result.data)
        }
      } catch (error: any) {
        console.error('查詢物流資訊失敗:', error)
      } finally {
        setIsQueryingLogistics(false)
      }
    }

    fetchLogistics()
  }, [orderId, data?.order])

  // 列印寄貨單
  const handlePrintLabel = async () => {
    if (!order) return

    if (!confirm('確定要列印此訂單的寄貨單嗎？')) {
      return
    }

    setIsPrinting(true)
    try {
      const response = await fetch('/api/admin/logistics/print-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: [order.id],
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '列印失敗')
      }

      // 檢查是否有列印網址，如果有就開啟新視窗
      const printUrl = result.printUrl || result.data?.PrintUrl
      console.log('printUrl from API:', printUrl)
      console.log('Full API response:', result)

      if (printUrl) {
        // 開啟藍新的物流標籤列印頁面
        window.open(printUrl, '_blank', 'width=800,height=600')
        toast.success('已開啟物流標籤列印頁面')
      } else {
        toast.success('列印標籤請求已送出')
      }

      refetch()
    } catch (error: any) {
      console.error('列印寄貨單失敗:', error)
      toast.error(error.message || '列印寄貨單失敗，請稍後再試')
    } finally {
      setIsPrinting(false)
    }
  }

  // 根據當前狀態決定下一個狀態和按鈕文字
  const getNextAction = (currentStatus: string, paymentStatus: string) => {
    // 待付款不顯示按鈕
    if (paymentStatus === 'PENDING') {
      return null
    }

    switch (currentStatus) {
      case 'PENDING':
        return { nextStatus: 'CONFIRMED', buttonText: '確認訂單', buttonColor: 'bg-blue-600 hover:bg-blue-700' }
      case 'CONFIRMED':
      case 'PROCESSING':
        return { nextStatus: 'SHIPPED', buttonText: '確認出貨', buttonColor: 'bg-purple-600 hover:bg-purple-700' }
      // SHIPPED 是最終狀態，不需要按鈕
      default:
        return null
    }
  }

  const handleUpdateStatus = async (nextStatus: string, actionText: string) => {
    if (!order) return

    if (!confirm(`確定要${actionText}嗎？`)) {
      return
    }

    try {
      await updateOrderStatus({
        variables: {
          id: order.id,
          status: nextStatus,
        },
      })
    } catch (error) {
      console.error('更新訂單狀態失敗:', error)
    }
  }

  // 載入中狀態
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">載入訂單數據中...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">載入訂單失敗</p>
          <p className="mt-2 text-gray-600">{error.message}</p>
          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              重新載入
            </button>
            <Link
              href="/admin/orders"
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-900 text-lg font-semibold">找不到訂單</p>
          <Link
            href="/admin/orders"
            className="mt-4 inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
  const nextAction = getNextAction(order.status, order.paymentStatus)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 標題列 */}
      <div>
        <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 mb-3 sm:mb-4 inline-block text-sm sm:text-base">
          ← 返回訂單列表
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">訂單詳情</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-base break-all">
              訂單編號: {order.orderNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${paymentConfig.color}`}>
              {paymentConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 左側內容 */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* 客戶資訊 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">客戶資訊</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">客戶姓名</p>
                <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                  {order.user?.name || order.guestName || '訪客'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">聯絡電話</p>
                <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                  {order.user?.phone || order.guestPhone || '-'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-600">電子郵件</p>
                <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base break-all">
                  {order.user?.email || order.guestEmail || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">客戶類型</p>
                <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                  {order.user ? '會員' : '訪客'}
                </p>
              </div>
            </div>
          </div>

          {/* 商品列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">訂購商品</h2>

            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                  <div className="flex gap-3 sm:gap-4">
                    {/* 商品圖片 */}
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.productImage || item.product?.images?.[0] ? (
                        <Image
                          src={item.productImage || item.product.images[0]}
                          alt={item.productName || item.product?.name || '商品'}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          無圖片
                        </div>
                      )}
                    </div>
                    {/* 商品資訊 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2">
                        {item.productName || item.product?.name || '未知商品'}
                      </h3>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
                        {item.sizeEu && <div>尺碼: {item.sizeEu}</div>}
                        {item.color && <div>顏色: {item.color}</div>}
                      </div>
                    </div>
                  </div>
                  {/* 數量與價格 - 手機版放下方 */}
                  <div className="flex justify-between items-center mt-2 sm:mt-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-600">數量: {item.quantity}</p>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-gray-500">
                        NT$ {item.price.toLocaleString()} × {item.quantity}
                      </p>
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        NT$ {item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 收件資訊 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">收件資訊</h2>
              {isQueryingLogistics && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>載入中...</span>
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">收件人:</span>
                <span className="font-medium text-gray-900">{order.shippingName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">聯絡電話:</span>
                <span className="font-medium text-gray-900">{order.shippingPhone}</span>
              </div>

              {/* 物流資訊（從藍新查詢） */}
              {logisticsInfo ? (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <p className="text-sm text-gray-500 mb-3">📦 超商取貨資訊</p>
                  </div>
                  {logisticsInfo.ReceiverStoreName && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">取貨店鋪:</span>
                      <span className="font-medium text-gray-900">{logisticsInfo.ReceiverStoreName}</span>
                    </div>
                  )}
                  {logisticsInfo.ReceiverStoreID && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">店鋪代號:</span>
                      <span className="font-medium text-gray-900">{logisticsInfo.ReceiverStoreID}</span>
                    </div>
                  )}
                  {logisticsInfo.ReceiverAddress && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">店鋪地址:</span>
                      <span className="font-medium text-gray-900 break-all">{logisticsInfo.ReceiverAddress}</span>
                    </div>
                  )}
                  {logisticsInfo.CVSPaymentNo && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">寄貨編號:</span>
                      <span className="font-medium text-gray-900 font-mono text-xs sm:text-sm">{logisticsInfo.CVSPaymentNo}</span>
                    </div>
                  )}
                  {logisticsInfo.CVSValidationNo && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">驗證碼:</span>
                      <span className="font-medium text-gray-900 font-mono text-xs sm:text-sm">{logisticsInfo.CVSValidationNo}</span>
                    </div>
                  )}
                  {logisticsInfo.Status && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">物流狀態:</span>
                      <span className="font-medium text-gray-900">{logisticsInfo.Status}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-sm text-gray-500">
                    ℹ️ 客戶尚未選擇超商取貨地址，或物流資訊尚未建立
                  </p>
                </div>
              )}

              {order.notes && (
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="text-gray-600 text-xs sm:text-sm sm:w-24 sm:flex-shrink-0">訂單備註:</span>
                  <span className="text-gray-900 break-all">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側摘要 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-4 space-y-4 sm:space-y-6">
            {/* 金額摘要 */}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">金額摘要</h2>

              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
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
                    <span className="text-base sm:text-lg font-bold text-gray-900">訂單總計</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-600">
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

                {/* 藍新金流支付詳情 */}
                {order.payment && (
                  <>
                    {order.payment.tradeNo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">交易編號</span>
                        <span className="font-mono text-xs text-gray-900">{order.payment.tradeNo}</span>
                      </div>
                    )}

                    {/* 支付錯誤訊息 */}
                    {order.payment.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">支付錯誤</p>
                        <p className="text-xs text-red-600">{order.payment.errorMessage}</p>
                        {order.payment.errorCode && (
                          <p className="text-xs text-red-500 mt-1">錯誤代碼: {order.payment.errorCode}</p>
                        )}
                      </div>
                    )}

                    {/* ATM 轉帳資訊 */}
                    {order.payment.atmVirtualAccount && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">ATM 轉帳資訊</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">銀行代碼</span>
                            <span className="font-mono text-gray-900">{order.payment.atmBankCode}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">虛擬帳號</span>
                            <span className="font-mono text-gray-900">{order.payment.atmVirtualAccount}</span>
                          </div>
                          {order.payment.atmExpireDate && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">繳費期限</span>
                              <span className="text-gray-900">
                                {format(new Date(order.payment.atmExpireDate), 'yyyy-MM-dd HH:mm')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 超商代碼資訊 */}
                    {order.payment.cvsPaymentNo && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2">超商繳費資訊</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">超商代碼</span>
                            <span className="font-mono text-gray-900">{order.payment.cvsBankCode}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">繳費代碼</span>
                            <span className="font-mono text-gray-900">{order.payment.cvsPaymentNo}</span>
                          </div>
                          {order.payment.cvsExpireDate && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">繳費期限</span>
                              <span className="text-gray-900">
                                {format(new Date(order.payment.cvsExpireDate), 'yyyy-MM-dd HH:mm')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 信用卡資訊 */}
                    {order.payment.card4No && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm font-medium text-purple-800 mb-2">信用卡資訊</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">卡號後4碼</span>
                            <span className="font-mono text-gray-900">****{order.payment.card4No}</span>
                          </div>
                          {order.payment.authBank && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">授權銀行</span>
                              <span className="text-gray-900">{order.payment.authBank}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 訂單時間 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">訂單時間</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">建立時間</span>
                  <span className="text-gray-900">
                    {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">付款時間</span>
                    <span className="text-gray-900">
                      {format(new Date(order.paidAt), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">出貨時間</span>
                    <span className="text-gray-900">
                      {format(new Date(order.shippedAt), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">送達時間</span>
                    <span className="text-gray-900">
                      {format(new Date(order.deliveredAt), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="pt-6 border-t border-gray-200 space-y-3">
              {/* 列印寄貨單按鈕 - 只有 7-11 取貨才顯示 */}
              {order.paymentStatus === 'PAID' && order.shippingMethod === 'SEVEN_ELEVEN' && (
                <button
                  onClick={handlePrintLabel}
                  disabled={isPrinting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPrinting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>列印中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>列印寄貨單（7-11）</span>
                    </>
                  )}
                </button>
              )}

              {/* 狀態更新按鈕 */}
              {nextAction && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(nextAction.nextStatus, nextAction.buttonText)}
                    disabled={updating}
                    className={`w-full py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50 ${nextAction.buttonColor}`}
                  >
                    {updating ? '處理中...' : nextAction.buttonText}
                  </button>
                  {order.paymentStatus === 'PENDING' && (
                    <p className="text-xs text-gray-500 text-center">
                      等待客戶付款後才能操作訂單
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
