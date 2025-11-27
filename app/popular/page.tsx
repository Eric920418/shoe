'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery, gql } from '@apollo/client'
import { Heart, ShoppingCart, Eye, Star, TrendingUp, Flame, Award, Trophy } from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'
import QuickAddToCartModal from '@/components/product/QuickAddToCartModal'

// GraphQL 查詢 - 獲取人氣產品
const GET_POPULAR_PRODUCTS = gql`
  query GetPopularProducts($take: Int, $sortBy: String) {
    products(take: $take, sortBy: $sortBy) {
      id
      name
      slug
      price
      originalPrice
      images
      soldCount
      averageRating
      reviewCount
      stock
    }
  }
`

export default function PopularPage() {
  const [activeTab, setActiveTab] = useState('trending')
  const [quickAddProduct, setQuickAddProduct] = useState<{ id: string; name: string } | null>(null)

  const tabs = [
    { id: 'trending', label: '熱銷榜', icon: TrendingUp, color: 'text-red-500', bgColor: 'from-red-500 to-orange-500', sortBy: 'soldCount' },
    { id: 'rated', label: '好評榜', icon: Star, color: 'text-yellow-500', bgColor: 'from-yellow-500 to-orange-500', sortBy: 'rating' },
    { id: 'viewed', label: '人氣榜', icon: Eye, color: 'text-blue-500', bgColor: 'from-blue-500 to-cyan-500', sortBy: 'views' },
    { id: 'discount', label: '折扣榜', icon: Flame, color: 'text-orange-500', bgColor: 'from-orange-500 to-red-500', sortBy: 'discount' }
  ]

  const currentTab = tabs.find(t => t.id === activeTab)

  // 從 API 獲取產品數據
  const { data, loading, error } = useQuery(GET_POPULAR_PRODUCTS, {
    variables: {
      take: 50,
      sortBy: currentTab?.sortBy || 'soldCount'
    },
    fetchPolicy: 'cache-and-network'
  })

  // 處理產品數據
  const currentProducts = React.useMemo(() => {
    if (!data?.products) return []

    return data.products.map((product: any, index: number) => {
      const images = Array.isArray(product.images) ? product.images : []
      const image = images.length > 0 ? images[0] : '/images/placeholder.png'
      const soldCount = product.soldCount || 0

      return {
        id: product.id,
        slug: product.slug,
        rank: index + 1,
        name: product.name,
        price: parseFloat(product.price),
        originalPrice: parseFloat(product.originalPrice) || parseFloat(product.price),
        sales: soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount.toString(),
        rating: product.averageRating?.toFixed(1) || '4.5',
        image,
        stock: product.stock || 0
      }
    })
  }, [data])

  const getRankBadge = (rank: number) => {
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
        {!loading && !error && currentProducts.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Trophy className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600 text-lg">目前沒有商品</p>
          </div>
        )}

        {/* 商品網格 */}
        {!loading && !error && currentProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentProducts.map((product: { id: string; slug: string; rank: number; name: string; price: number; originalPrice: number; sales: string; rating: string; image: string; stock: number }) => (
            <div
              key={product.id}
              className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
            >
              <Link href={`/products/${product.slug}`}>
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
                    <WishlistButton productId={product.id} size="sm" />
                  </div>

                  {/* 快速操作 */}
                  <div className="hidden md:block absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setQuickAddProduct({ id: product.id, name: product.name })
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
                      {product.originalPrice > product.price && (
                        <span className="text-gray-400 text-xs line-through">${product.originalPrice}</span>
                      )}
                    </div>
                    {product.originalPrice > product.price && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                      </span>
                    )}
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