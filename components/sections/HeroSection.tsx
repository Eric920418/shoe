'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center black-color overflow-hidden pt-16">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[var(--gold-base)] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--gold-deep)] rounded-full blur-3xl"></div>
      </div>

      {/* 主要內容 */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Logo動畫 */}
          <div className="hero-logo mb-8 inline-block">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold-base)] to-[var(--gold-deep)] rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <span className="text-6xl">👟</span>
            </div>
          </div>

          {/* 標題 */}
          <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold-base)] to-[var(--gold-deep)] bg-clip-text text-transparent">
              潮流鞋履專賣店
            </span>
          </h1>

          {/* 副標題 */}
          <p className="hero-subtitle text-xl sm:text-2xl text-amber-100 mb-4 max-w-3xl mx-auto">
            探索全球頂尖品牌 · 精準尺碼管理 · 極致購物體驗
          </p>

          <p className="text-lg text-amber-200/80 mb-12 max-w-2xl mx-auto">
            從運動鞋到時尚潮鞋，我們提供多國尺碼對照、顏色選擇與專業尺碼建議
          </p>

          {/* 按鈕組 */}
          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#products"
              className="btn-primary w-full sm:w-auto"
            >
              立即選購
            </Link>
            <Link
              href="#brands"
              className="btn-secondary w-full sm:w-auto"
            >
              探索品牌
            </Link>
          </div>

          {/* 特色標籤 */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: '📏', text: '多國尺碼' },
              { icon: '🎨', text: '豐富配色' },
              { icon: '✅', text: '正品保證' },
              { icon: '🚚', text: '快速配送' },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="text-4xl mb-2">{feature.icon}</div>
                <div className="text-amber-100 font-semibold">{feature.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 向下滾動提示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg
          className="w-8 h-8 text-[var(--gold-base)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  )
}
