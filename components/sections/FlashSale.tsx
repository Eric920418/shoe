'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Flame, ShoppingCart, ChevronRight, Zap } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS } from '@/graphql/queries'

// GraphQL 查詢：獲取限時搶購設定
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

const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // 查詢限時搶購設定
  const { data: flashSaleData } = useQuery(GET_FLASH_SALE, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000, // 每分鐘更新一次
  })

  const flashSaleConfig = flashSaleData?.activeFlashSale

  // 查詢產品資料
  const { data, loading, error } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      take: flashSaleConfig?.maxProducts || 20, // 使用後台設定的數量或預設20個
    },
    skip: !flashSaleConfig && !flashSaleData, // 如果沒有限時搶購設定且數據還在載入，跳過查詢
  })

  // 更新倒計時
  useEffect(() => {
    if (!flashSaleConfig?.endTime) {
      // 如果沒有後台數據，使用預設倒計時
      setTimeLeft({ hours: 2, minutes: 30, seconds: 45 })
      return
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime()
      const endTime = new Date(flashSaleConfig.endTime).getTime()
      const difference = endTime - now

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ hours, minutes, seconds })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // 立即更新一次
    updateTimeLeft()

    // 然後每秒更新
    const timer = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [flashSaleConfig])

  // 解析 products JSON
  const productsConfig = React.useMemo(() => {
    if (!flashSaleConfig?.products) return null
    try {
      return typeof flashSaleConfig.products === 'string'
        ? JSON.parse(flashSaleConfig.products)
        : flashSaleConfig.products
    } catch (e) {
      console.error('FlashSale: productsConfig 解析失敗', e)
      return null
    }
  }, [flashSaleConfig])

  // 處理產品資料
  const flashProducts = React.useMemo(() => {
    if (!data?.products) return []

    let productsToShow = []
    const productIds = productsConfig?.productIds || []
    const globalDiscount = productsConfig?.discountPercentage

    if (productIds && productIds.length > 0) {
      // 如果後台指定了產品ID，只顯示這些產品
      productsToShow = data.products.filter((p: any) => productIds.includes(p.id))
    } else {
      // 如果沒有指定產品，顯示所有有折扣的產品
      productsToShow = data.products
        .filter((p: any) => p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price))
    }

    return productsToShow
      .map((product: any) => {
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
        const image = images.length > 0 ? images[0] : '/api/placeholder/200/200'

        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          originalPrice,
          salePrice: price,
          image,
          sold: product.soldCount || 0,
          stock: product.stock || 100,
          discount
        }
      })
      // 按折扣率排序（折扣最大的在前）
      .sort((a: any, b: any) => b.discount - a.discount)
      // 限制數量
      .slice(0, flashSaleConfig?.maxProducts || 6)
  }, [data, flashSaleConfig, productsConfig])

  if (error) {
    console.error('載入限時搶購產品失敗:', error)
    return null
  }

  // 如果沒有限時搶購活動且數據已載入，不顯示組件
  if (!flashSaleConfig && flashSaleData !== undefined && flashProducts.length === 0) {
    return null
  }

  if (loading || (!flashSaleConfig && !data)) {
    return null
  }

  // 使用後台設定或預設值
  const title = flashSaleConfig?.name || '限時搶購'
  const description = productsConfig?.description || '每2小時更新一次商品'

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 my-4 sm:my-6">
      {/* 標題區 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2">
              <Zap size={16} className="sm:w-5 sm:h-5 animate-pulse" />
              <span className="font-bold text-sm sm:text-lg">{title}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-gray-700 text-xs sm:text-base">
              <Clock size={14} className="sm:w-[18px] sm:h-[18px] text-red-500" />
              <span className="font-medium hidden sm:inline">距離結束</span>
              <div className="flex gap-0.5 sm:gap-1 font-bold">
                <span className="bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-base">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-red-500">:</span>
                <span className="bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-base">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-red-500">:</span>
                <span className="bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-base">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {description && (
            <div className="hidden lg:flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full">
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm text-orange-700 font-medium">{description}</span>
            </div>
          )}
        </div>

        <Link
          href="/flash-sale"
          className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm sm:text-base"
        >
          <span className="hidden sm:inline">查看更多</span>
          <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
        </Link>
      </div>

      {/* 產品網格 */}
      {flashProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {flashProducts.map((product) => (
            <div
              key={product.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 rounded-lg overflow-hidden"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative">
                  {/* 商品圖片 */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />

                    {/* 折扣標籤 */}
                    {product.discount > 0 && (
                      <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 rounded-br-lg">
                        <span className="text-xs font-bold">{product.discount}% OFF</span>
                      </div>
                    )}

                    {/* 快速購買按鈕 */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium flex items-center gap-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform">
                        <ShoppingCart size={16} />
                        立即搶購
                      </button>
                    </div>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-2 sm:p-3">
                    <h3 className="font-medium text-xs sm:text-sm text-gray-800 mb-1 sm:mb-2 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                      {product.name}
                    </h3>

                    {/* 價格 */}
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span className="text-red-500 font-bold text-sm sm:text-lg">
                        ${product.salePrice}
                      </span>
                      {product.originalPrice > product.salePrice && (
                        <span className="text-gray-400 text-xs sm:text-sm line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* 進度條 */}
                    <div className="bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden mb-1">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((product.sold / product.stock) * 100, 100)}%` }}
                      />
                    </div>

                    {/* 已售出 */}
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      已搶購 <span className="text-red-500 font-medium">{product.sold}</span> 件
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FlashSale