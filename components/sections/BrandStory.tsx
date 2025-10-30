import Link from 'next/link'

export default function BrandStory() {
  const values = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: '創新科技',
      description: '持續研發突破性技術，提供最佳運動體驗',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      title: '品質承諾',
      description: '嚴選材料，精湛工藝，確保每雙鞋的完美品質',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: '永續發展',
      description: '環保材料，負責任生產，為地球盡一份心力',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: '社群連結',
      description: '與運動愛好者共同成長，分享熱情與夢想',
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 主標題區 */}
        <div className="text-center mb-20">
          <p className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">
            About Us
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black mb-6">
            不只是鞋，是態度
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            我們相信每一雙鞋都承載著一個故事，每一步都是夢想的延伸。
            <br />
            從專業運動員到街頭潮流玩家，我們為每個人打造完美的鞋履體驗。
          </p>
        </div>

        {/* 價值觀網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {values.map((value, index) => (
            <div
              key={index}
              className="text-center group hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full mb-4 group-hover:bg-gray-800 transition-colors">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold text-black mb-2">{value.title}</h3>
              <p className="text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>

        {/* CTA 區塊 */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* 背景圖片 */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&auto=format&fit=crop&q=80)',
            }}
          />

          {/* 漸層遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />

          {/* 內容 */}
          <div className="relative px-8 sm:px-12 lg:px-20 py-16 sm:py-20 lg:py-24">
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                準備好開始你的旅程了嗎？
              </h3>
              <p className="text-xl text-gray-200 mb-8">
                超過 10,000+ 款精選鞋履等你探索
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="inline-block text-center bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-200 transition-all transform hover:scale-105"
                >
                  開始選購
                </Link>
                <Link
                  href="/account/referral"
                  className="inline-block text-center bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white hover:text-black transition-all"
                >
                  邀請好友
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 數據統計 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 text-center">
          {[
            { number: '10,000+', label: '精選鞋款' },
            { number: '50+', label: '全球品牌' },
            { number: '100,000+', label: '滿意顧客' },
            { number: '24/7', label: '客戶服務' },
          ].map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-black">
                {stat.number}
              </div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
