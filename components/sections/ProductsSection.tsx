'use client'

import Link from 'next/link'

export default function ProductsSection() {
  const productCategories = [
    {
      title: '運動鞋系列',
      description: '專業運動性能，提供最佳支撐與舒適度，適合各種運動場合',
      emoji: '👟',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop',
      products: ['慢跑鞋', '籃球鞋', '訓練鞋', '足球鞋'],
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      title: '休閒鞋系列',
      description: '時尚與舒適的完美結合，打造日常穿搭的最佳選擇',
      emoji: '👞',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop',
      products: ['帆布鞋', '小白鞋', '板鞋', '樂福鞋'],
      gradient: 'from-amber-500 to-amber-700',
    },
    {
      title: '時尚潮鞋',
      description: '引領潮流趨勢，展現個人風格與態度的絕佳單品',
      emoji: '🥾',
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&auto=format&fit=crop',
      products: ['高筒潮鞋', '限量聯名', '復古球鞋', '街頭滑板鞋'],
      gradient: 'from-purple-500 to-purple-700',
    },
    {
      title: '專業跑鞋',
      description: '為跑者設計，輕量透氣材質搭配先進緩震科技',
      emoji: '🏃',
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop',
      products: ['馬拉松鞋', '競速鞋', '越野跑鞋', '慢跑鞋'],
      gradient: 'from-red-500 to-red-700',
    },
  ]

  return (
    <section id="products" className="py-20 black-color-products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題區 */}
        <div className="text-center mb-16 reveal">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold-base)] to-[var(--gold-deep)] bg-clip-text text-transparent">
              精選鞋款系列
            </span>
          </h2>
          <p className="text-xl text-amber-100/80 max-w-2xl mx-auto">
            嚴選全球頂尖品牌，提供最完整的尺碼與配色選擇
          </p>
        </div>

        {/* 產品網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {productCategories.map((category, index) => (
            <div
              key={index}
              className="product-card glass-card p-6 hover:shadow-2xl transition-all duration-300 reveal"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* 圖片區 */}
              <div className="relative h-64 mb-6 overflow-hidden rounded-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-20`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl product-emoji">{category.emoji}</span>
                </div>
              </div>

              {/* 內容區 */}
              <h3 className="text-2xl font-bold text-amber-100 mb-3">
                {category.title}
              </h3>
              <p className="text-amber-100/70 mb-4 leading-relaxed">
                {category.description}
              </p>

              {/* 產品標籤 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {category.products.map((product, idx) => (
                  <span
                    key={idx}
                    className="product-tag px-3 py-1 bg-amber-900/30 text-amber-200 text-sm rounded-full border border-amber-700/50"
                  >
                    {product}
                  </span>
                ))}
              </div>

              {/* 按鈕 */}
              <Link
                href="/products"
                className="product-btn inline-block w-full text-center py-3 bg-gradient-to-r from-[var(--gold-light)] to-[var(--gold-deep)] text-black font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                查看更多
              </Link>
            </div>
          ))}
        </div>

        {/* CTA按鈕 */}
        <div className="text-center mt-12 reveal">
          <Link
            href="/products"
            className="btn-primary inline-block"
          >
            瀏覽全部商品
          </Link>
        </div>
      </div>
    </section>
  )
}
