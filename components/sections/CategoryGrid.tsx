'use client'

import React from 'react'
import Link from 'next/link'

// 三大主分類配置
const MAIN_CATEGORIES = [
  {
    key: 'WOMEN',
    label: '女鞋',
    emoji: '👠',
    gradient: 'from-pink-500 to-rose-500',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-100',
    hoverBg: 'hover:from-pink-100 hover:to-rose-200',
  },
  {
    key: 'MEN_KIDS',
    label: '男鞋和童鞋',
    emoji: '👟',
    gradient: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    hoverBg: 'hover:from-blue-100 hover:to-indigo-200',
  },
  {
    key: 'OTHER',
    label: '其他',
    emoji: '📦',
    gradient: 'from-orange-500 to-amber-500',
    bgColor: 'bg-gradient-to-br from-orange-50 to-amber-100',
    hoverBg: 'hover:from-orange-100 hover:to-amber-200',
  },
]

const CategoryGrid = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 my-4 sm:my-6">
      {/* 標題 */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🛍️</span>
          精選分類
        </h2>
      </div>

      {/* 三大主分類按鈕 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {MAIN_CATEGORIES.map((category) => (
          <Link
            key={category.key}
            href={`/products?mainCategory=${category.key}`}
            className={`${category.bgColor} ${category.hoverBg} relative group rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1`}
          >
            {/* Emoji 圖示 */}
            <div className="text-3xl sm:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
              {category.emoji}
            </div>

            {/* 分類名稱 */}
            <span className="text-sm sm:text-lg font-bold text-gray-800 text-center">
              {category.label}
            </span>

            {/* 裝飾性底部條 */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-1 rounded-full bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default CategoryGrid
