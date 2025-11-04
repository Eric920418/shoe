'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Eye, Star, TrendingUp, Flame, Award } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS } from '@/graphql/queries'
import WishlistButton from '@/components/product/WishlistButton'
import QuickAddToCartModal from '@/components/product/QuickAddToCartModal'

// GraphQL 查詢：獲取熱門產品設定和產品
const GET_POPULAR_PRODUCTS = gql`
  query GetPopularProducts {
    popularProductsConfig {
      id
      title
      subtitle
      algorithm
      maxProducts
      isActive
      timeRange
    }
    popularProducts {
      id
      slug
      name
      price
      originalPrice
      images
      soldCount
      viewCount
      averageRating
      reviewCount
      stock
      category {
        name
        slug
      }
    }
  }
`

interface PopularProductsProps {
  serverProducts?: any[]
}

const PopularProducts = ({ serverProducts }: PopularProductsProps) => {
  const [activeTab, setActiveTab] = useState('trending')
  const [modalProduct, setModalProduct] = useState<{ id: string; name: string } | null>(null)

  const tabs = [
    { id: 'trending', label: '熱銷榜', icon: TrendingUp, color: 'text-red-500' },
    { id: 'rated', label: '好評榜', icon: Star, color: 'text-yellow-500' },
    { id: 'viewed', label: '人氣榜', icon: Eye, color: 'text-blue-500' },
    { id: 'discount', label: '折扣榜', icon: Flame, color: 'text-orange-500' }
  ]

  // 查詢熱門產品配置和數據（僅當沒有伺服器資料時）
  const { data: popularData } = useQuery(GET_POPULAR_PRODUCTS, {
    fetchPolicy: 'cache-first',
    skip: !!serverProducts,
  })

  // 查詢所有產品資料（僅當沒有伺服器資料時）
  const { data, loading, error } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      take: 25,
    },
    skip: !!serverProducts,
  })

  // 處理產品資料
  const products = React.useMemo(() => {
    const allProducts = serverProducts || data?.products

    // 如果有後台配置的熱門產品，優先使用
    let trendingProducts = []
    if (popularData?.popularProducts && popularData.popularProducts.length > 0) {
      trendingProducts = popularData.popularProducts.map((product: any, idx: number) => {
        const price = parseFloat(product.price)
        const originalPrice = parseFloat(product.originalPrice) || price
        const soldCount = product.soldCount || 0
        const viewCount = product.viewCount || 0
        const averageRating = product.averageRating ? parseFloat(product.averageRating) : 0
        const images = Array.isArray(product.images) ? product.images : []
        const image = images.length > 0 ? images[0] : '/api/placeholder/200/200'
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0

        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price,
          originalPrice,
          sales: soldCount > 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount.toString(),
          rating: averageRating,
          image,
          soldCount,
          viewCount,
          averageRating,
          discount,
          rank: idx + 1
        }
      })
    }

    if (!allProducts) {
      // 如果只有後台數據，返回熱銷榜使用後台數據，其他榜單為空
      return {
        trending: trendingProducts,
        rated: [],
        viewed: [],
        discount: []
      }
    }

    const processedProducts = allProducts.map((product: any) => {
      const price = parseFloat(product.price)
      const originalPrice = parseFloat(product.originalPrice) || price
      const soldCount = product.soldCount || 0
      const viewCount = product.viewCount || 0
      const averageRating = product.averageRating ? parseFloat(product.averageRating) : 0
      const images = Array.isArray(product.images) ? product.images : []
      const image = images.length > 0 ? images[0] : '/api/placeholder/200/200'
      const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price,
        originalPrice,
        sales: soldCount > 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount.toString(),
        rating: averageRating,
        image,
        soldCount,
        viewCount,
        averageRating,
        discount
      }
    })

    // 熱銷榜：優先使用後台數據，否則按銷量排序
    const trending = trendingProducts.length > 0
      ? trendingProducts
      : [...processedProducts]
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 8)
        .map((p, idx) => ({ ...p, rank: idx + 1 }))

    // 好評榜：按評分排序（至少有評分的）
    const rated = [...processedProducts]
      .filter(p => p.averageRating > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 8)
      .map((p, idx) => ({ ...p, rank: idx + 1 }))

    // 人氣榜：按瀏覽次數排序
    const viewed = [...processedProducts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 8)
      .map((p, idx) => ({ ...p, rank: idx + 1 }))

    // 折扣榜：按折扣率排序（有折扣的）
    const discount = [...processedProducts]
      .filter(p => p.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 8)
      .map((p, idx) => ({ ...p, rank: idx + 1 }))

    return { trending, rated, viewed, discount }
  }, [serverProducts, data, popularData])

  // 使用後台配置或預設值
  const config = popularData?.popularProductsConfig
  const title = config?.title || '人氣精選'
  const subtitle = config?.subtitle || '大家都在買'

  const currentProducts = products[activeTab] || products.trending
  const maxProducts = config?.maxProducts || 8
  const displayedProducts = currentProducts.slice(0, maxProducts)

  // 判斷是否有更多產品可以顯示
  const hasMoreProducts = currentProducts.length > maxProducts

  // 如果後台配置停用了該組件，不顯示
  if (config && !config.isActive) {
    return null
  }

  if (error) {
    console.error('載入人氣精選產品失敗:', error)
    return null
  }

  if (loading || currentProducts.length === 0) {
    return null
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-orange-400'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500'
    return 'bg-gray-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 my-4 sm:my-6">
      {/* 標題區 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <Award className="text-purple-500" size={20} />
          {title}
          <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1 sm:ml-2 hidden sm:inline">{subtitle}</span>
        </h2>

        {/* Tab 切換 */}
        <div className="flex gap-1 sm:gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={tab.color} size={14} />
                <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 商品網格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-4">
        {displayedProducts.map((product) => (
          <div
            key={product.id}
            className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
          >
            <Link href={`/products/${product.slug}`}>
              {/* 圖片區 */}
              <div className="relative aspect-square bg-gray-50">
                {/* 排名標誌 */}
                {product.rank <= 3 && (
                  <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 z-10 ${getRankBadge(product.rank)} text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-md`}>
                    {product.rank}
                  </div>
                )}

                {/* 商品圖 */}
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* 願望清單按鈕 - 右上角固定位置 */}
                <div className="absolute top-2 right-2 z-20">
                  <WishlistButton productId={product.id} size="sm" />
                </div>

                {/* 快速操作按鈕 - 手機版隱藏 */}
                <div className="hidden md:block absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setModalProduct({ id: product.id, name: product.name })
                      }}
                      className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors flex items-center gap-1"
                    >
                      <ShoppingCart size={18} />
                      <span className="text-sm font-medium">加入購物車</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 商品信息 */}
              <div className="p-2 sm:p-3">
                {/* 商品名 */}
                <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2 text-xs sm:text-sm min-h-[32px] sm:min-h-[40px]">
                  {product.name}
                </h3>

                {/* 銷量和評分 */}
                <div className="flex items-center justify-between mb-1 sm:mb-2 text-[10px] sm:text-xs">
                  <span className="text-gray-500 truncate">已售 {product.sales}</span>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      <Star className="text-yellow-400 fill-current" size={10} />
                      <span className="text-gray-600">{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* 價格 */}
                <div className="flex items-end justify-between gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:gap-2">
                    <span className="text-red-500 font-bold text-sm sm:text-lg">${product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-gray-400 text-[10px] sm:text-sm line-through">${product.originalPrice}</span>
                    )}
                  </div>
                  {product.discount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                      {Math.round(product.discount)}% OFF
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* 查看更多 - 只在有更多產品時顯示 */}
      {hasMoreProducts && (
        <div className="text-center mt-6">
          <Link
            href="/popular"
            className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            查看完整榜單
          </Link>
        </div>
      )}

      {/* 快速加入購物車 Modal */}
      {modalProduct && (
        <QuickAddToCartModal
          productId={modalProduct.id}
          productName={modalProduct.name}
          onClose={() => setModalProduct(null)}
        />
      )}
    </div>
  )
}

export default PopularProducts