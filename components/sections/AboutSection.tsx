export default function AboutSection() {
  const features = [
    {
      icon: '📏',
      title: '多國尺碼對照',
      description: '提供EUR、US、UK、CM四種尺碼系統，精準換算讓您輕鬆選購',
    },
    {
      icon: '🎨',
      title: '豐富配色選擇',
      description: '每款鞋提供多種配色，顏色切換即時預覽，滿足您的個性需求',
    },
    {
      icon: '💡',
      title: '智能尺碼建議',
      description: '根據腳長推薦最適合的尺碼，並提供尺碼合適度參考評論',
    },
    {
      icon: '🔄',
      title: '便捷退換貨',
      description: '尺碼不合？我們提供專門的尺碼退換貨流程，購物無憂',
    },
    {
      icon: '✅',
      title: '正品保證',
      description: '與品牌官方合作，100%正品保證，讓您買得安心',
    },
    {
      icon: '🚚',
      title: '快速配送',
      description: '全台宅配，訂單追蹤，讓您隨時掌握商品動態',
    },
  ]

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-[var(--black-light)] to-[var(--black-deep)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題區 */}
        <div className="text-center mb-16 reveal">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold-base)] to-[var(--gold-deep)] bg-clip-text text-transparent">
              為什麼選擇我們
            </span>
          </h2>
          <p className="text-xl text-amber-100/80 max-w-2xl mx-auto">
            專業的鞋履電商平台，為您提供最完整的購物體驗
          </p>
        </div>

        {/* 特色網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 hover:scale-105 transition-all duration-300 reveal"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* 圖標 */}
              <div className="text-6xl mb-4 about-emoji">
                {feature.icon}
              </div>
              {/* 標題 */}
              <h3 className="text-2xl font-bold text-amber-100 mb-3">
                {feature.title}
              </h3>
              {/* 描述 */}
              <p className="text-amber-100/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* 統計數據 */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 reveal">
          {[
            { number: '10,000+', label: '精選鞋款' },
            { number: '50+', label: '知名品牌' },
            { number: '100,000+', label: '滿意客戶' },
            { number: '4.9', label: '用戶評分' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-[var(--gold-light)] to-[var(--gold-deep)] bg-clip-text text-transparent">
                  {stat.number}
                </span>
              </div>
              <div className="text-amber-100/80 text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
