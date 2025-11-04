'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Tag, Percent, AlertTriangle, TrendingDown,
  Filter, ShoppingCart, Heart, Clock, Zap
} from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'

export default function ClearancePage() {
  const [sortBy, setSortBy] = useState('discount')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [discountFilter, setDiscountFilter] = useState('all')

  // 清倉產品數據
  const clearanceProducts = [
    {
      id: 1,
      name: 'Nike Air Max 90 Essential',
      originalPrice: 4290,
      clearancePrice: 1290,
      discount: 70,
      image: '/api/placeholder/300/300',
      sizes: ['40', '41', '42'],
      lastStock: true,
      reason: '換季出清',
      rating: 4.7,
      sold: 892
    },
    {
      id: 2,
      name: 'Adidas Superstar Foundation',
      originalPrice: 3590,
      clearancePrice: 899,
      discount: 75,
      image: '/api/placeholder/300/300',
      sizes: ['38', '39'],
      lastStock: true,
      reason: '斷碼特賣',
      rating: 4.8,
      sold: 1567
    },
    {
      id: 3,
      name: 'New Balance 997H',
      originalPrice: 3990,
      clearancePrice: 1590,
      discount: 60,
      image: '/api/placeholder/300/300',
      sizes: ['41', '42', '43'],
      lastStock: false,
      reason: '庫存出清',
      rating: 4.6,
      sold: 623
    },
    {
      id: 4,
      name: 'Puma Future Rider',
      originalPrice: 2990,
      clearancePrice: 749,
      discount: 75,
      image: '/api/placeholder/300/300',
      sizes: ['39', '40'],
      lastStock: true,
      reason: '展示品特賣',
      rating: 4.5,
      sold: 234
    },
    {
      id: 5,
      name: 'Converse Chuck Taylor All Star',
      originalPrice: 2290,
      clearancePrice: 690,
      discount: 70,
      image: '/api/placeholder/300/300',
      sizes: ['37', '38', '44'],
      lastStock: false,
      reason: '過季商品',
      rating: 4.7,
      sold: 2134
    },
    {
      id: 6,
      name: 'Vans Authentic',
      originalPrice: 2190,
      clearancePrice: 549,
      discount: 75,
      image: '/api/placeholder/300/300',
      sizes: ['36', '45'],
      lastStock: true,
      reason: '最後出清',
      rating: 4.6,
      sold: 1823
    },
    {
      id: 7,
      name: 'Reebok Classic Leather',
      originalPrice: 2790,
      clearancePrice: 990,
      discount: 65,
      image: '/api/placeholder/300/300',
      sizes: ['40', '41', '42', '43'],
      lastStock: false,
      reason: '年終清倉',
      rating: 4.5,
      sold: 456
    },
    {
      id: 8,
      name: 'Fila Disruptor II',
      originalPrice: 3190,
      clearancePrice: 890,
      discount: 72,
      image: '/api/placeholder/300/300',
      sizes: ['38', '39', '40'],
      lastStock: true,
      reason: '停產清貨',
      rating: 4.4,
      sold: 789
    }
  ]

  const discountRanges = [
    { value: 'all', label: '全部折扣' },
    { value: '50-60', label: '5-6折' },
    { value: '40-50', label: '4-5折' },
    { value: '30-40', label: '3-4折' },
    { value: '0-30', label: '3折以下' }
  ]

  const sizes = ['all', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Tag className="text-yellow-300" size={32} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded animate-pulse">
                  SALE
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">清倉大特價</h1>
                <p className="text-xs sm:text-sm opacity-90">換季出清 · 最低3折起</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-300">70%</p>
                <p className="text-xs opacity-90">最高折扣</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-300">888</p>
                <p className="text-xs opacity-90">清倉商品</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 警告提示 */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-yellow-800">
            <AlertTriangle size={16} />
            <span>清倉商品售完不補貨，尺碼有限，請盡快選購</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 篩選區 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 折扣範圍 */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2 font-medium">折扣範圍</p>
              <div className="flex flex-wrap gap-2">
                {discountRanges.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setDiscountFilter(range.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      discountFilter === range.value
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 尺碼篩選 */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2 font-medium">尺碼</p>
              <div className="flex flex-wrap gap-2">
                {sizes.slice(0, 8).map(size => (
                  <button
                    key={size}
                    onClick={() => setSizeFilter(size)}
                    className={`w-12 h-8 rounded text-sm transition-colors ${
                      sizeFilter === size
                        ? 'bg-green-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:border-green-500'
                    }`}
                  >
                    {size === 'all' ? '全部' : size}
                  </button>
                ))}
                <button className="text-sm text-green-500 hover:text-green-600">
                  更多 →
                </button>
              </div>
            </div>

            {/* 排序 */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">排序</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                <option value="discount">折扣最多</option>
                <option value="price-low">價格低到高</option>
                <option value="price-high">價格高到低</option>
                <option value="sales">銷量優先</option>
              </select>
            </div>
          </div>
        </div>

        {/* 產品網格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {clearanceProducts.map((product) => (
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

                  {/* 折扣標籤 */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-orange-600 text-white p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">{product.discount}% OFF</span>
                      <span className="text-xs bg-black/20 px-2 py-0.5 rounded">
                        {product.reason}
                      </span>
                    </div>
                  </div>

                  {/* 最後庫存警告 */}
                  {product.lastStock && (
                    <div className="absolute bottom-2 left-2 right-2 bg-red-600 text-white text-xs py-1 px-2 rounded animate-pulse text-center">
                      <AlertTriangle size={12} className="inline mr-1" />
                      最後庫存
                    </div>
                  )}

                  {/* 願望清單按鈕 */}
                  <div className="absolute top-2 right-2 z-20">
                    <WishlistButton productId={product.id.toString()} size="sm" />
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>

                  {/* 可選尺碼 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.sizes.slice(0, 3).map(size => (
                      <span key={size} className="text-[10px] border border-gray-300 px-1.5 py-0.5 rounded">
                        {size}
                      </span>
                    ))}
                    {product.sizes.length > 3 && (
                      <span className="text-[10px] text-gray-500">
                        +{product.sizes.length - 3}
                      </span>
                    )}
                  </div>

                  {/* 銷量 */}
                  <p className="text-xs text-gray-500 mb-2">已售 {product.sold} 件</p>

                  {/* 價格 */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 line-through">
                        ${product.originalPrice}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        ${product.clearancePrice}
                      </p>
                    </div>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                      <ShoppingCart size={12} />
                      搶購
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Zap className="text-yellow-500" />
                清倉規則說明
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 清倉商品售完即止，不接受預訂</li>
                <li>• 部分商品為展示品或庫存品，介意者請謹慎選購</li>
                <li>• 清倉商品同樣享有7天無理由退換服務</li>
                <li>• 可與其他優惠券疊加使用</li>
              </ul>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
              <Clock className="mx-auto text-green-500 mb-2" size={32} />
              <p className="text-sm text-gray-600 mb-1">每週四</p>
              <p className="font-bold text-green-600">上新清倉品</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}