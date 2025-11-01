'use client'

import React from 'react'
import Link from 'next/link'
import { TrendingUp, Star, Percent, Truck, Gift, Award } from 'lucide-react'

const CategoryGrid = () => {
  const categories = [
    {
      icon: '👟',
      name: '運動鞋',
      count: '3,456',
      color: 'bg-gradient-to-br from-blue-100 to-cyan-100',
      tag: 'HOT',
      tagColor: 'bg-red-500'
    },
    {
      icon: '👞',
      name: '休閒鞋',
      count: '2,789',
      color: 'bg-gradient-to-br from-green-100 to-emerald-100',
      tag: null
    },
    {
      icon: '👠',
      name: '高跟鞋',
      count: '1,567',
      color: 'bg-gradient-to-br from-pink-100 to-rose-100',
      tag: 'NEW',
      tagColor: 'bg-purple-500'
    },
    {
      icon: '🥾',
      name: '靴子',
      count: '987',
      color: 'bg-gradient-to-br from-yellow-100 to-amber-100',
      tag: null
    },
    {
      icon: '👡',
      name: '涼鞋拖鞋',
      count: '2,345',
      color: 'bg-gradient-to-br from-purple-100 to-indigo-100',
      tag: '特價',
      tagColor: 'bg-orange-500'
    },
    {
      icon: '👶',
      name: '童鞋',
      count: '1,234',
      color: 'bg-gradient-to-br from-orange-100 to-red-100',
      tag: null
    },
    {
      icon: '🏃',
      name: '專業運動',
      count: '678',
      color: 'bg-gradient-to-br from-teal-100 to-cyan-100',
      tag: null
    },
    {
      icon: '💰',
      name: '特價專區',
      count: '4,567',
      color: 'bg-gradient-to-br from-red-100 to-pink-100',
      tag: '5折起',
      tagColor: 'bg-red-500'
    }
  ]

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
        {categories.map((category, index) => (
          <Link
            key={index}
            href={`/category/${category.name}`}
            className={`${category.color} relative group rounded-lg p-2 sm:p-4 flex flex-col items-center justify-center hover:shadow-md transition-all duration-300 cursor-pointer`}
          >
            {category.tag && (
              <span className={`absolute top-0.5 sm:top-1 right-0.5 sm:right-1 ${category.tagColor} text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded font-bold`}>
                {category.tag}
              </span>
            )}
            <div className="text-xl sm:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
              {category.icon}
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">{category.name}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{category.count}件</span>
          </Link>
        ))}
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