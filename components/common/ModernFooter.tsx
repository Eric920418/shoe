'use client'

import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ModernFooter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('請輸入有效的 Email 地址')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation UpdateEmailSubscription($subscribed: Boolean!) {
              updateEmailSubscription(subscribed: $subscribed) {
                id
                marketingEmailOptIn
              }
            }
          `,
          variables: { subscribed: true },
        }),
      })

      const json = await res.json()
      if (json.errors) {
        throw new Error(json.errors[0]?.message || '訂閱失敗')
      }

      toast.success('訂閱成功！您將收到最新產品資訊與獨家優惠')
      setEmail('')
    } catch (error: any) {
      if (error.message.includes('登入') || error.message.includes('UNAUTHENTICATED')) {
        toast.error('請先登入才能訂閱電子報')
      } else {
        toast.error(error.message || '訂閱失敗，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 主要內容區 */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* 商品分類 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
              商品分類
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products?gender=MALE"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  男鞋
                </Link>
              </li>
              <li>
                <Link
                  href="/products?gender=FEMALE"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  女鞋
                </Link>
              </li>
              <li>
                <Link
                  href="/products?shoeType=SNEAKERS"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  運動鞋
                </Link>
              </li>
              <li>
                <Link
                  href="/products?shoeType=CASUAL"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  休閒鞋
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  所有商品
                </Link>
              </li>
            </ul>
          </div>

          {/* 客戶服務 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
              客戶服務
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/account/orders"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  訂單查詢
                </Link>
              </li>
              <li>
                <Link
                  href="/account/returns"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  退貨申請
                </Link>
              </li>
              <li>
                <Link
                  href="/account/support"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  客服中心
                </Link>
              </li>
              <li>
                <Link
                  href="/size-guide"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  尺碼對照表
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  配送資訊
                </Link>
              </li>
            </ul>
          </div>

          {/* 關於我們 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
              關於我們
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  品牌故事
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  門市資訊
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  加入我們
                </Link>
              </li>
              <li>
                <Link
                  href="/sustainability"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  永續發展
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  聯絡我們
                </Link>
              </li>
            </ul>
          </div>

          {/* 會員專區 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
              會員專區
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/account"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  個人資料
                </Link>
              </li>
  
              <li>
                <Link
                  href="/account/referral"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  邀請好友
                </Link>
              </li>
              <li>
                <Link
                  href="/account/credits"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  購物金
                </Link>
              </li>
              <li>
                <Link
                  href="/account/coupons"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  優惠券
                </Link>
              </li>
            </ul>
          </div>

          {/* 訂閱電子報 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
              訂閱電子報
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              訂閱以獲得最新產品資訊與獨家優惠
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="輸入您的 Email"
                className="w-full px-4 py-2 bg-white text-black text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '訂閱中...' : '訂閱'}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              需要先登入才能訂閱電子報
            </p>

            {/* 社群連結 */}
            <div className="mt-6">
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                  aria-label="LINE"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 底部區域 */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* 版權資訊 */}
            <div className="text-sm text-gray-400 text-center lg:text-left">
              © 2025 SHOE STORE. All Rights Reserved.
            </div>

            {/* 法律連結 */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                服務條款
              </Link>
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                隱私政策
              </Link>
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cookie 政策
              </Link>
              <Link
                href="/api/graphql"
                className="text-gray-400 hover:text-white transition-colors"
              >
                GraphQL API
              </Link>
            </div>

            {/* 支付方式 */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                支付方式
              </span>
              <div className="flex space-x-2">
                <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
                  VISA
                </div>
                <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
                  MC
                </div>
                <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
                  JCB
                </div>
                <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
                  LINE
                </div>
              </div>
            </div>
          </div>

          {/* GraphQL 標記 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Powered by Next.js 14 + GraphQL + PostgreSQL + Redis
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
