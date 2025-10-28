'use client'

/**
 * 訂單成功頁面
 */

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber') || 'ORD-UNKNOWN'

  // TODO: 從GraphQL API獲取訂單詳情

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
            <p className="text-lg font-mono font-bold text-gray-900">{orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">訂單時間</p>
            <p className="text-gray-900">
              {new Date().toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
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

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">完成付款</p>
                <p className="text-sm text-gray-600">
                  請依照郵件中的說明完成付款，我們將在確認收款後盡快為您出貨
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">3</span>
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
      </div>

      {/* 銀行轉帳資訊（如果是銀行轉帳） */}
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
            <h3 className="font-semibold text-gray-900 mb-2">銀行轉帳資訊</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p>銀行：台灣銀行 (004)</p>
              <p>戶名：鞋店電商有限公司</p>
              <p>帳號：1234-5678-9012-3456</p>
              <p className="text-yellow-700 font-medium mt-2">
                請於 3 天內完成轉帳，並備註訂單編號：{orderNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/orders"
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
