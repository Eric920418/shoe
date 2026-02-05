'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import {
  Sparkles, TrendingUp, Star, ShoppingBag,
  Calendar, Award, Zap, Loader2
} from 'lucide-react'
import { ProductCardImage } from '@/components/common/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'
import { GET_NEW_ARRIVALS } from '@/src/graphql/queries'

interface ProductVariant {
  id: string
  color: string
  colorHex: string
  stock: number
  isActive: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  images: string[]
  totalStock: number
  soldCount: number
  viewCount: number
  averageRating?: number
  reviewCount: number
  isNewArrival: boolean
  createdAt: string
  category: {
    id: string
    name: string
    slug: string
  }
  variants: ProductVariant[]
}

export default function NewArrivalsPage() {
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 從資料庫獲取新品資料
  const { data, loading, error } = useQuery(GET_NEW_ARRIVALS, {
    variables: {
      take: 24,
      skip: 0,
    },
  })

  const products: Product[] = data?.products || []

  // 根據排序選項排序產品
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'popular':
        return b.soldCount - a.soldCount
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0)
      default:
        return 0
    }
  })

  // 計算產品的顏色數量
  const getColorCount = (product: Product) => {
    return product.variants?.filter(v => v.isActive).length || 0
  }

  // 獲取產品的第一張圖片
  const getProductImage = (product: Product) => {
    const images = Array.isArray(product.images) ? product.images : []
    return images[0] || '/api/placeholder/300/300'
  }

  // 計算上架時間標籤
  const getArrivalTag = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今日上架'
    if (diffDays === 1) return '昨日上架'
    if (diffDays <= 7) return '本週新品'
    if (diffDays <= 30) return '本月新品'
    return '新品上市'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '新品上市' }]} />
        </div>
      </div>

      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center">
            <Sparkles className="mx-auto mb-2 animate-pulse" size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">新品上市</h1>
            <p className="text-sm sm:text-base opacity-90">最新鞋款搶先看，品質保證</p>
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
              快速到貨
            </span>
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              7天無理由退換
            </span>
            <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full">
              <Calendar size={14} />
              持續更新
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 篩選區 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* 產品數量 */}
            <div className="text-sm text-gray-600">
              共 <span className="font-semibold text-purple-600">{products.length}</span> 件新品
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

        {/* Loading 狀態 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-600">載入中...</span>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">載入失敗</p>
            <p className="text-red-500 text-sm mt-1">{error.message}</p>
          </div>
        )}

        {/* 空狀態 */}
        {!loading && !error && products.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Sparkles className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-600 font-medium">目前沒有新品</p>
            <p className="text-gray-400 text-sm mt-1">敬請期待新品上架</p>
            <Link
              href="/products"
              className="inline-block mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              瀏覽所有商品
            </Link>
          </div>
        )}

        {/* 產品網格/列表 */}
        {!loading && !error && products.length > 0 && (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
            : "space-y-4"
          }>
            {sortedProducts.map((product) => (
              viewMode === 'grid' ? (
                // 網格視圖
                <div
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square bg-gray-100">
                      <ProductCardImage
                        src={getProductImage(product)}
                        alt={product.name}
                        hoverScale
                      />

                      {/* 標籤 */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                          NEW
                        </span>
                        <span className="bg-white/90 text-gray-700 px-2 py-0.5 rounded text-xs">
                          {getArrivalTag(product.createdAt)}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 z-20">
                        <WishlistButton productId={product.id} size="sm" />
                      </div>

                      {/* 多色提示 */}
                      {getColorCount(product) > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                          {getColorCount(product)} 色可選
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                        {product.name}
                      </h3>

                      {/* 分類標籤 */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                          {product.category.name}
                        </span>
                      </div>

                      {/* 評分 */}
                      {product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="text-yellow-400 fill-current" size={12} />
                          <span className="text-xs text-gray-600">
                            {product.averageRating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-xs text-gray-400">({product.reviewCount})</span>
                        </div>
                      )}

                      {/* 價格 */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-lg font-bold text-gray-800">
                            ${product.price.toLocaleString()}
                          </p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-xs text-gray-400 line-through">
                              ${product.originalPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
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
                  <Link href={`/products/${product.slug}`}>
                    <div className="flex gap-4">
                      <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <ProductCardImage
                          src={getProductImage(product)}
                          alt={product.name}
                          hoverScale={false}
                        />
                        <span className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                          NEW
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{getArrivalTag(product.createdAt)}</p>
                            <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                                {product.category.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              {product.reviewCount > 0 && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Star className="text-yellow-400 fill-current" size={14} />
                                    <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
                                  </div>
                                  <span className="text-gray-400">|</span>
                                  <span className="text-gray-600">{product.reviewCount} 則評價</span>
                                </>
                              )}
                              {getColorCount(product) > 1 && (
                                <>
                                  <span className="text-gray-400">|</span>
                                  <span className="text-gray-600">{getColorCount(product)} 色可選</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-800 mb-1">
                              ${product.price.toLocaleString()}
                            </p>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <p className="text-sm text-gray-400 line-through mb-2">
                                ${product.originalPrice.toLocaleString()}
                              </p>
                            )}
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
        )}
      </div>
    </div>
  )
}
