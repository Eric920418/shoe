'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sparkles, TrendingUp, Star, Heart, ShoppingBag,
  Calendar, ChevronDown, Filter, Award, Zap
} from 'lucide-react'

export default function NewArrivalsPage() {
  const [sortBy, setSortBy] = useState('newest')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 模擬新品數據
  const newProducts = [
    {
      id: 1,
      name: 'Nike Air Zoom Pegasus 40',
      brand: 'Nike',
      price: 3990,
      image: '/api/placeholder/300/300',
      arrivalDate: '2024秋季新款',
      rating: 4.9,
      reviews: 45,
      colors: 5,
      tag: 'NEW',
      features: ['透氣網面', '緩震科技']
    },
    {
      id: 2,
      name: 'Adidas Forum Low',
      brand: 'Adidas',
      price: 3290,
      image: '/api/placeholder/300/300',
      arrivalDate: '本週新品',
      rating: 4.8,
      reviews: 23,
      colors: 3,
      tag: 'HOT',
      features: ['復古設計', '皮革材質']
    },
    {
      id: 3,
      name: 'New Balance 9060',
      brand: 'New Balance',
      price: 4590,
      image: '/api/placeholder/300/300',
      arrivalDate: '限量發售',
      rating: 5.0,
      reviews: 12,
      colors: 4,
      tag: '限量',
      features: ['ABZORB緩震', 'Y2K風格']
    },
    {
      id: 4,
      name: 'Puma Suede XL',
      brand: 'Puma',
      price: 2790,
      image: '/api/placeholder/300/300',
      arrivalDate: '今日上架',
      rating: 4.7,
      reviews: 8,
      colors: 6,
      tag: '首發',
      features: ['加厚鞋底', '麂皮材質']
    },
    {
      id: 5,
      name: 'Converse Run Star Hike',
      brand: 'Converse',
      price: 3490,
      image: '/api/placeholder/300/300',
      arrivalDate: '預購中',
      rating: 4.8,
      reviews: 67,
      colors: 2,
      tag: '預購',
      features: ['厚底設計', '鋸齒鞋底']
    },
    {
      id: 6,
      name: 'Vans Knu Skool',
      brand: 'Vans',
      price: 2990,
      image: '/api/placeholder/300/300',
      arrivalDate: '明日發售',
      rating: 4.6,
      reviews: 5,
      colors: 8,
      tag: '即將發售',
      features: ['加大鞋舌', '3D立體設計']
    }
  ]

  const brands = ['all', 'Nike', 'Adidas', 'New Balance', 'Puma', 'Converse', 'Vans']
  const sizes = ['all', '36', '37', '38', '39', '40', '41', '42', '43', '44']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center">
            <Sparkles className="mx-auto mb-2 animate-pulse" size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">2024 秋冬新品</h1>
            <p className="text-sm sm:text-base opacity-90">潮流新品搶先看，首購享85折優惠</p>
          </div>
        </div>
      </div>

      {/* 特色標籤 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-3 py-1 rounded-full">
              <Award size={14} />
              品牌授權
            </span>
            <span className="flex items-center gap-1 bg-pink-50 text-pink-600 px-3 py-1 rounded-full">
              <Zap size={14} />
              48小時快速到貨
            </span>
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              7天無理由退換
            </span>
            <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full">
              <Calendar size={14} />
              每週二新品上架
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 篩選區 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 品牌篩選 */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">品牌</p>
              <div className="flex flex-wrap gap-2">
                {brands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedBrand === brand
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {brand === 'all' ? '全部品牌' : brand}
                  </button>
                ))}
              </div>
            </div>

            {/* 尺碼篩選 */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">尺碼</p>
              <div className="flex flex-wrap gap-2">
                {sizes.slice(0, 6).map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-8 rounded text-sm transition-colors ${
                      selectedSize === size
                        ? 'bg-purple-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:border-purple-500'
                    }`}
                  >
                    {size === 'all' ? '全部' : size}
                  </button>
                ))}
                <button className="text-sm text-purple-500 hover:text-purple-600">
                  更多 →
                </button>
              </div>
            </div>

            {/* 排序和視圖切換 */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="newest">最新上架</option>
                <option value="popular">人氣推薦</option>
                <option value="price-low">價格低到高</option>
                <option value="price-high">價格高到低</option>
                <option value="rating">評價最高</option>
              </select>

              <div className="flex rounded-lg border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 產品網格/列表 */}
        <div className={viewMode === 'grid'
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
          : "space-y-4"
        }>
          {newProducts.map((product) => (
            viewMode === 'grid' ? (
              // 網格視圖
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
                      {product.tag === 'NEW' && (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                          NEW
                        </span>
                      )}
                      {product.tag === '限量' && (
                        <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-bold">
                          限量
                        </span>
                      )}
                      {product.tag === '預購' && (
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
                          預購
                        </span>
                      )}
                      <span className="bg-white/90 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {product.arrivalDate}
                      </span>
                    </div>

                    <button className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white transition-colors">
                      <Heart size={16} className="text-gray-600" />
                    </button>

                    {/* 多色提示 */}
                    {product.colors > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                        {product.colors} 色可選
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                      {product.name}
                    </h3>

                    {/* 特色標籤 */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.features.map((feature, idx) => (
                        <span key={idx} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* 評分 */}
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="text-yellow-400 fill-current" size={12} />
                      <span className="text-xs text-gray-600">{product.rating}</span>
                      <span className="text-xs text-gray-400">({product.reviews})</span>
                    </div>

                    {/* 價格 */}
                    <div className="flex items-end justify-between">
                      <p className="text-lg font-bold text-gray-800">
                        ${product.price}
                      </p>
                      <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                        <ShoppingBag size={14} className="inline mr-1" />
                        選購
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ) : (
              // 列表視圖
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                <Link href={`/products/${product.id}`}>
                  <div className="flex gap-4">
                    <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.tag === 'NEW' && (
                        <span className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                          NEW
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{product.brand} · {product.arrivalDate}</p>
                          <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {product.features.map((feature, idx) => (
                              <span key={idx} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="text-yellow-400 fill-current" size={14} />
                              <span>{product.rating}</span>
                            </div>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600">{product.reviews} 則評價</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600">{product.colors} 色可選</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-800 mb-2">${product.price}</p>
                          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                            加入購物車
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          ))}
        </div>

        {/* 載入更多 */}
        <div className="flex justify-center mt-8">
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
            載入更多新品
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}