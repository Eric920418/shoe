'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Tag, Flame, Star } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS } from '@/graphql/queries'

// GraphQL 查詢：獲取今日必搶配置
const GET_TODAYS_DEAL = gql`
  query GetTodaysDeal {
    todaysDeal {
      id
      title
      subtitle
      products
    }
  }
`

interface DailyDealsProps {
  serverProducts?: any[]
}

const DailyDeals = ({ serverProducts }: DailyDealsProps) => {
  // 查詢今日必搶配置
  const { data: dealConfigData } = useQuery(GET_TODAYS_DEAL, {
    fetchPolicy: 'cache-and-network',
  })

  const dealConfig = dealConfigData?.todaysDeal

  // 查詢產品資料（僅當沒有伺服器資料時）
  const { data, loading, error } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      take: 20,
    },
    skip: !!serverProducts || !dealConfig, // 如果有伺服器資料或沒有配置，跳過查詢
  })

  // 解析 products JSON
  const productsConfig = React.useMemo(() => {
    if (!dealConfig?.products) return null
    try {
      return typeof dealConfig.products === 'string'
        ? JSON.parse(dealConfig.products)
        : dealConfig.products
    } catch (e) {
      console.error('DailyDeals: productsConfig 解析失敗', e)
      return null
    }
  }, [dealConfig])

  // 處理產品資料 - 顯示多個產品
  const deals = React.useMemo(() => {
    const productsData = serverProducts || data?.products
    if (!productsData) return []

    let productsToShow = []
    const productIds = productsConfig?.productIds || []
    const maxProducts = productsConfig?.maxProducts || 4

    if (productIds && productIds.length > 0) {
      // 如果後台指定了產品ID，只顯示這些產品
      productsToShow = productsData.filter((p: any) => productIds.includes(p.id))
    } else {
      // 如果沒有指定產品，顯示所有有折扣的產品
      productsToShow = productsData
        .filter((p: any) => p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price))
    }

    return productsToShow
      .map((product: any) => {
        const price = parseFloat(product.price)
        const originalPrice = parseFloat(product.originalPrice) || price
        const soldCount = product.soldCount || 0
        const averageRating = product.averageRating ? parseFloat(product.averageRating) : 0
        const reviewCount = product.reviewCount || 0
        const images = Array.isArray(product.images) ? product.images : []
        const image = images.length > 0 ? images[0] : '/api/placeholder/300/300'

        // 決定標籤
        let tag = '特價'
        if (soldCount > 100) tag = '爆款'
        else if (soldCount > 50) tag = '熱賣'
        else if (averageRating >= 4.5 && reviewCount > 0) tag = '好評'
        else if (soldCount < 10) tag = '新品'

        return {
          id: product.id,
          slug: product.slug,
          brand: product.brand?.name || '品牌',
          name: product.name,
          originalPrice,
          salePrice: price,
          image,
          rating: averageRating,
          reviews: reviewCount,
          tag,
          sales: soldCount > 0 ? `已售 ${soldCount}` : '新品上架',
          soldCount,
          averageRating
        }
      })
      // 按銷量和評分綜合排序
      .sort((a: any, b: any) => {
        const scoreA = a.soldCount + (a.averageRating * 10)
        const scoreB = b.soldCount + (b.averageRating * 10)
        return scoreB - scoreA
      })
      // 限制數量
      .slice(0, maxProducts)
  }, [serverProducts, data, productsConfig])

  if (error) {
    console.error('載入今日特價產品失敗:', error)
    return null
  }

  if (loading || deals.length === 0) {
    return null
  }

  // 使用後台設定或預設值
  const title = dealConfig?.title || '今日特價'
  const subtitle = dealConfig?.subtitle || '每日10點更新'

  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-3 sm:p-6 my-4 sm:my-6">
      {/* 標題區 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 w-fit">
            <Calendar size={16} className="sm:w-5 sm:h-5" />
            <span className="font-bold text-sm sm:text-lg">{title}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Tag className="text-orange-600" size={14} />
            <span className="text-gray-700 font-medium text-xs sm:text-sm">{subtitle}</span>
          </div>
        </div>
        <Link href="/daily-deals" className="text-orange-600 hover:text-orange-700 font-medium text-sm sm:text-base">
          查看全部 →
        </Link>
      </div>

      {/* 商品網格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {deals.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
          >
            <Link href={`/products/${product.slug}`}>
              {/* 圖片區 */}
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* 標籤 */}
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex gap-1 sm:gap-2">
                  {product.tag === '爆款' && (
                    <span className="bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1">
                      <Flame size={10} className="sm:w-3 sm:h-3" />
                      {product.tag}
                    </span>
                  )}
                  {product.tag === '熱賣' && (
                    <span className="bg-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold">
                      {product.tag}
                    </span>
                  )}
                  {product.tag === '好評' && (
                    <span className="bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold">
                      {product.tag}
                    </span>
                  )}
                  {product.tag === '新品' && (
                    <span className="bg-purple-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold">
                      {product.tag}
                    </span>
                  )}
                </div>

                {/* 折扣百分比 */}
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-yellow-400 text-red-700 font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                  <span className="text-sm sm:text-lg">
                    {Math.round((1 - product.salePrice / product.originalPrice) * 100)}%
                  </span>
                  <span className="text-[10px] sm:text-xs block">OFF</span>
                </div>
              </div>

              {/* 商品信息 */}
              <div className="p-2 sm:p-4">
                {/* 品牌 */}
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1">{product.brand}</p>

                {/* 商品名稱 */}
                <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2 text-xs sm:text-sm">
                  {product.name}
                </h3>

                {/* 評分和銷量 */}
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Star className="text-yellow-400 fill-current" size={12} />
                    <span className="text-xs sm:text-sm text-gray-600">{product.rating}</span>
                  </div>
                  <span className="text-gray-300 hidden sm:inline">|</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 truncate">{product.sales}</span>
                </div>

                {/* 價格 */}
                <div className="flex items-end justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                      ${product.originalPrice}
                    </p>
                    <p className="text-base sm:text-xl font-bold text-red-500">
                      ${product.salePrice}
                    </p>
                  </div>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0">
                    搶購
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DailyDeals