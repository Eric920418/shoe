'use client'

/**
 * 訂單成功頁面
 */

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery, gql } from '@apollo/client'

// GraphQL 查詢 - 獲取訂單詳情
const GET_ORDER_BY_NUMBER = gql`
  query GetOrderByNumber($orderNumber: String!) {
    order(orderNumber: $orderNumber) {
      id
      orderNumber
      status
      paymentStatus
      paymentMethod
      total
      subtotal
      shippingFee
      discount
      creditUsed
      createdAt
      shippingName
      shippingPhone
      shippingCity
      shippingDistrict
      shippingStreet
      shippingZipCode
      guestEmail
      payment {
        id
        status
        paymentType
        paymentTypeName
        atmBankCode
        atmVirtualAccount
        atmExpireDate
        cvsPaymentNo
        cvsExpireDate
      }
      items {
        id
        quantity
        price
        subtotal
        productName
        productImage
        sizeEu
        color
        product {
          slug
        }
      }
    }
  }
`

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber') || ''

  // 從 GraphQL API 獲取訂單詳情
  const { data, loading, error } = useQuery(GET_ORDER_BY_NUMBER, {
    variables: { orderNumber },
    skip: !orderNumber,
    fetchPolicy: 'network-only'
  })

  const order = data?.order

  // 如果沒有訂單編號
  if (!orderNumber) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-12 h-12 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">找不到訂單</h1>
        <p className="text-gray-600 mb-6">請確認您的訂單編號是否正確</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          返回首頁
        </Link>
      </div>
    )
  }

  // Loading 狀態
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入訂單資訊中...</p>
        </div>
      </div>
    )
  }

  // Error 狀態
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-12 h-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">載入失敗</h1>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          返回首頁
        </Link>
      </div>
    )
  }

  // 訂單不存在
  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-12 h-12 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">找不到訂單</h1>
        <p className="text-gray-600 mb-6">訂單編號 {orderNumber} 不存在</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          返回首頁
        </Link>
      </div>
    )
  }

  // 判斷付款方式
  const paymentType = order.payment?.paymentType || order.paymentMethod
  const isATM = paymentType === 'VACC' || paymentType === 'ATM'
  const isCVS = paymentType === 'CVS' || paymentType === 'BARCODE'
  const needsPayment = order.paymentStatus !== 'PAID' && (isATM || isCVS)

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* 成功圖示 */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">訂單成立成功！</h1>
        <p className="text-gray-600">感謝您的購買，我們已收到您的訂單</p>
      </div>

      {/* 訂單資訊 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">訂單編號</p>
            <p className="text-lg font-mono font-bold text-gray-900">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">訂單時間</p>
            <p className="text-gray-900">
              {new Date(order.createdAt).toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">訂單金額</p>
            <p className="text-lg font-bold text-primary-600">
              NT$ {Number(order.total).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">付款狀態</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              order.paymentStatus === 'PAID'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {order.paymentStatus === 'PAID' ? '已付款' : '待付款'}
            </span>
          </div>
        </div>

        {/* 訂單商品列表 */}
        {order.items && order.items.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">訂單商品</h3>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage && (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-sm text-gray-500">
                      {item.color && `${item.color} / `}EU {item.sizeEu} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      NT$ {Number(item.subtotal).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 金額明細 */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">商品小計</span>
              <span className="text-gray-900">NT$ {Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">運費</span>
              <span className="text-gray-900">NT$ {Number(order.shippingFee).toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>折扣</span>
                <span>-NT$ {Number(order.discount).toLocaleString()}</span>
              </div>
            )}
            {order.creditUsed > 0 && (
              <div className="flex justify-between text-green-600">
                <span>購物金折抵</span>
                <span>-NT$ {Number(order.creditUsed).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>總計</span>
              <span className="text-primary-600">NT$ {Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 收件資訊 */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">收件資訊</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>收件人：{order.shippingName}</p>
            <p>電話：{order.shippingPhone}</p>
            <p>地址：{order.shippingZipCode} {order.shippingCity}{order.shippingDistrict}{order.shippingStreet}</p>
          </div>
        </div>
      </div>

      {/* ATM 轉帳資訊 */}
      {needsPayment && isATM && order.payment?.atmVirtualAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">ATM 轉帳資訊</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>銀行代碼：{order.payment.atmBankCode}</p>
                <p>虛擬帳號：<span className="font-mono font-bold">{order.payment.atmVirtualAccount}</span></p>
                <p>轉帳金額：<span className="font-bold text-primary-600">NT$ {Number(order.total).toLocaleString()}</span></p>
                {order.payment.atmExpireDate && (
                  <p className="text-yellow-700 font-medium mt-2">
                    請於 {new Date(order.payment.atmExpireDate).toLocaleString('zh-TW')} 前完成轉帳
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 超商代碼資訊 */}
      {needsPayment && isCVS && order.payment?.cvsPaymentNo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">超商繳費資訊</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>繳費代碼：<span className="font-mono font-bold">{order.payment.cvsPaymentNo}</span></p>
                <p>繳費金額：<span className="font-bold text-primary-600">NT$ {Number(order.total).toLocaleString()}</span></p>
                {order.payment.cvsExpireDate && (
                  <p className="text-yellow-700 font-medium mt-2">
                    請於 {new Date(order.payment.cvsExpireDate).toLocaleString('zh-TW')} 前至超商繳費
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 接下來該做什麼 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">接下來該做什麼？</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">查看訂單確認郵件</p>
              <p className="text-sm text-gray-600">
                我們已發送訂單確認郵件到您的信箱，請查收
              </p>
            </div>
          </div>

          {needsPayment && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">完成付款</p>
                <p className="text-sm text-gray-600">
                  {isATM && '請使用上方的 ATM 轉帳資訊完成付款'}
                  {isCVS && '請使用上方的繳費代碼至超商完成付款'}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">{needsPayment ? '3' : '2'}</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">追蹤訂單狀態</p>
              <p className="text-sm text-gray-600">
                您可以隨時在「我的訂單」中查看訂單狀態和物流資訊
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/account/orders"
          className="block py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          查看我的訂單
        </Link>
        <Link
          href="/"
          className="block py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors"
        >
          繼續購物
        </Link>
      </div>

      {/* 客服資訊 */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          如有任何問題，請聯繫客服：
          <a href="tel:02-2345-6789" className="text-primary-600 hover:text-primary-700 ml-1">
            02-2345-6789
          </a>
          {' '}或{' '}
          <a
            href="mailto:support@shoestore.com"
            className="text-primary-600 hover:text-primary-700"
          >
            support@shoestore.com
          </a>
        </p>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
