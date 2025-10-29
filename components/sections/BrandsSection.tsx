export default function BrandsSection() {
  const brands = [
    { name: 'Nike', logo: '✓', description: '全球運動領導品牌' },
    { name: 'Adidas', logo: '⚡', description: '經典三條線' },
    { name: 'Puma', logo: '🐆', description: '速度與力量' },
    { name: 'New Balance', logo: 'NB', description: '美式經典' },
    { name: 'Converse', logo: '★', description: '潮流帆布鞋' },
    { name: 'Vans', logo: 'V', description: '滑板文化' },
    { name: 'ASICS', logo: 'A', description: '專業跑鞋' },
    { name: 'Reebok', logo: '△', description: '健身首選' },
  ]

  return (
    <section id="brands" className="py-20 bg-gradient-to-b from-[var(--black-deep)] via-[var(--black-base)] to-[var(--black-light)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題 */}
        <div className="text-center mb-16 reveal">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold-base)] to-[var(--gold-deep)] bg-clip-text text-transparent">
              熱門品牌
            </span>
          </h2>
          <p className="text-xl text-amber-100/80 max-w-2xl mx-auto">
            與全球頂尖品牌合作，為您帶來最優質的鞋履選擇
          </p>
        </div>

        {/* 品牌網格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300 cursor-pointer reveal"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Logo */}
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold-deep)] rounded-full flex items-center justify-center text-3xl font-bold text-black">
                {brand.logo}
              </div>
              {/* 品牌名 */}
              <h3 className="text-xl font-bold text-amber-100 mb-2">
                {brand.name}
              </h3>
              {/* 描述 */}
              <p className="text-sm text-amber-100/60">
                {brand.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
