'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flame, Gift, Star } from 'lucide-react'
import { useQuery } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS } from '@/graphql/queries'

const MarketplaceHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  // 查詢產品資料（用於「今日必搶」）
  const { data } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      take: 10,
    }
  })

  // 獲取今日必搶產品（選擇折扣最大的產品）
  const todayDeal = React.useMemo(() => {
    if (!data?.products) return null

    const productsWithDiscount = data.products
      .filter((p: any) => p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price))
      .map((p: any) => {
        const price = parseFloat(p.price)
        const originalPrice = parseFloat(p.originalPrice)
        const discount = ((originalPrice - price) / originalPrice) * 100
        const soldCount = p.soldCount || 0
        const stock = p.stock || 100

        return {
          slug: p.slug,
          name: p.name,
          price,
          originalPrice,
          discount,
          soldPercentage: stock > 0 ? Math.min((soldCount / (soldCount + stock)) * 100, 100) : 0
        }
      })
      .sort((a: any, b: any) => b.discount - a.discount)

    return productsWithDiscount[0] || null
  }, [data])

  const banners = [
    {
      id: 1,
      title: '雙11限時特賣',
      subtitle: '全場5折起',
      description: '買2送1，滿999免運',
      bgColor: 'from-red-500 to-orange-500',
      link: '/flash-sale',
      tag: '限時搶購'
    },
    {
      id: 2,
      title: '新品上市',
      subtitle: '2024秋冬新款',
      description: '首購享85折優惠',
      bgColor: 'from-purple-500 to-pink-500',
      link: '/new-arrivals',
      tag: 'NEW'
    },
    {
      id: 3,
      title: '品牌特賣',
      subtitle: 'Nike/Adidas',
      description: '正品保證，假一賠十',
      bgColor: 'from-blue-500 to-cyan-500',
      link: '/brands',
      tag: '品牌日'
    },
    {
      id: 4,
      title: '清倉大特價',
      subtitle: '換季出清',
      description: '最低3折起',
      bgColor: 'from-green-500 to-teal-500',
      link: '/clearance',
      tag: '清倉價'
    }
  ]

  const sidePromos = [
    {
      title: '邀請好友',
      subtitle: '賺購物金',
      icon: '🎁',
      bgColor: 'bg-gradient-to-br from-purple-400 to-pink-400',
      link: '/account/referral'
    },
    {
      title: '會員升級',
      subtitle: '享更多優惠',
      icon: '👑',
      bgColor: 'bg-gradient-to-br from-yellow-400 to-orange-400',
      link: '/account'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }

  return (
    <div className="mt-2 sm:mt-4 flex gap-2 sm:gap-4">
      {/* 左側分類快捷入口 - 只在大螢幕顯示 */}
      <div className="hidden xl:block w-48 bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Star className="text-yellow-500" size={18} />
          熱門分類
        </h3>
        <div className="space-y-2">
          {["運動鞋", "休閒鞋", "皮鞋", "高跟鞋", "涼鞋", "童鞋"].map(
            (cat, idx) => (
              <Link
                key={idx}
                href={`/category/${cat}`}
                className="flex items-center justify-between py-2 px-3 hover:bg-orange-50 rounded-lg transition-colors group"
              >
                <span className="text-gray-700 text-sm group-hover:text-orange-600">
                  {cat}
                </span>
                <span className="text-xs text-gray-400">{">"}</span>
              </Link>
            )
          )}
          <Link
            href="/all-categories"
            className="flex items-center justify-center py-2 px-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium mt-3"
          >
            查看全部分類
          </Link>
        </div>
      </div>

      {/* 中間輪播圖 */}
      <div className="flex-1">
        <div className="relative h-[200px] sm:h-[300px] lg:h-full bg-gray-100 rounded-lg overflow-hidden">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className={`h-full bg-gradient-to-r ${banner.bgColor} flex items-center justify-center relative`}
              >
                <div className="text-center text-white z-10 px-4 sm:px-8">
                  <div className="inline-block bg-white/20 backdrop-blur text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm mb-2 sm:mb-4">
                    {banner.tag}
                  </div>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 drop-shadow-lg">
                    {banner.title}
                  </h2>
                  <p className="text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2 drop-shadow-md">
                    {banner.subtitle}
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 opacity-90">
                    {banner.description}
                  </p>
                  <Link
                    href={banner.link}
                    className="inline-block bg-white text-gray-900 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold hover:scale-105 transition-transform shadow-lg"
                  >
                    立即搶購
                  </Link>
                </div>

                {/* 裝飾元素 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full" />
                  <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full" />
                </div>
              </div>
            </div>
          ))}

          {/* 輪播控制 */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
          >
            <ChevronRight size={24} />
          </button>

          {/* 指示器 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 右側促銷資訊 - 只在超大螢幕顯示 */}
      <div className="hidden 2xl:block w-64">
        <div className="sticky top-4 space-y-2 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1 custom-scrollbar">
          {/* 用戶資訊卡 */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                VIP
              </div>
              <div>
                <p className="text-xs text-gray-600">歡迎回來</p>
                <p className="font-medium text-sm">親愛的會員</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <button className="bg-red-50 text-red-600 py-1.5 rounded-lg text-xs hover:bg-red-100 transition-colors">
                會員中心
              </button>
            </div>
            <div className="border-t pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">購物金餘額</span>
                <span className="font-bold text-orange-600">$500</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">待收貨</span>
                <span className="font-bold">3件</span>
              </div>
            </div>
          </div>

          {/* 底部小型促銷卡片 */}
          <div className="grid grid-cols-2 gap-2">
            {sidePromos.map((promo, idx) => (
              <Link
                key={idx}
                href={promo.link}
                className={`${promo.bgColor} rounded-lg p-2.5 text-white cursor-pointer hover:scale-[1.02] transition-transform block`}
              >
                <div className="text-xl mb-1">{promo.icon}</div>
                <h4 className="font-bold text-xs leading-tight mb-0.5">
                  {promo.title}
                </h4>
                <p className="text-[10px] opacity-90 leading-tight">
                  {promo.subtitle}
                </p>
              </Link>
            ))}
          </div>

          {/* 限時優惠提醒 - 精簡版 */}
          {todayDeal && (
            <Link href={`/products/${todayDeal.slug}`}>
              <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-lg p-3 text-white cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Flame className="animate-pulse" size={16} />
                  <span className="font-bold text-sm">今日必搶</span>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-2">
                  <p className="font-bold text-sm mb-1 line-clamp-1">
                    {todayDeal.name}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold">
                      ${Math.round(todayDeal.price)}
                    </span>
                    <span className="text-xs line-through opacity-70">
                      ${Math.round(todayDeal.originalPrice)}
                    </span>
                  </div>
                  <div className="mt-1.5 bg-white/30 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all"
                      style={{ width: `${todayDeal.soldPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] mt-0.5 opacity-80">
                    已搶購 {Math.round(todayDeal.soldPercentage)}%
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketplaceHero