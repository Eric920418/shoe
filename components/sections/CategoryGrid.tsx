'use client'

import React from 'react'
import Link from 'next/link'
import { TrendingUp, Star, Percent, Truck, Gift, Award } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'

// GraphQL 查詢：獲取分類（直接查詢，不依賴 categoryDisplays）
const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      productCount
    }
  }
`

// 分類圖標配置
const categoryIcons: Record<string, string> = {
  '運動鞋': '👟',
  '休閒鞋': '👞',
  '靴子': '🥾',
  '正裝鞋': '👔',
  '高跟鞋': '👠',
  '涼鞋': '👡',
  '童鞋': '👶',
}

// 背景顏色選項
const colorOptions = [
  'bg-gradient-to-br from-blue-100 to-cyan-100',
  'bg-gradient-to-br from-green-100 to-emerald-100',
  'bg-gradient-to-br from-yellow-100 to-amber-100',
  'bg-gradient-to-br from-purple-100 to-indigo-100',
  'bg-gradient-to-br from-pink-100 to-rose-100',
  'bg-gradient-to-br from-orange-100 to-red-100',
  'bg-gradient-to-br from-teal-100 to-cyan-100',
  'bg-gradient-to-br from-red-100 to-pink-100'
]

const CategoryGrid = () => {
  // 查詢真實分類
  const { data, loading } = useQuery(GET_CATEGORIES, {
    fetchPolicy: 'cache-first',
  })

  // 使用真實數據
  const categories = React.useMemo(() => {
    if (!data?.categories || data.categories.length === 0) return []

    return data.categories
      .slice(0, 8) // 最多顯示8個分類
      .map((cat: any, index: number) => ({
        id: cat.id,
        icon: categoryIcons[cat.name] || '📦',
        name: cat.name,
        slug: cat.slug,
        count: cat.productCount || 0,
        color: colorOptions[index % colorOptions.length],
      }))
  }, [data])

  const quickLinks = [
    { icon: TrendingUp, text: '熱銷排行', link: '/popular', color: 'text-orange-600' },
    { icon: Star, text: '新品上市', link: '/new-arrivals', color: 'text-purple-600' },
    { icon: Percent, text: '限時特價', link: '/flash-sale', color: 'text-red-600' },
    { icon: Truck, text: '免運專區', link: '/free-shipping', color: 'text-green-600' },
    { icon: Gift, text: '滿額贈品', link: '/gifts', color: 'text-pink-600' },
    { icon: Award, text: '品牌旗艦', link: '/brand-stores', color: 'text-blue-600' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 my-4 sm:my-6">
      {/* 標題 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🛍️</span>
          精選分類
          <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1 sm:ml-2 hidden sm:inline">找到您想要的商品</span>
        </h2>
        <Link href="/all-categories" className="text-orange-600 hover:text-orange-700 font-medium text-xs sm:text-sm">
          全部 →
        </Link>
      </div>

      {/* 分類網格 */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {loading ? (
          // 載入中骨架屏
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-200 rounded mb-2" />
              <div className="w-12 h-3 bg-gray-200 rounded" />
            </div>
          ))
        ) : categories.length > 0 ? (
          categories.map((category: { id: string; icon: string; name: string; slug: string; count: number; color: string }) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`${category.color} relative group rounded-lg p-2 sm:p-4 flex flex-col items-center justify-center hover:shadow-md transition-all duration-300 cursor-pointer`}
            >
              <div className="text-xl sm:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">{category.name}</span>
              <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{category.count.toLocaleString()}件</span>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-4">
            暫無分類
          </div>
        )}
      </div>

      {/* 快捷入口 */}
      <div className="border-t pt-3 sm:pt-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {quickLinks.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.link}
                className="flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <Icon size={14} className={`sm:w-4 sm:h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs sm:text-sm text-gray-700">{item.text}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoryGrid