'use client'

/**
 * 訂單完成頁面 - 引導訪客註冊會員
 */

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const orderNumber = searchParams.get('orderNumber')
  const phone = searchParams.get('phone')

  useEffect(() => {
    // 如果沒有訂單編號，跳轉到首頁
    if (!orderNumber) {
      router.push('/')
    }
  }, [orderNumber, router])

  if (!orderNumber) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 成功圖示 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">訂單建立成功！</h1>
          <p className="text-lg text-gray-600">
            感謝您的購買，我們已收到您的訂單
          </p>
        </div>

        {/* 訂單資訊卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="border-l-4 border-green-500 pl-4 mb-6">
            <h2 className="text-sm text-gray-500 mb-1">訂單編號</h2>
            <p className="text-2xl font-bold text-gray-900 font-mono">{orderNumber}</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
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
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  如何追蹤訂單？
                </p>
                <p className="text-sm text-blue-800">
                  請記下您的訂單編號，您可以隨時使用「訂單編號 + 手機號碼」查詢訂單狀態。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/orders/track?orderNumber=${orderNumber}&phone=${phone || ''}`}
              className="flex-1 py-3 bg-black text-white text-center rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              查看訂單詳情
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 text-center rounded-lg hover:border-gray-400 transition-colors font-medium"
            >
              繼續購物
            </Link>
          </div>
        </div>

        {/* 訪客：強力引導註冊 */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-xl shadow-xl p-8 mb-8 relative overflow-hidden">
            {/* 裝飾性背景 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎁</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  立即註冊，獲得更多好處！
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    <div>
                      <h3 className="font-bold text-gray-900">購物金回饋</h3>
                      <p className="text-sm text-gray-800">每筆訂單累積購物金</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⭐</span>
                    <div>
                      <h3 className="font-bold text-gray-900">會員專屬折扣</h3>
                      <p className="text-sm text-gray-800">享受更多優惠價格</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎂</span>
                    <div>
                      <h3 className="font-bold text-gray-900">生日禮金</h3>
                      <p className="text-sm text-gray-800">生日當月送購物金</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📦</span>
                    <div>
                      <h3 className="font-bold text-gray-900">訂單管理</h3>
                      <p className="text-sm text-gray-800">輕鬆追蹤所有訂單</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/line-verify"
                  className="flex-1 py-4 bg-[#06C755] text-white text-center rounded-xl hover:bg-[#05b34c] transition-colors font-bold text-lg shadow-lg"
                >
                  🚀 LINE 快速註冊（30秒）
                </Link>
                <Link
                  href="/auth/login"
                  className="flex-1 py-4 bg-white text-gray-900 text-center rounded-xl hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg"
                >
                  已有帳號？登入
                </Link>
              </div>

              <p className="text-center text-sm text-gray-800 mt-4">
                註冊後，本筆訂單將自動綁定到您的帳號
              </p>
            </div>
          </div>
        )}

        {/* 會員：感謝訊息 */}
        {isAuthenticated && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🙏</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  感謝您的支持！
                </h3>
                <p className="text-gray-700">
                  您已獲得本次訂單的會員積分，可至「我的帳戶」查看。
                </p>
              </div>
            </div>
            <Link
              href="/account"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              查看我的帳戶
            </Link>
          </div>
        )}

        {/* 下一步提示 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">接下來會發生什麼？</h3>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">訂單確認</h4>
                <p className="text-sm text-gray-600">
                  我們將在 24 小時內確認您的訂單並開始處理
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">付款確認</h4>
                <p className="text-sm text-gray-600">
                  如選擇銀行轉帳，請盡快完成匯款並通知我們
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">出貨通知</h4>
                <p className="text-sm text-gray-600">
                  商品出貨後，您將收到物流追蹤號碼
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">收貨與評價</h4>
                <p className="text-sm text-gray-600">
                  收到商品後，歡迎留下您的評價與心得
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* 客服聯繫 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>如有任何問題，請隨時聯繫我們的客服團隊</p>
          <Link href="/account/support" className="text-blue-600 hover:underline font-medium">
            聯繫客服
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
