'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Shield, Award, Star, Verified, TrendingUp,
  ChevronRight, Sparkles, BadgeCheck, Globe
} from 'lucide-react'

export default function BrandsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 品牌數據
  const brands = [
    {
      id: 'nike',
      name: 'Nike',
      logo: '/api/placeholder/120/60',
      description: '全球領先運動品牌',
      productCount: 856,
      discount: '最高5折',
      tag: '官方授權',
      followers: '12.5萬',
      rating: 4.9,
      bgColor: 'from-gray-900 to-gray-700'
    },
    {
      id: 'adidas',
      name: 'Adidas',
      logo: '/api/placeholder/120/60',
      description: '三條線運動時尚',
      productCount: 723,
      discount: '最高6折',
      tag: '品牌日',
      followers: '10.3萬',
      rating: 4.8,
      bgColor: 'from-black to-gray-800'
    },
    {
      id: 'newbalance',
      name: 'New Balance',
      logo: '/api/placeholder/120/60',
      description: '復古運動潮流',
      productCount: 542,
      discount: '最高4折',
      tag: '新品上市',
      followers: '8.7萬',
      rating: 4.8,
      bgColor: 'from-red-600 to-red-800'
    },
    {
      id: 'puma',
      name: 'Puma',
      logo: '/api/placeholder/120/60',
      description: '運動與潮流結合',
      productCount: 435,
      discount: '最高7折',
      tag: '限時特賣',
      followers: '6.2萬',
      rating: 4.7,
      bgColor: 'from-black to-red-900'
    },
    {
      id: 'converse',
      name: 'Converse',
      logo: '/api/placeholder/120/60',
      description: '經典帆布鞋',
      productCount: 328,
      discount: '最高5折',
      tag: '熱銷中',
      followers: '7.8萬',
      rating: 4.7,
      bgColor: 'from-gray-800 to-black'
    },
    {
      id: 'vans',
      name: 'Vans',
      logo: '/api/placeholder/120/60',
      description: '滑板文化代表',
      productCount: 267,
      discount: '最高6折',
      tag: '街頭潮流',
      followers: '5.4萬',
      rating: 4.6,
      bgColor: 'from-red-700 to-black'
    }
  ]

  // 熱門品牌產品
  const featuredProducts = [
    {
      id: 1,
      brand: 'Nike',
      name: 'Air Jordan 1 Retro',
      price: 4990,
      originalPrice: 6990,
      image: '/api/placeholder/200/200',
      sales: 1234
    },
    {
      id: 2,
      brand: 'Adidas',
      name: 'Yeezy Boost 350',
      price: 7990,
      originalPrice: 9990,
      image: '/api/placeholder/200/200',
      sales: 892
    },
    {
      id: 3,
      brand: 'New Balance',
      name: '550 White Green',
      price: 3490,
      originalPrice: 4490,
      image: '/api/placeholder/200/200',
      sales: 2156
    },
    {
      id: 4,
      brand: 'Converse',
      name: 'Chuck 70 High',
      price: 2290,
      originalPrice: 2990,
      image: '/api/placeholder/200/200',
      sales: 3421
    }
  ]

  const categories = [
    { value: 'all', label: '全部品牌' },
    { value: 'sports', label: '運動品牌' },
    { value: 'fashion', label: '潮流品牌' },
    { value: 'classic', label: '經典品牌' },
    { value: 'luxury', label: '精品品牌' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="animate-pulse" size={28} />
              <h1 className="text-2xl sm:text-3xl font-bold">品牌特賣館</h1>
              <Shield className="animate-pulse" size={28} />
            </div>
            <p className="text-sm sm:text-base opacity-90 mb-4">正品保證 · 官方授權 · 假一賠十</p>

            {/* 品牌保證標籤 */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <BadgeCheck size={16} />
                100%正品
              </span>
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Globe size={16} />
                全球直送
              </span>
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Verified size={16} />
                品牌授權
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 搜索和篩選 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜尋品牌名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 分類篩選 */}
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 品牌網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
            >
              {/* 品牌頭部 */}
              <div className={`h-32 bg-gradient-to-r ${brand.bgColor} p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex items-center justify-between h-full">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{brand.name}</h3>
                    <p className="text-white/80 text-sm">{brand.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs font-bold">
                        {brand.discount}
                      </span>
                      <span className="bg-white/20 backdrop-blur text-white px-2 py-0.5 rounded text-xs">
                        {brand.tag}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 h-12 bg-white/10 rounded flex items-center justify-center">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={80}
                      height={40}
                      className="opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>

                {/* 裝飾元素 */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
              </div>

              {/* 品牌信息 */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="text-blue-500" size={16} />
                    <span className="text-sm text-gray-600">官方旗艦店</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 fill-current" size={14} />
                    <span className="text-sm font-medium">{brand.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">商品</p>
                    <p className="font-bold text-gray-800">{brand.productCount}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">粉絲</p>
                    <p className="font-bold text-gray-800">{brand.followers}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">評分</p>
                    <p className="font-bold text-gray-800">{brand.rating}</p>
                  </div>
                </div>

                <button className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  進入品牌館
                  <ChevronRight size={16} />
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* 熱門產品推薦 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-yellow-500" />
              品牌爆款推薦
            </h2>
            <Link href="/products" className="text-blue-500 hover:text-blue-600 text-sm">
              查看更多 →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-square bg-white">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    {product.brand}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 line-through">
                        ${product.originalPrice}
                      </p>
                      <p className="text-lg font-bold text-red-500">
                        ${product.price}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      已售 {product.sales}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 品牌保證說明 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">品牌保證承諾</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="text-blue-600" size={24} />
              </div>
              <p className="text-sm font-medium text-gray-800">正品保證</p>
              <p className="text-xs text-gray-600 mt-1">100%品牌正品</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <BadgeCheck className="text-green-600" size={24} />
              </div>
              <p className="text-sm font-medium text-gray-800">官方授權</p>
              <p className="text-xs text-gray-600 mt-1">品牌官方授權</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="text-purple-600" size={24} />
              </div>
              <p className="text-sm font-medium text-gray-800">品質保障</p>
              <p className="text-xs text-gray-600 mt-1">嚴格品質控管</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <p className="text-sm font-medium text-gray-800">售後無憂</p>
              <p className="text-xs text-gray-600 mt-1">7天無理由退換</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}