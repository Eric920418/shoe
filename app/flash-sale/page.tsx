'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Clock, Flame, Filter, Star, TrendingUp,
  ChevronDown, ShoppingCart, Heart, Zap, Timer
} from 'lucide-react'

export default function FlashSalePage() {
  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 30, seconds: 45 })
  const [showFilters, setShowFilters] = useState(false)

  // 倒計時邏輯
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 模擬產品數據
  const products = [
    {
      id: 1,
      name: 'Nike Air Max 270 React',
      originalPrice: 4990,
      salePrice: 1990,
      image: '/api/placeholder/300/300',
      sold: 856,
      stock: 20,
      rating: 4.8,
      reviews: 1256,
      tag: '爆款',
      discount: 60
    },
    {
      id: 2,
      name: 'Adidas Ultraboost 21',
      originalPrice: 5990,
      salePrice: 2490,
      image: '/api/placeholder/300/300',
      sold: 623,
      stock: 15,
      rating: 4.9,
      reviews: 892,
      tag: '熱銷',
      discount: 58
    },
    {
      id: 3,
      name: 'New Balance 574',
      originalPrice: 3290,
      salePrice: 1290,
      image: '/api/placeholder/300/300',
      sold: 1203,
      stock: 8,
      rating: 4.7,
      reviews: 2031,
      tag: '即將售罄',
      discount: 61
    },
    {
      id: 4,
      name: 'Puma RS-X³',
      originalPrice: 3590,
      salePrice: 1490,
      image: '/api/placeholder/300/300',
      sold: 432,
      stock: 35,
      rating: 4.6,
      reviews: 567,
      tag: '新品',
      discount: 59
    },
    {
      id: 5,
      name: 'Converse Chuck 70',
      originalPrice: 2990,
      salePrice: 990,
      image: '/api/placeholder/300/300',
      sold: 2156,
      stock: 5,
      rating: 4.8,
      reviews: 3421,
      tag: '僅剩5雙',
      discount: 67
    },
    {
      id: 6,
      name: 'Vans Old Skool',
      originalPrice: 2490,
      salePrice: 890,
      image: '/api/placeholder/300/300',
      sold: 1823,
      stock: 12,
      rating: 4.7,
      reviews: 1923,
      tag: '超值',
      discount: 64
    }
  ]

  const categories = [
    { value: 'all', label: '全部商品' },
    { value: 'sports', label: '運動鞋' },
    { value: 'casual', label: '休閒鞋' },
    { value: 'running', label: '跑步鞋' },
    { value: 'basketball', label: '籃球鞋' }
  ]

  const priceRanges = [
    { value: 'all', label: '全部價格' },
    { value: '0-999', label: '$999以下' },
    { value: '1000-1999', label: '$1000-$1999' },
    { value: '2000-2999', label: '$2000-$2999' },
    { value: '3000+', label: '$3000以上' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Flame className="text-yellow-300 animate-pulse" size={28} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">限時搶購</h1>
                <p className="text-xs sm:text-sm opacity-90">全場最低3折起，售完為止</p>
              </div>
            </div>

            {/* 倒計時 */}
            <div className="flex items-center gap-2">
              <Timer className="text-yellow-300" size={20} />
              <span className="text-sm font-medium">距離結束</span>
              <div className="flex gap-1">
                <div className="bg-black/30 px-2 py-1 rounded">
                  <span className="text-lg font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                </div>
                <span className="text-lg font-bold">:</span>
                <div className="bg-black/30 px-2 py-1 rounded">
                  <span className="text-lg font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                </div>
                <span className="text-lg font-bold">:</span>
                <div className="bg-black/30 px-2 py-1 rounded">
                  <span className="text-lg font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 促銷標語 */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center justify-center gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <Zap className="text-orange-500" size={16} />
              <span className="text-gray-700">滿$999免運</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="text-green-500" size={16} />
              <span className="text-gray-700">買2件額外95折</span>
            </span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1">
              <Clock className="text-blue-500" size={16} />
              <span className="text-gray-700">每日10點更新</span>
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 篩選和排序 */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* 分類篩選 */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 ml-auto">
              {/* 價格範圍 */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              {/* 排序 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="popular">熱門優先</option>
                <option value="sales">銷量優先</option>
                <option value="price-low">價格低到高</option>
                <option value="price-high">價格高到低</option>
                <option value="discount">折扣最多</option>
              </select>
            </div>
          </div>
        </div>

        {/* 產品網格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
            >
              <Link href={`/products/${product.id}`}>
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* 標籤 */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      限時{product.discount}%OFF
                    </span>
                    {product.tag === '即將售罄' && (
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">
                        {product.tag}
                      </span>
                    )}
                    {product.tag === '僅剩5雙' && (
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs animate-pulse">
                        {product.tag}
                      </span>
                    )}
                  </div>

                  {/* 收藏按鈕 */}
                  <button className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white transition-colors">
                    <Heart size={16} className="text-gray-600" />
                  </button>

                  {/* 搶購進度 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-2">
                    <div className="flex items-center justify-between text-white text-xs mb-1">
                      <span>已搶 {product.sold} 件</span>
                      <span>剩餘 {product.stock} 件</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                        style={{ width: `${(product.sold / (product.sold + product.stock)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>

                  {/* 評分和銷量 */}
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-0.5">
                      <Star className="text-yellow-400 fill-current" size={12} />
                      <span className="text-gray-600">{product.rating}</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">已售 {product.sold}</span>
                  </div>

                  {/* 價格 */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 line-through">
                        ${product.originalPrice}
                      </p>
                      <p className="text-lg font-bold text-red-500">
                        ${product.salePrice}
                      </p>
                    </div>
                    <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:shadow-md transition-shadow">
                      搶購
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* 查看更多 */}
        <div className="flex justify-center mt-8">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
            查看更多商品
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}