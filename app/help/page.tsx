'use client'

/**
 * 幫助中心頁面 - /help
 *
 * 功能：
 * 1. 顯示常見問題 FAQ（來自資料庫）
 * 2. 提供客服聯繫方式
 * 3. 顯示快速指南和有用資源
 */

import FAQSection from '@/components/sections/FAQSection'
import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero 區塊 */}
      <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white py-20 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 tracking-tight">
            我們能為您提供什麼幫助？
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            瀏覽常見問題，或直接聯繫我們的客服團隊
          </p>
        </div>
      </section>

      {/* 快速指南卡片 */}
      <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12 text-gray-900">
            快速指南
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 訂單追蹤 */}
            <Link
              href="/orders"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105"
            >
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                訂單追蹤
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                查看您的訂單狀態、物流資訊和配送進度
              </p>
            </Link>

            {/* 退換貨政策 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105 cursor-pointer">
              <div className="text-5xl mb-4">↩️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                退換貨政策
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                7 天鑑賞期，14 天內可退換貨（商品須保持完整）
              </p>
            </div>

            {/* 配送資訊 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105 cursor-pointer">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                配送資訊
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                全台免運，1-3 個工作日送達，支援超商取貨
              </p>
            </div>

            {/* 會員權益 */}
            <Link
              href="/account/wallet"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-orange-100 hover:border-orange-300 transform hover:scale-105"
            >
              <div className="text-5xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                會員權益
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                累計消費升級會員等級，享受購物金回饋
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ 區塊 */}
      <FAQSection />

      {/* 聯繫客服區塊 */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              還有其他問題？
            </h2>
            <p className="text-lg text-gray-300">
              我們的客服團隊隨時為您服務
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 線上客服 */}
            <Link
              href="/account/support"
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 transform hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-4xl">💬</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-orange-300 transition-colors">
                    線上客服
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    即時線上對話，快速解決問題
                  </p>
                  <span className="inline-block text-sm font-semibold text-orange-300">
                    開始對話 →
                  </span>
                </div>
              </div>
            </Link>

            {/* Email 客服 */}
            <a
              href="mailto:support@shoes.com"
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 transform hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-4xl">📧</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-orange-300 transition-colors">
                    Email 客服
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    support@shoes.com<br />
                    24 小時內回覆
                  </p>
                  <span className="inline-block text-sm font-semibold text-orange-300">
                    發送郵件 →
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* 客服時間 */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 border border-white/20">
              <p className="text-sm text-gray-300 mb-1">客服時間</p>
              <p className="text-lg font-bold">週一至週日 9:00 - 21:00</p>
            </div>
          </div>
        </div>
      </section>

      {/* 其他有用資源 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12 text-gray-900">
            其他有用資源
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 尺碼指南 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="text-3xl mb-3">📏</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                尺碼指南
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                如何測量腳長、國際尺碼對照表
              </p>
              <button className="text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors">
                查看指南 →
              </button>
            </div>

            {/* 保養建議 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                保養建議
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                如何清潔和保養您的鞋子，延長使用壽命
              </p>
              <button className="text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors">
                了解更多 →
              </button>
            </div>

            {/* 付款方式 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                付款方式
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                支援信用卡、ATM 轉帳、超商代碼付款
              </p>
              <button className="text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors">
                查看詳情 →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
