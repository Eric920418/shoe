'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery, gql } from '@apollo/client'
import {
  Clock, Flame, Filter, Star, TrendingUp,
  ChevronDown, ShoppingCart, Heart, Zap, Timer
} from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'
import QuickAddToCartModal from '@/components/product/QuickAddToCartModal'

// GraphQL 查詢
const GET_FLASH_SALE = gql`
  query GetActiveFlashSale {
    activeFlashSale {
      id
      name
      startTime
      endTime
      bgColor
      products
      maxProducts
    }
  }
`

const GET_PRODUCTS = gql`
  query GetProducts($take: Int) {
    products(take: $take) {
      id
      name
      slug
      price
      originalPrice
      images
      stock
      soldCount
      averageRating
      reviewCount
      category {
        id
        name
      }
    }
  }
`

export default function FlashSalePage() {
  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [quickAddProduct, setQuickAddProduct] = useState<{ id: string; name: string } | null>(null)

  // 查詢限時搶購設定
  const { data: flashSaleData } = useQuery(GET_FLASH_SALE, {
    fetchPolicy: 'cache-and-network',
  })

  const flashSaleConfig = flashSaleData?.activeFlashSale

  // 解析 products JSON
  const productsConfig = React.useMemo(() => {
    if (!flashSaleConfig?.products) return null
    try {
      return typeof flashSaleConfig.products === 'string'
        ? JSON.parse(flashSaleConfig.products)
        : flashSaleConfig.products
    } catch {
      return null
    }
  }, [flashSaleConfig])

  // 查詢產品資料
  const { data: productsData, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      take: 50, // 獲取足夠多的產品以便篩選
    },
  })

  // 倒計時邏輯
  useEffect(() => {
    if (!flashSaleConfig?.endTime) {
      setTimeLeft({ hours: 2, minutes: 30, seconds: 45 })
      return
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime()
      const endTime = new Date(flashSaleConfig.endTime).getTime()
      const difference = endTime - now

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft({ hours, minutes, seconds })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateTimeLeft()
    const timer = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [flashSaleConfig])

  // 處理產品資料
  const products = React.useMemo(() => {
    if (!productsData?.products) return []

    let productsToShow = []
    const productIds = productsConfig?.productIds || []
    const globalDiscount = productsConfig?.discountPercentage

    // 如果後台指定了產品ID，只顯示這些產品
    if (productIds && productIds.length > 0) {
      productsToShow = productsData.products.filter((p: any) => productIds.includes(p.id))
    } else {
      // 如果沒有指定產品，顯示所有有折扣的產品
      productsToShow = productsData.products
        .filter((p: any) => p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price))
    }

    return productsToShow.map((product: any) => {
      const price = parseFloat(product.price)
      const originalPrice = parseFloat(product.originalPrice) || price

      // 如果有全局折扣設定，使用它；否則計算實際折扣
      let discount = globalDiscount
      if (!discount) {
        discount = originalPrice > price
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : 0
      }

      const images = Array.isArray(product.images) ? product.images : []
      const image = images.length > 0 ? images[0] : '/api/placeholder/300/300'

      // 根據庫存決定標籤
      let tag = ''
      if (product.stock <= 5) {
        tag = `僅剩${product.stock}雙`
      } else if (product.stock <= 10) {
        tag = '即將售罄'
      } else if (product.soldCount > 500) {
        tag = '爆款'
      } else if (product.soldCount > 200) {
        tag = '熱銷'
      }

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        originalPrice,
        salePrice: price,
        image,
        sold: product.soldCount || 0,
        stock: product.stock || 0,
        rating: product.averageRating || 4.5,
        reviews: product.reviewCount || 0,
        tag,
        discount,
        category: product.category?.name || '運動鞋'
      }
    })
  }, [productsData, productsConfig])

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
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '限時搶購' }]} />
        </div>
      </div>

      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Flame className="text-yellow-300 animate-pulse" size={28} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  {flashSaleConfig?.name || '限時搶購'}
                </h1>
                <p className="text-xs sm:text-sm opacity-90">
                  {productsConfig?.description || '全場最低3折起，售完為止'}
                </p>
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

        {/* Loading 狀態 */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">載入中...</p>
            </div>
          </div>
        )}

        {/* Error 狀態 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">載入失敗：{error.message}</p>
          </div>
        )}

        {/* 沒有產品 */}
        {!loading && !error && products.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Flame className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600 text-lg">目前沒有限時搶購商品</p>
            <p className="text-gray-500 text-sm mt-2">請稍後再回來查看</p>
          </div>
        )}

        {/* 產品網格 */}
        {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          {products.map((product: { id: string; slug: string; name: string; originalPrice: number; salePrice: number; image: string; sold: number; stock: number; rating: number; reviews: number; tag: string; discount: number; category: string }) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
            >
              <Link href={`/products/${product.slug}`}>
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

                  {/* 願望清單按鈕 */}
                  <div className="absolute top-2 right-2 z-20">
                    <WishlistButton productId={product.id} size="sm" />
                  </div>

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
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setQuickAddProduct({ id: product.id, name: product.name })
                      }}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:shadow-md transition-shadow relative z-10"
                    >
                      搶購
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* 快速加入購物車 Modal */}
      {quickAddProduct && (
        <QuickAddToCartModal
          productId={quickAddProduct.id}
          productName={quickAddProduct.name}
          onClose={() => setQuickAddProduct(null)}
        />
      )}
    </div>
  )
}