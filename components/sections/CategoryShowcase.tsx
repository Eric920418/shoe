import Link from 'next/link'

export default function CategoryShowcase() {
  const categories = [
    {
      title: '男鞋系列',
      subtitle: 'Men\'s Collection',
      description: '力量與速度的完美詮釋',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&auto=format&fit=crop&q=80',
      link: '/products?gender=MALE',
      position: 'left',
    },
    {
      title: '女鞋系列',
      subtitle: 'Women\'s Collection',
      description: '優雅與性能的平衡藝術',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&auto=format&fit=crop&q=80',
      link: '/products?gender=FEMALE',
      position: 'right',
    },
  ]

  const subCategories = [
    {
      title: '跑步訓練',
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80',
      link: '/products?shoeType=SNEAKERS',
    },
    {
      title: '籃球系列',
      image: 'https://images.unsplash.com/photo-1515396136109-e59a40838a92?w=600&auto=format&fit=crop&q=80',
      link: '/products?shoeType=SNEAKERS',
    },
    {
      title: '休閒生活',
      image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80',
      link: '/products?shoeType=CASUAL',
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 主分類 - 男女系列 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.link}
              className="group relative overflow-hidden rounded-lg aspect-[4/5] lg:aspect-[3/4]"
            >
              {/* 背景圖片 */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${category.image})`,
                }}
              />

              {/* 漸層遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* 內容 */}
              <div className="relative h-full flex flex-col justify-end p-8 text-white">
                <p className="text-sm tracking-widest uppercase mb-2 opacity-80">
                  {category.subtitle}
                </p>
                <h3 className="text-4xl sm:text-5xl font-black mb-2">
                  {category.title}
                </h3>
                <p className="text-lg mb-6 opacity-90">
                  {category.description}
                </p>
                <div className="inline-flex items-center gap-2 font-semibold group-hover:gap-4 transition-all">
                  立即選購
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 子分類 - 運動類型 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {subCategories.map((category, index) => (
            <Link
              key={index}
              href={category.link}
              className="group relative overflow-hidden rounded-lg aspect-[4/3]"
            >
              {/* 背景圖片 */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${category.image})`,
                }}
              />

              {/* 漸層遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* 內容 */}
              <div className="relative h-full flex flex-col justify-end p-6 text-white">
                <h4 className="text-2xl font-bold mb-2">{category.title}</h4>
                <div className="inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
                  探索系列
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
