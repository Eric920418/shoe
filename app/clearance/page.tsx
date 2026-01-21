'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Tag, AlertTriangle,
  ShoppingCart, Clock, Zap, Loader2
} from 'lucide-react'
import { useQuery } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS } from '@/graphql/queries'
import { ProductCardImage } from '@/components/common/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'

interface ClearanceProduct {
  id: string
  slug: string
  name: string
  originalPrice: number
  clearancePrice: number
  discount: number
  image: string
  stock: number
  lowStock: boolean
  reason: string
  rating: number
  soldCount: number
}

export default function ClearancePage() {
  const [sortBy, setSortBy] = useState('discount')
  const [discountFilter, setDiscountFilter] = useState('all')

  // 查詢產品資料
  const { data, loading, error } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      take: 100, // 取多一點，再過濾有折扣的
    },
  })

  // 過濾並處理清倉產品（折扣 >= 30%）
  const clearanceProducts: ClearanceProduct[] = useMemo(() => {
    if (!data?.products) return []

    const filtered = data.products
      .filter((product: any) => {
        const price = parseFloat(product.price)
        const originalPrice = parseFloat(product.originalPrice) || price
        if (originalPrice <= price) return false

        const discount = Math.round((1 - price / originalPrice) * 100)

        // 只顯示折扣 >= 30% 的產品（清倉標準）
        if (discount < 30) return false

        // 根據折扣篩選
        if (discountFilter !== 'all') {
          const [minStr, maxStr] = discountFilter.split('-')
          const min = parseInt(minStr)
          const max = parseInt(maxStr)
          // 折扣範圍：例如 50-60 表示折扣 40%-50%（即打 5-6 折）
          const discountForFilter = 100 - discount // 轉換為「幾折」
          if (discountForFilter < min || discountForFilter > max) return false
        }

        return true
      })
      .map((product: any) => {
        const price = parseFloat(product.price)
        const originalPrice = parseFloat(product.originalPrice) || price
        const discount = Math.round((1 - price / originalPrice) * 100)
        const stock = product.stock || 0
        const soldCount = product.soldCount || 0
        const averageRating = product.averageRating ? parseFloat(product.averageRating) : 0
        const images = Array.isArray(product.images) ? product.images : []
        const image = images.length > 0 ? images[0] : '/api/placeholder/300/300'

        // 決定清倉原因標籤
        let reason = '清倉特賣'
        if (discount >= 70) reason = '最後出清'
        else if (discount >= 60) reason = '換季出清'
        else if (stock <= 5) reason = '斷碼特賣'
        else if (stock <= 10) reason = '庫存出清'
        else if (soldCount > 50) reason = '熱銷清倉'

        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          originalPrice,
          clearancePrice: price,
          discount,
          image,
          stock,
          lowStock: stock <= 10,
          reason,
          rating: averageRating,
          soldCount,
        }
      })

    // 排序
    switch (sortBy) {
      case 'discount':
        filtered.sort((a: ClearanceProduct, b: ClearanceProduct) => b.discount - a.discount)
        break
      case 'price-low':
        filtered.sort((a: ClearanceProduct, b: ClearanceProduct) => a.clearancePrice - b.clearancePrice)
        break
      case 'price-high':
        filtered.sort((a: ClearanceProduct, b: ClearanceProduct) => b.clearancePrice - a.clearancePrice)
        break
      case 'sales':
        filtered.sort((a: ClearanceProduct, b: ClearanceProduct) => b.soldCount - a.soldCount)
        break
    }

    return filtered
  }, [data, sortBy, discountFilter])

  // 計算統計數據
  const stats = useMemo(() => {
    if (clearanceProducts.length === 0) return { maxDiscount: 0, totalProducts: 0 }
    const maxDiscount = Math.max(...clearanceProducts.map(p => p.discount))
    return { maxDiscount, totalProducts: clearanceProducts.length }
  }, [clearanceProducts])

  const discountRanges = [
    { value: 'all', label: '全部折扣' },
    { value: '50-60', label: '5-6折' },
    { value: '40-50', label: '4-5折' },
    { value: '30-40', label: '3-4折' },
    { value: '0-30', label: '3折以下' }
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-medium">載入失敗</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex sm:flex-row items-center justify-between gap-3">
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
                <p className="text-2xl font-bold text-yellow-300">{stats.maxDiscount}%</p>
                <p className="text-xs opacity-90">最高折扣</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-300">{stats.totalProducts}</p>
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-green-500" size={40} />
          </div>
        ) : clearanceProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">目前沒有清倉商品</p>
            <Link href="/products" className="text-green-500 hover:underline mt-2 inline-block">
              瀏覽所有商品
            </Link>
          </div>
        ) : (
          /* 產品網格 */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {clearanceProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square bg-gray-100">
                    <ProductCardImage
                      src={product.image}
                      alt={product.name}
                      hoverScale
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
                    {product.lowStock && (
                      <div className="absolute bottom-2 left-2 right-2 bg-red-600 text-white text-xs py-1 px-2 rounded animate-pulse text-center">
                        <AlertTriangle size={12} className="inline mr-1" />
                        {product.stock <= 5 ? '最後庫存' : `僅剩 ${product.stock} 件`}
                      </div>
                    )}

                    {/* 願望清單按鈕 */}
                    <div className="absolute top-12 right-2 z-20">
                      <WishlistButton productId={product.id} size="sm" />
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                      {product.name}
                    </h3>

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
        )}

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
