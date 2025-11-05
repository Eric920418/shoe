'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Eye, Star, TrendingUp, Flame, Award, Trophy } from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'

export default function PopularPage() {
  const [activeTab, setActiveTab] = useState('trending')

  const tabs = [
    { id: 'trending', label: '熱銷榜', icon: TrendingUp, color: 'text-red-500', bgColor: 'from-red-500 to-orange-500' },
    { id: 'rated', label: '好評榜', icon: Star, color: 'text-yellow-500', bgColor: 'from-yellow-500 to-orange-500' },
    { id: 'viewed', label: '人氣榜', icon: Eye, color: 'text-blue-500', bgColor: 'from-blue-500 to-cyan-500' },
    { id: 'discount', label: '折扣榜', icon: Flame, color: 'text-orange-500', bgColor: 'from-orange-500 to-red-500' }
  ]

  const allProducts = {
    trending: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      rank: i + 1,
      name: `熱銷商品 ${i + 1}`,
      price: 999 + i * 100,
      originalPrice: 1999 + i * 200,
      sales: `${(50 - i) / 10}k`,
      rating: (4.9 - i * 0.01).toFixed(1),
      image: '/api/placeholder/200/200'
    })),
    rated: Array.from({ length: 50 }, (_, i) => ({
      id: i + 51,
      rank: i + 1,
      name: `高評分商品 ${i + 1}`,
      price: 1999 + i * 100,
      originalPrice: 3999 + i * 200,
      sales: `${(40 - i) / 10}k`,
      rating: 4.9,
      image: '/api/placeholder/200/200'
    })),
    viewed: Array.from({ length: 50 }, (_, i) => ({
      id: i + 101,
      rank: i + 1,
      name: `人氣商品 ${i + 1}`,
      price: 2999 + i * 100,
      originalPrice: 5999 + i * 200,
      sales: `${(35 - i) / 10}k`,
      rating: (4.8 - i * 0.01).toFixed(1),
      image: '/api/placeholder/200/200'
    })),
    discount: Array.from({ length: 50 }, (_, i) => ({
      id: i + 151,
      rank: i + 1,
      name: `超值折扣商品 ${i + 1}`,
      price: 499 + i * 50,
      originalPrice: 1999 + i * 200,
      sales: `${(45 - i) / 10}k`,
      rating: (4.7 - i * 0.01).toFixed(1),
      image: '/api/placeholder/200/200'
    }))
  }

  const currentProducts = allProducts[activeTab] || allProducts.trending
  const currentTab = tabs.find(t => t.id === activeTab)

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-orange-400'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500'
    return 'bg-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '熱銷排行' }]} />
        </div>
      </div>

      {/* 頂部橫幅 */}
      <div className={`bg-gradient-to-r ${currentTab?.bgColor || 'from-red-500 to-orange-500'} text-white`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Trophy size={32} />
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">人氣排行榜</h1>
              <p className="opacity-90">大家都在買的熱門商品</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tab 切換 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.bgColor} text-white shadow-md`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 商品網格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
            >
              <Link href={`/products/${product.id}`}>
                {/* 圖片區 */}
                <div className="relative aspect-square bg-gray-50">
                  {/* 排名標誌 */}
                  <div className={`absolute top-2 left-2 z-10 ${getRankBadge(product.rank)} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md`}>
                    {product.rank}
                  </div>

                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* 願望清單按鈕 - 右上角 */}
                  <div className="absolute top-2 right-2 z-20">
                    <WishlistButton productId={product.id.toString()} size="sm" />
                  </div>

                  {/* 快速操作 */}
                  <div className="hidden md:block absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // TODO: 加入購物車功能
                        }}
                        className="bg-orange-500 text-white px-3 py-2 rounded-full hover:bg-orange-600 flex items-center gap-1 relative z-10"
                      >
                        <ShoppingCart size={16} />
                        <span className="text-xs">加入</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 商品信息 */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 text-sm min-h-[40px]">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="text-gray-500">已售 {product.sales}</span>
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-current" size={12} />
                      <span className="text-gray-600">{product.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-1">
                    <div className="flex flex-col">
                      <span className="text-red-500 font-bold text-base">${product.price}</span>
                      <span className="text-gray-400 text-xs line-through">${product.originalPrice}</span>
                    </div>
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}