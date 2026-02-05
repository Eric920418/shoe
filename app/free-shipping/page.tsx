'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { Truck, Package, Star, ShoppingCart, Loader2, Crown, Gift, Shield } from 'lucide-react'
import { ProductCardImage } from '@/components/common/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'
import { GET_HOMEPAGE_PRODUCTS } from '@/graphql/queries'
import { gql } from '@apollo/client'

// 會員等級查詢
const GET_MEMBERSHIP_TIERS = gql`
  query GetMembershipTiers {
    membershipTiers {
      id
      name
      slug
      freeShippingThreshold
      color
      icon
      sortOrder
    }
  }
`

interface MembershipTier {
  id: string
  name: string
  slug: string
  freeShippingThreshold: string
  color: string | null
  icon: string | null
  sortOrder: number
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  images: string[]
  stock: number
  soldCount: number
  viewCount: number
  averageRating?: number
  reviewCount: number
  category: {
    id: string
    name: string
  }
}

export default function FreeShippingPage() {
  const [sortBy, setSortBy] = useState('popular')

  // 獲取產品資料
  const { data: productsData, loading: productsLoading, error: productsError } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      take: 24,
      skip: 0,
    },
  })

  // 獲取會員等級資料
  const { data: tiersData, loading: tiersLoading } = useQuery(GET_MEMBERSHIP_TIERS)

  const products: Product[] = productsData?.products || []
  const membershipTiers: MembershipTier[] = tiersData?.membershipTiers || []

  // 根據排序選項排序產品
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.soldCount - a.soldCount
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0)
      case 'newest':
        return 0 // 保持原本順序（預設 createdAt desc）
      default:
        return 0
    }
  })

  // 獲取產品的第一張圖片
  const getProductImage = (product: Product) => {
    const images = Array.isArray(product.images) ? product.images : []
    return images[0] || '/api/placeholder/300/300'
  }

  // 計算折扣百分比
  const getDiscountPercent = (product: Product) => {
    if (!product.originalPrice || product.originalPrice <= product.price) return 0
    return Math.round((1 - product.price / product.originalPrice) * 100)
  }

  const loading = productsLoading || tiersLoading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '免運專區' }]} />
        </div>
      </div>

      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Truck className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">免運費專區</h1>
            <p className="opacity-90">會員滿額即享免運，輕鬆購物無負擔</p>
          </div>
        </div>
      </div>

      {/* 免運規則說明 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">會員免運門檻</h2>
            <p className="text-sm text-gray-500">超商取貨運費 $49，達到門檻即可免運</p>
          </div>

          {/* 會員等級免運門檻列表 */}
          {membershipTiers.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto">
              {membershipTiers
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((tier) => {
                  const threshold = parseFloat(tier.freeShippingThreshold)
                  return (
                    <div
                      key={tier.id}
                      className="bg-gray-50 rounded-lg p-3 text-center border"
                      style={{ borderColor: tier.color || '#e5e7eb' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                        style={{ backgroundColor: tier.color || '#9ca3af' }}
                      >
                        <Crown size={16} className="text-white" />
                      </div>
                      <p className="font-medium text-gray-800 text-sm">{tier.name}</p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: tier.color || '#10b981' }}
                      >
                        {threshold === 0 ? '全免運' : `滿 $${threshold.toLocaleString()}`}
                      </p>
                    </div>
                  )
                })}
            </div>
          )}

          {/* 免運說明標籤 */}
          <div className="flex items-center justify-center gap-6 text-sm flex-wrap mt-6 pt-4 border-t">
            <span className="flex items-center gap-2">
              <Package size={16} className="text-green-500" />
              會員滿額即享免運
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">
              <Truck size={16} className="text-blue-500" />
              超商取貨 2-3 天到貨
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">
              <Shield size={16} className="text-purple-500" />
              7 天鑑賞期
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">
              <Gift size={16} className="text-pink-500" />
              加入會員享優惠
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 篩選排序區 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              共 <span className="font-semibold text-green-600">{products.length}</span> 件商品
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="popular">人氣推薦</option>
                <option value="newest">最新上架</option>
                <option value="price-low">價格低到高</option>
                <option value="price-high">價格高到低</option>
                <option value="rating">評價最高</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading 狀態 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <span className="ml-2 text-gray-600">載入中...</span>
          </div>
        )}

        {/* 錯誤狀態 */}
        {productsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">載入失敗</p>
            <p className="text-red-500 text-sm mt-1">{productsError.message}</p>
          </div>
        )}

        {/* 空狀態 */}
        {!loading && !productsError && products.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Truck className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-600 font-medium">目前沒有商品</p>
            <p className="text-gray-400 text-sm mt-1">敬請期待新品上架</p>
            <Link
              href="/products"
              className="inline-block mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              瀏覽所有商品
            </Link>
          </div>
        )}

        {/* 產品網格 */}
        {!loading && !productsError && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square bg-gray-100">
                    <ProductCardImage
                      src={getProductImage(product)}
                      alt={product.name}
                      hoverScale
                    />
                    {/* 免運標籤 */}
                    <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      <Truck size={12} />
                      滿額免運
                    </span>

                    {/* 折扣標籤 */}
                    {getDiscountPercent(product) > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                        -{getDiscountPercent(product)}%
                      </span>
                    )}

                    {/* 願望清單按鈕 */}
                    <div className="absolute bottom-2 right-2 z-20">
                      <WishlistButton productId={product.id} size="sm" />
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">{product.name}</h3>

                    {/* 分類標籤 */}
                    <div className="mb-2">
                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
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
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-xs text-gray-400 line-through">
                            ${product.originalPrice.toLocaleString()}
                          </p>
                        )}
                        <p className="text-lg font-bold text-green-600">
                          ${product.price.toLocaleString()}
                        </p>
                      </div>
                      <button className="bg-green-500 hover:bg-green-600 text-white p-2 rounded transition-colors">
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* 底部說明 */}
        <div className="mt-8 bg-green-50 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-green-800 mb-2">如何享有免運優惠？</h3>
          <ol className="text-sm text-green-700 space-y-1">
            <li>1. 註冊或登入會員帳號</li>
            <li>2. 將喜歡的商品加入購物車</li>
            <li>3. 結帳金額達到您的會員等級門檻即享免運</li>
          </ol>
          <Link
            href="/auth/register"
            className="inline-block mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            立即加入會員
          </Link>
        </div>
      </div>
    </div>
  )
}
